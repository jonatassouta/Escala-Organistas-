import { Preferences } from '@capacitor/preferences';
import {
  Organist,
  AppSettings,
  GeneratedSchedule,
  RotationState,
  ServiceSlot,
  Contact,
  EnsaioRule,
} from '../models/types';

const KEYS = {
  ORGANISTS: 'organists',
  SETTINGS: 'settings',
  SCHEDULES: 'schedules',
  ROTATION: 'rotationState',
  INITIALIZED: 'initialized',
  SETTINGS_VERSION: 'settingsVersion',
};

const CURRENT_SETTINGS_VERSION = 3;

// Converts a contact name to title case: "IR. DORIVAL SILVA" → "Ir. Dorival Silva"
function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : ''))
    .join(' ');
}

const DEFAULT_RECOMMENDATIONS = `Recomendações às irmãs Organistas:

A organista que não conseguir tocar no seu dia na escala deverá entrar em contato com outra irmã organista para poder substituí-la com antecedência.

Sempre que possível, ter pelo menos uma irmã organista congregando para apoio, junto à irmã que está escalada (caso a irmã escalada tenha algum contratempo de última hora).

É de extrema importância a presença das organistas nos ensaios de sua congregação.

Deus abençoe!`;

const DEFAULT_CONTACTS: Contact[] = [
  { id: '1',  name: 'Ir. Dorival',       phone: '99999-0001' },
  { id: '2',  name: 'Ir. Lindomazio',    phone: '99999-0002' },
  { id: '3',  name: 'Ir. Gislaine',      phone: '99999-0003' },
  { id: '4',  name: 'Ir. Renato Munhoz', phone: '99999-0004' },
  { id: '5',  name: 'Ir. Edvanie',       phone: '99999-0005' },
  { id: '6',  name: 'Ir. Tiago Moreira', phone: '99999-0006' },
  { id: '7',  name: 'Ir. Adail',         phone: '99999-0007' },
  { id: '8',  name: 'Ir. Juliana',       phone: '99999-0008' },
  { id: '9',  name: 'Ir. Nelson',        phone: '99999-0009' },
  { id: '10', name: 'Ir. Joseane',       phone: '99999-0010' },
  { id: '11', name: 'Ir. Misael',        phone: '99999-0011' },
  { id: '12', name: 'Ir. Elisângela',    phone: '99999-0012' },
  { id: '13', name: 'Ir. Fabrício',      phone: '99999-0013' },
  { id: '14', name: 'Ir. Natalha',       phone: '99999-0014' },
  { id: '15', name: 'Ir. Paulo',         phone: '99999-0015' },
  { id: '16', name: 'Ir. Eduarda',       phone: '99999-0016' },
  { id: '17', name: 'Ir. João Luiz',     phone: '99999-0017' },
  { id: '18', name: 'Ir. Ana Lívia',     phone: '99999-0018' },
  { id: '19', name: 'Ir. Osvaldo',       phone: '99999-0019' },
  { id: '20', name: 'Ir. Cristiano',     phone: '99999-0020', phone2: '99999-0021' },
];

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

async function get<T>(key: string): Promise<T | null> {
  const { value } = await Preferences.get({ key });
  return value ? (JSON.parse(value) as T) : null;
}

async function set(key: string, value: unknown): Promise<void> {
  await Preferences.set({ key, value: JSON.stringify(value) });
}

async function ensureInitialized(): Promise<void> {
  const initialized = await get<boolean>(KEYS.INITIALIZED);
  if (initialized) return;

  const defaultOrganists: Organist[] = [
    { id: generateId(), name: 'Natalha',    role: 'CO',    restrictions: [] },
    { id: generateId(), name: 'Juliana',    role: 'CO',    restrictions: [] },
    { id: generateId(), name: 'Elisângela', role: 'ambos', restrictions: [] },
    { id: generateId(), name: 'Eduarda',    role: 'RJM',   restrictions: [] },
    { id: generateId(), name: 'Ana Livia',  role: 'RJM',   restrictions: [] },
  ];
  await set(KEYS.ORGANISTS, defaultOrganists);

  const natalha = defaultOrganists[0];

  const defaultSlots: ServiceSlot[] = [
    { id: generateId(), dayOfWeek: 0, label: 'RJM', mode: 'rotativo' },
    { id: generateId(), dayOfWeek: 0, label: 'CO', mode: 'fixo', fixedOrganistId: natalha.id },
    { id: generateId(), dayOfWeek: 1, label: 'CO', mode: 'rotativo' },
    { id: generateId(), dayOfWeek: 4, label: 'CO', mode: 'rotativo' },
  ];

  const defaultEnsaioRule: EnsaioRule = {
    enabled: true,
    type: 'nth_weekday',
    weekday: 5,
    nth: 4,
  };

  const defaultSettings: AppSettings = {
    docTitle: 'Rodízio de Organistas',
    congregationName: 'Parque das Hortências',
    city: 'Araraquara – SP',
    serviceSlots: defaultSlots,
    ensaioRule: defaultEnsaioRule,
    recommendations: DEFAULT_RECOMMENDATIONS,
    contacts: DEFAULT_CONTACTS,
    pdfFontSizes: { calendar: 7.5, recommendations: 9, contacts: 9 },
    useStrictOrder: true,
  };
  await set(KEYS.SETTINGS, defaultSettings);
  await set(KEYS.SCHEDULES, []);
  await set(KEYS.ROTATION, {});
  await set(KEYS.INITIALIZED, true);
}

// Organists CRUD
export async function getOrganists(): Promise<Organist[]> {
  await ensureInitialized();
  const list = (await get<Organist[]>(KEYS.ORGANISTS)) ?? [];
  // Migrate: organists created before the role field existed have role=undefined.
  // Set them explicitly to 'ambos' so the UI shows and the schedule filter works.
  let dirty = false;
  for (const o of list) {
    if (!o.role) { o.role = 'ambos'; dirty = true; }
  }
  if (dirty) await set(KEYS.ORGANISTS, list);
  return list;
}

export async function saveOrganist(organist: Organist): Promise<void> {
  const list = await getOrganists();
  const idx = list.findIndex((o) => o.id === organist.id);
  if (idx >= 0) list[idx] = organist;
  else list.push({ ...organist, id: organist.id || generateId() });
  await set(KEYS.ORGANISTS, list);
}

export async function deleteOrganist(id: string): Promise<void> {
  const list = await getOrganists();
  await set(KEYS.ORGANISTS, list.filter((o) => o.id !== id));
}

export function createOrganist(name: string): Organist {
  return { id: generateId(), name, role: 'ambos', restrictions: [] };
}

export function createRestriction(
  type: 'weekday' | 'specific_date',
  weekday?: number,
  date?: string,
): import('../models/types').Restriction {
  return {
    id: generateId(),
    type,
    weekday,
    date,
    label:
      type === 'weekday'
        ? ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][weekday ?? 0]
        : date ?? '',
  };
}

// Settings CRUD
export async function getSettings(): Promise<AppSettings> {
  await ensureInitialized();
  const s = await get<AppSettings>(KEYS.SETTINGS);
  if (s) {
    // Backfill field added after initial release
    if (!s.pdfFontSizes) {
      s.pdfFontSizes = { calendar: 6, recommendations: 7, contacts: 7 };
    }

    // Versioned migration: apply once per version upgrade
    const version = (await get<number>(KEYS.SETTINGS_VERSION)) ?? 1;
    if (version < CURRENT_SETTINGS_VERSION) {
      // v2: corrected recommendations text + updated font sizes
      s.recommendations = DEFAULT_RECOMMENDATIONS;
      s.pdfFontSizes = { calendar: 7.5, recommendations: 9, contacts: 9 };

      // v3: convert all contact names to title case
      if (s.contacts) {
        s.contacts = s.contacts.map((c) => ({ ...c, name: toTitleCase(c.name) }));
      }

      await set(KEYS.SETTINGS, s);
      await set(KEYS.SETTINGS_VERSION, CURRENT_SETTINGS_VERSION);
    }

    return s;
  }
  // fallback: re-init
  await set(KEYS.INITIALIZED, false);
  await ensureInitialized();
  await set(KEYS.SETTINGS_VERSION, CURRENT_SETTINGS_VERSION);
  return (await get<AppSettings>(KEYS.SETTINGS))!;
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await set(KEYS.SETTINGS, settings);
}

// Schedules
export async function getSchedules(): Promise<GeneratedSchedule[]> {
  await ensureInitialized();
  return (await get<GeneratedSchedule[]>(KEYS.SCHEDULES)) ?? [];
}

export async function saveSchedule(schedule: GeneratedSchedule): Promise<void> {
  const list = await getSchedules();
  const idx = list.findIndex((s) => s.id === schedule.id);
  if (idx >= 0) list[idx] = schedule;
  else list.unshift(schedule); // newest first
  await set(KEYS.SCHEDULES, list);
}

export async function deleteSchedule(id: string): Promise<void> {
  const list = await getSchedules();
  await set(KEYS.SCHEDULES, list.filter((s) => s.id !== id));
}

// Rotation state
export async function getRotationState(): Promise<RotationState> {
  return (await get<RotationState>(KEYS.ROTATION)) ?? {};
}

export async function saveRotationState(state: RotationState): Promise<void> {
  await set(KEYS.ROTATION, state);
}

export { generateId };

// Resets all app data to factory defaults (organists, settings, schedules, rotation).
export async function resetToDefaults(): Promise<void> {
  await Preferences.remove({ key: KEYS.ORGANISTS });
  await Preferences.remove({ key: KEYS.SETTINGS });
  await Preferences.remove({ key: KEYS.SCHEDULES });
  await Preferences.remove({ key: KEYS.ROTATION });
  await Preferences.remove({ key: KEYS.SETTINGS_VERSION });
  await Preferences.remove({ key: KEYS.INITIALIZED });
  await ensureInitialized();
  await set(KEYS.SETTINGS_VERSION, CURRENT_SETTINGS_VERSION);
}

// Removes emoji and special symbols from text input fields.
// Uses a denylist: strips above-BMP emoji, BMP symbol/emoji blocks,
// variation selectors and zero-width chars that break PDF rendering.
export function stripEmoji(text: string): string {
  return text
    .replace(/[𐀀-􏿿]/gu, "")   // above-BMP emoji: 😀 📌 etc.
    .replace(/[←-⯿]/g, "")              // BMP symbol/emoji blocks: → ★ ✓ etc.
    .replace(/[︀-️​-‍﻿]/g, ""); // variation selectors + ZWS/ZWJ/BOM
}
