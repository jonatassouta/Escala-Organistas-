import React from 'react';
import { DayAssignment, MONTH_NAMES_PT } from '../../models/types';
import { getMonthWeeks } from '../../services/schedule.service';

interface Props {
  startMonth: string; // 'YYYY-MM'
  assignments: DayAssignment[];
}

const HEADER_COLS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function padZ(n: number): string {
  return String(n).padStart(2, '0');
}

const CalendarGrid: React.FC<Props> = ({ startMonth, assignments }) => {
  const [yearStr, monthStr] = startMonth.split('-');
  const startYear = parseInt(yearStr, 10);
  const startMonthNum = parseInt(monthStr, 10) - 1;

  const months: [number, number][] = [];
  for (let i = 0; i < 3; i++) {
    const year = startYear + Math.floor((startMonthNum + i) / 12);
    const month = (startMonthNum + i) % 12;
    months.push([year, month]);
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────
  type OrgCount = { total: number; byLabel: Map<string, number> };

  function buildCounts(days: DayAssignment[]): Map<string, OrgCount> {
    const map = new Map<string, OrgCount>();
    for (const day of days) {
      for (const slot of day.slots) {
        const entry = map.get(slot.organistName) ?? { total: 0, byLabel: new Map<string, number>() };
        entry.total++;
        const lbl = slot.slotLabel?.trim() || 'CO';
        entry.byLabel.set(lbl, (entry.byLabel.get(lbl) ?? 0) + 1);
        map.set(slot.organistName, entry);
      }
    }
    return map;
  }

  function renderBreakdown(entry: OrgCount): React.ReactNode {
    const parts = [...entry.byLabel.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    if (parts.length <= 1 && parts[0]?.[0] === 'CO') {
      // only CO — skip label, just show count
      return <>{entry.total} culto{entry.total !== 1 ? 's' : ''}</>;
    }
    return (
      <>
        {entry.total} culto{entry.total !== 1 ? 's' : ''}{' '}
        <span style={{ opacity: 0.75 }}>
          ({parts.map(([lbl, n]) => `${lbl}: ${n}`).join(' · ')})
        </span>
      </>
    );
  }

  // ── Total trimestre (all 3 months) ─────────────────────────────────────────
  const totalCounts = buildCounts(assignments);
  const sortedTotal = [...totalCounts.entries()].sort((a, b) => b[1].total - a[1].total);

  return (
    <div>
      {/* ── Barra de total do trimestre (somente no app, não aparece no PDF) ── */}
      {sortedTotal.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '4px 14px',
            background: 'var(--ion-color-primary)',
            borderRadius: 6,
            padding: '6px 12px',
            marginBottom: 16,
            fontSize: 12,
            color: 'white',
          }}
        >
          <span style={{ fontWeight: 700, marginRight: 4, whiteSpace: 'nowrap' }}>
            Total trimestre:
          </span>
          {sortedTotal.map(([name, entry]) => (
            <span key={name} style={{ whiteSpace: 'nowrap' }}>
              <strong>{name}</strong>{': '}{renderBreakdown(entry)}
            </span>
          ))}
        </div>
      )}

      {months.map(([year, month]) => {
        const weeks = getMonthWeeks(year, month);

        // ── Contagem por mês (somente no app, não aparece no PDF) ─────────────
        const monthPrefix = `${year}-${padZ(month + 1)}`;
        const monthCounts = buildCounts(assignments.filter((a) => a.date.startsWith(monthPrefix)));
        const sortedCounts = [...monthCounts.entries()].sort((a, b) => b[1].total - a[1].total);

        return (
          <div key={`${year}-${month}`} style={{ marginBottom: 24 }}>
            {/* Legenda mensal */}
            {sortedCounts.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  gap: '4px 14px',
                  background: 'var(--ion-color-light)',
                  borderRadius: 6,
                  padding: '5px 10px',
                  marginBottom: 6,
                  fontSize: 12,
                  color: 'var(--ion-color-medium-shade)',
                }}
              >
                {sortedCounts.map(([name, entry]) => (
                  <span key={name} style={{ whiteSpace: 'nowrap' }}>
                    <strong style={{ color: 'var(--ion-color-dark)' }}>{name}</strong>
                    {': '}{renderBreakdown(entry)}
                  </span>
                ))}
              </div>
            )}

            <h3
              style={{
                textAlign: 'center',
                fontWeight: 700,
                color: 'var(--ion-color-primary)',
                marginBottom: 8,
                textTransform: 'uppercase',
              }}
            >
              {MONTH_NAMES_PT[month]} {year}
            </h3>
            <div style={{ overflowX: 'auto' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, minmax(75px, 1fr))',
                gap: 2,
                fontSize: 12,
              }}
            >
              {HEADER_COLS.map((h) => (
                <div
                  key={h}
                  style={{
                    textAlign: 'center',
                    fontWeight: 700,
                    background: '#E8956D',
                    padding: '4px 2px',
                    borderRadius: 4,
                    fontSize: 11,
                  }}
                >
                  {h}
                </div>
              ))}
              {weeks.map((week, wi) =>
                week.map((day, dow) => {
                  if (day === null) {
                    return <div key={`${wi}-${dow}`} />;
                  }
                  const dateStr = `${year}-${padZ(month + 1)}-${padZ(day)}`;
                  const assignment = assignments.find((a) => a.date === dateStr);
                  const isEnsaio = assignment?.isEnsaio ?? false;
                  const hasOrganists = assignment && assignment.slots.length > 0;

                  return (
                    <div
                      key={`${wi}-${dow}`}
                      style={{
                        minHeight: 52,
                        border: '1px solid #ddd',
                        borderRadius: 4,
                        padding: '2px 3px',
                        background: hasOrganists
                          ? 'var(--ion-color-light)'
                          : isEnsaio
                          ? '#FFF3CD'
                          : 'white',
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: 11, marginBottom: 2 }}>{day}</div>
                      {assignment?.slots.map((slot) => (
                        <div key={slot.slotId} style={{ fontSize: 10, lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {slot.slotLabel ? (
                            <span>
                              <strong>{slot.slotLabel}:</strong> {slot.organistName}
                            </span>
                          ) : (
                            <span>{slot.organistName}</span>
                          )}
                        </div>
                      ))}
                      {isEnsaio && (
                        <div style={{ fontSize: 9, color: '#856404', fontStyle: 'italic', whiteSpace: 'nowrap' }}>
                          Ensaio
                        </div>
                      )}
                    </div>
                  );
                }),
              )}
            </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CalendarGrid;
