import {
  Organist,
  AppSettings,
  DayAssignment,
  GeneratedSchedule,
  RotationState,
  SlotAssignment,
} from '../models/types';
import { generateId } from './storage.service';

function padZ(n: number): string {
  return String(n).padStart(2, '0');
}

function toDateStr(date: Date): string {
  return `${date.getFullYear()}-${padZ(date.getMonth() + 1)}-${padZ(date.getDate())}`;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getLastWeekdayOfMonth(year: number, month: number, weekday: number): Date {
  const lastDay = daysInMonth(year, month);
  const d = new Date(year, month, lastDay);
  while (d.getDay() !== weekday) {
    d.setDate(d.getDate() - 1);
  }
  return d;
}

function getNthWeekdayOfMonth(year: number, month: number, weekday: number, nth: number): Date {
  if (nth === -1) return getLastWeekdayOfMonth(year, month, weekday);
  const d = new Date(year, month, 1);
  while (d.getDay() !== weekday) {
    d.setDate(d.getDate() + 1);
  }
  d.setDate(d.getDate() + (nth - 1) * 7);
  return d;
}

export function getEnsaioDates(year: number, month: number, rule: AppSettings['ensaioRule']): Set<string> {
  if (!rule.enabled || rule.type === 'manual') return new Set();
  let d: Date;
  if (rule.type === 'last_weekday') {
    d = getLastWeekdayOfMonth(year, month, rule.weekday);
  } else {
    d = getNthWeekdayOfMonth(year, month, rule.weekday, rule.nth ?? -1);
  }
  return new Set([toDateStr(d)]);
}

function hasRestriction(organist: Organist, date: Date): boolean {
  const weekday = date.getDay();
  const dateStr = toDateStr(date);
  return organist.restrictions.some(
    (r) =>
      (r.type === 'weekday' && r.weekday === weekday) ||
      (r.type === 'specific_date' && r.date === dateStr),
  );
}

// Returns the ISO-week start (Monday) for a date, as 'YYYY-MM-DD'.
// Used to prevent assigning the same organist more than once per week.
function getWeekStart(date: Date): string {
  const d = new Date(date);
  const dow = d.getDay(); // 0=Sun, 1=Mon..., 6=Sat
  // Shift back to Monday: Sunday goes back 6 days, others go back (dow-1)
  d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1));
  return toDateStr(d);
}

export function getTrimesterLabel(startMonth: string): string {
  const [yearStr, monthStr] = startMonth.split('-');
  const month = parseInt(monthStr, 10); // 1-based
  const year = parseInt(yearStr, 10);
  const quarter = Math.ceil(month / 3);
  return `${quarter}°.trimestre/${year}`;
}

export function getNextMonth(): string {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return `${next.getFullYear()}-${padZ(next.getMonth() + 1)}`;
}

function isEligibleForSlot(role: import('../models/types').OrganistRole, slotLabel?: string): boolean {
  if (role === 'ambos') return true;
  // Slots without label (or empty label) are treated as CO
  const label = (slotLabel || 'CO').toUpperCase();
  if (role === 'RJM') return label === 'RJM';
  if (role === 'CO') return label === 'CO';
  return false;
}

export function generateSchedule(
  startMonth: string,
  organists: Organist[],
  settings: AppSettings,
  rotationState: RotationState,
): { schedule: GeneratedSchedule; newRotationState: RotationState } {
  const [yearStr, monthStr] = startMonth.split('-');
  const startYear = parseInt(yearStr, 10);
  const startMonthNum = parseInt(monthStr, 10) - 1; // 0-based

  const warnings: string[] = [];
  const assignments: DayAssignment[] = [];

  // Whether to use fixed sequential (FIFO) order or balanced equal-distribution mode.
  const strictOrder = settings.useStrictOrder ?? true;

  // Tracks how many times each organist has been assigned per label group.
  // Used in balanced mode (strictOrder=false) to pick the organist with fewest services.
  // Also updated in strict mode so counts are always available.
  const assignmentCounts = new Map<string, Map<string, number>>();
  const getCount = (g: string, id: string) => assignmentCounts.get(g)?.get(id) ?? 0;
  const addCount = (g: string, id: string) => {
    if (!assignmentCounts.has(g)) assignmentCounts.set(g, new Map());
    const m = assignmentCounts.get(g)!;
    m.set(id, (m.get(id) ?? 0) + 1);
  };

  // Build rotation queues per slot
  const queues: { [slotId: string]: string[] } = {};
  // Tracks organists already assigned within each ISO week, per label group.
  // Key = 'YYYY-MM-DD:groupKey' (week-start:label). Keeps RJM and CO counters separate
  // so that playing CO on Thursday does NOT block an 'ambos' organist from playing RJM
  // on Sunday of the same week. Same-day exclusion is handled by assignedTodayIds.
  const assignedThisWeekMap = new Map<string, Set<string>>();
  // Tracks the last organist assigned to each rotativo label group (e.g. 'CO', 'RJM').
  // Prevents the same organist from playing two consecutive rotativo services.
  // Fixed slots do NOT update this map — they are excluded from the calculation.
  const lastByLabel = new Map<string, string>();

  // Pre-compute which organists are fixed for each label group.
  // They must be excluded from rotativo queues of the same group —
  // their fixed slot already guarantees a weekly appearance and they
  // must not take rotativo spots (which would cause consecutive services).
  const fixedOrganistsByGroup = new Map<string, Set<string>>();
  for (const s of settings.serviceSlots) {
    if (s.mode === 'fixo' && s.fixedOrganistId) {
      const gk = s.label || s.id;
      if (!fixedOrganistsByGroup.has(gk)) fixedOrganistsByGroup.set(gk, new Set());
      fixedOrganistsByGroup.get(gk)!.add(s.fixedOrganistId);
    }
  }

  for (const slot of settings.serviceSlots) {
    if (slot.mode !== 'rotativo') continue;
    const groupKey = slot.label || slot.id;
    // All rotativo slots that share the same label group draw from ONE shared queue.
    // This guarantees a single global sequential order per label (e.g. one CO queue
    // shared by Monday, Thursday and Sunday CO slots: Natalha→Elisângela→Juliana→…).
    if (queues[groupKey]) continue; // queue already built for this group
    const rotativos = organists
      .filter((o) => !fixedOrganistsByGroup.get(groupKey)?.has(o.id))
      .filter((o) => isEligibleForSlot(o.role ?? 'ambos', slot.label))
      .map((o) => o.id);
    const saved = rotationState[groupKey]; // keyed by groupKey, not slot.id
    if (saved && saved.length > 0) {
      // Use saved order, but include any new organists
      const newOnes = rotativos.filter((id) => !saved.includes(id));
      queues[groupKey] = [...saved.filter((id) => rotativos.includes(id)), ...newOnes];
    } else {
      queues[groupKey] = [...rotativos];
    }
  }

  // Iterate over 3 months
  for (let mo = 0; mo < 3; mo++) {
    const year = startYear + Math.floor((startMonthNum + mo) / 12);
    const month = (startMonthNum + mo) % 12;
    const numDays = daysInMonth(year, month);

    const ensaioDates = getEnsaioDates(year, month, settings.ensaioRule);

    for (let day = 1; day <= numDays; day++) {
      const date = new Date(year, month, day);
      const dateStr = toDateStr(date);
      const dayOfWeek = date.getDay();
      const weekKey = getWeekStart(date);

      // Helper: lazily get or create the per-label weekly set.
      // Key format: 'YYYY-MM-DD:groupKey' isolates CO from RJM so an 'ambos'
      // organist can play both labels in the same ISO week.
      function weekLabelSet(groupKey: string): Set<string> {
        const k = `${weekKey}:${groupKey}`;
        if (!assignedThisWeekMap.has(k)) assignedThisWeekMap.set(k, new Set());
        return assignedThisWeekMap.get(k)!;
      }

      // Process fixo slots before rotativo so fixed organists are excluded from the rotation
      const daySlots = settings.serviceSlots
        .filter((s) => s.dayOfWeek === dayOfWeek)
        .sort((a, b) => (a.mode === 'fixo' ? -1 : 1));
      const isEnsaio = ensaioDates.has(dateStr);

      if (daySlots.length === 0 && !isEnsaio) continue;

      const slotAssignments: SlotAssignment[] = [];
      // Track organists already assigned today to avoid duplicates on the same day
      const assignedTodayIds = new Set<string>();

      // ── Look-ahead: find "forced" organists for future slots this week ────────
      // An organist is "reserved" for a groupKey if she is the ONLY non-restricted
      // candidate for any remaining rotativo slot later in the same ISO week.
      // Prefer non-reserved organists for the current slot so the forced organist
      // is available when her slot arrives (avoids consecutive-service violations).
      const reservedByGroup = new Map<string, Set<string>>();
      {
        const daysUntilSunday = date.getDay() === 0 ? 0 : 7 - date.getDay();
        for (let ahead = 1; ahead <= daysUntilSunday; ahead++) {
          const futureDate = new Date(year, month, day + ahead);
          if (getWeekStart(futureDate) !== weekKey) break;
          const futureDow = futureDate.getDay();
          for (const fSlot of settings.serviceSlots) {
            if (fSlot.dayOfWeek !== futureDow || fSlot.mode !== 'rotativo') continue;
            const fgk = fSlot.label || fSlot.id;
            const fQueue = queues[fgk] ?? [];
            const eligible = fQueue.filter((id) => {
              const org = organists.find((o) => o.id === id);
              return org && !hasRestriction(org, futureDate);
            });
            if (eligible.length === 1) {
              if (!reservedByGroup.has(fgk)) reservedByGroup.set(fgk, new Set());
              reservedByGroup.get(fgk)!.add(eligible[0]);
            }
          }
        }
      }

      for (const slot of daySlots) {
        if (slot.mode === 'fixo') {
          const organist = organists.find((o) => o.id === slot.fixedOrganistId);
          if (!organist) {
            warnings.push(`Slot fixo sem organista configurada em ${dateStr}`);
            continue;
          }
          if (hasRestriction(organist, date)) {
            warnings.push(`${organist.name} tem restrição em ${dateStr} (slot fixo)`);
            continue;
          }
          assignedTodayIds.add(organist.id);
          // Track fixo organist in the per-label weekly set for her slot's label
          weekLabelSet(slot.label || slot.id).add(organist.id);
          // Count fixo assignments so balanced mode has accurate totals
          addCount(slot.label || slot.id, organist.id);
          slotAssignments.push({
            slotId: slot.id,
            slotLabel: slot.label,
            organistId: organist.id,
            organistName: organist.name,
          });
        } else {
          const groupKey = slot.label || slot.id;
          const queue = queues[groupKey] ?? [];
          let assigned = false;
          const lastInGroup = lastByLabel.get(groupKey);
          const assignedThisWeekForLabel = weekLabelSet(groupKey);

          if (strictOrder) {
            // ── STRICT ORDER MODE (FIFO) ──────────────────────────────────────
            // Pass 1a: full rules + prefer non-reserved (look-ahead)
            for (let qi = 0; qi < queue.length; qi++) {
              const organistId = queue[qi];
              const organist = organists.find((o) => o.id === organistId);
              if (!organist) continue;
              if (
                !hasRestriction(organist, date) &&
                !assignedTodayIds.has(organistId) &&
                !assignedThisWeekForLabel.has(organistId) &&
                organistId !== lastInGroup &&
                !reservedByGroup.get(groupKey)?.has(organistId)
              ) {
                queue.splice(qi, 1);
                queue.push(organistId);
                assignedTodayIds.add(organistId);
                assignedThisWeekForLabel.add(organistId);
                lastByLabel.set(groupKey, organistId);
                addCount(groupKey, organistId);
                slotAssignments.push({
                  slotId: slot.id,
                  slotLabel: slot.label,
                  organistId: organist.id,
                  organistName: organist.name,
                });
                assigned = true;
                break;
              }
            }

            // Pass 1b: full rules, ignore reservation (all candidates are reserved)
            if (!assigned) {
              for (let qi = 0; qi < queue.length; qi++) {
                const organistId = queue[qi];
                const organist = organists.find((o) => o.id === organistId);
                if (!organist) continue;
                if (
                  !hasRestriction(organist, date) &&
                  !assignedTodayIds.has(organistId) &&
                  !assignedThisWeekForLabel.has(organistId) &&
                  organistId !== lastInGroup
                ) {
                  queue.splice(qi, 1);
                  queue.push(organistId);
                  assignedTodayIds.add(organistId);
                  assignedThisWeekForLabel.add(organistId);
                  lastByLabel.set(groupKey, organistId);
                  addCount(groupKey, organistId);
                  slotAssignments.push({
                    slotId: slot.id,
                    slotLabel: slot.label,
                    organistId: organist.id,
                    organistName: organist.name,
                  });
                  assigned = true;
                  break;
                }
              }
            }

            // Pass 2: fallback — ignore both weekly and consecutive rules
            // (e.g. only one organist registered, or all are restricted)
            if (!assigned) {
              for (let qi = 0; qi < queue.length; qi++) {
                const organistId = queue[qi];
                const organist = organists.find((o) => o.id === organistId);
                if (!organist) continue;
                if (!hasRestriction(organist, date) && !assignedTodayIds.has(organistId)) {
                  queue.splice(qi, 1);
                  queue.push(organistId);
                  assignedTodayIds.add(organistId);
                  assignedThisWeekForLabel.add(organistId);
                  lastByLabel.set(groupKey, organistId);
                  addCount(groupKey, organistId);
                  slotAssignments.push({
                    slotId: slot.id,
                    slotLabel: slot.label,
                    organistId: organist.id,
                    organistName: organist.name,
                  });
                  assigned = true;
                  break;
                }
              }
            }
          } else {
            // ── BALANCED MODE (fewest assignments first) ──────────────────────
            // Pass 1: collect all eligible candidates (weekly + consecutive rules),
            //         sort by assignment count ascending, break ties by queue position.
            const eligible1 = queue
              .map((id, qi) => ({ id, qi, organist: organists.find((o) => o.id === id) }))
              .filter(
                ({ organist, id }) =>
                  organist &&
                  !hasRestriction(organist, date) &&
                  !assignedTodayIds.has(id) &&
                  !assignedThisWeekForLabel.has(id) &&
                  id !== lastInGroup,
              )
              .sort((a, b) => {
                // Prefer non-reserved (look-ahead: don't use forced organist early)
                const ra = reservedByGroup.get(groupKey)?.has(a.id) ? 1 : 0;
                const rb = reservedByGroup.get(groupKey)?.has(b.id) ? 1 : 0;
                return ra - rb
                  || getCount(groupKey, a.id) - getCount(groupKey, b.id)
                  || a.qi - b.qi;
              });

            if (eligible1.length > 0) {
              const { id: organistId, qi, organist } = eligible1[0];
              queue.splice(qi, 1);
              queue.push(organistId);
              assignedTodayIds.add(organistId);
              assignedThisWeekForLabel.add(organistId);
              lastByLabel.set(groupKey, organistId);
              addCount(groupKey, organistId);
              slotAssignments.push({
                slotId: slot.id,
                slotLabel: slot.label,
                organistId: organist!.id,
                organistName: organist!.name,
              });
              assigned = true;
            }

            // Pass 2: fallback — ignore weekly and consecutive rules,
            //         still sort by fewest assignments first.
            if (!assigned) {
              const eligible2 = queue
                .map((id, qi) => ({ id, qi, organist: organists.find((o) => o.id === id) }))
                .filter(
                  ({ organist, id }) =>
                    organist &&
                    !hasRestriction(organist, date) &&
                    !assignedTodayIds.has(id),
                )
                .sort(
                  (a, b) =>
                    getCount(groupKey, a.id) - getCount(groupKey, b.id) || a.qi - b.qi,
                );

              if (eligible2.length > 0) {
                const { id: organistId, qi, organist } = eligible2[0];
                queue.splice(qi, 1);
                queue.push(organistId);
                assignedTodayIds.add(organistId);
                assignedThisWeekForLabel.add(organistId);
                lastByLabel.set(groupKey, organistId);
                addCount(groupKey, organistId);
                slotAssignments.push({
                  slotId: slot.id,
                  slotLabel: slot.label,
                  organistId: organist!.id,
                  organistName: organist!.name,
                });
                assigned = true;
              }
            }
          }

          if (!assigned) {
            warnings.push(`Nenhuma organista disponível para ${dateStr} (slot: ${slot.label || slot.dayOfWeek})`);
          }
        }
      }

      assignments.push({ date: dateStr, isEnsaio, slots: slotAssignments });
    }
  }

  const newRotationState: RotationState = { ...rotationState };
  for (const [gk, queue] of Object.entries(queues)) {
    newRotationState[gk] = queue; // keyed by groupKey ('CO', 'RJM', etc.)
  }

  const schedule: GeneratedSchedule = {
    id: generateId(),
    generatedAt: new Date().toISOString(),
    startMonth,
    assignments,
    warnings,
  };

  return { schedule, newRotationState };
}

export function getMonthWeeks(year: number, month: number): (number | null)[][] {
  const firstDay = new Date(year, month, 1).getDay();
  const numDays = daysInMonth(year, month);
  const weeks: (number | null)[][] = [];
  let week: (number | null)[] = new Array(7).fill(null);
  let dow = firstDay;

  for (let day = 1; day <= numDays; day++) {
    week[dow] = day;
    if (dow === 6 || day === numDays) {
      weeks.push([...week]);
      week = new Array(7).fill(null);
    }
    dow = (dow + 1) % 7;
  }

  return weeks;
}
