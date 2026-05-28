export interface Restriction {
  id: string;
  type: 'weekday' | 'specific_date';
  weekday?: number; // 0=Dom, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sáb
  date?: string; // 'YYYY-MM-DD'
  label?: string;
}

export type OrganistRole = 'RJM' | 'CO' | 'ambos';

export interface Organist {
  id: string;
  name: string;
  role: OrganistRole; // which slots she can be assigned to
  restrictions: Restriction[];
}

export interface ServiceSlot {
  id: string;
  dayOfWeek: number; // 0–6
  label?: string; // 'RJM', 'CO', or empty
  mode: 'rotativo' | 'fixo';
  fixedOrganistId?: string;
}

export interface Contact {
  id: string;
  name: string;
  phone: string;
  phone2?: string;
}

export interface EnsaioRule {
  enabled: boolean;
  type: 'last_weekday' | 'nth_weekday' | 'manual';
  weekday: number; // 0–6, default 5 (Friday)
  nth?: number; // for nth_weekday: 1..4 or -1 for last
}

export interface PdfFontSizes {
  calendar: number;       // base size for day numbers and organist names in cells
  recommendations: number;
  contacts: number;
}

export interface AppSettings {
  docTitle: string;
  congregationName: string;
  city: string;
  serviceSlots: ServiceSlot[];
  ensaioRule: EnsaioRule;
  recommendations: string;
  contacts: Contact[];
  pdfFontSizes: PdfFontSizes;
  useStrictOrder?: boolean; // true (default) = fixed sequential order; false = balanced equal distribution
}

export interface SlotAssignment {
  slotId: string;
  slotLabel?: string;
  organistId: string;
  organistName: string;
}

export interface DayAssignment {
  date: string; // 'YYYY-MM-DD'
  isEnsaio?: boolean;
  slots: SlotAssignment[];
}

export interface GeneratedSchedule {
  id: string;
  generatedAt: string;
  startMonth: string; // 'YYYY-MM'
  assignments: DayAssignment[];
  warnings: string[];
}

export interface RotationState {
  [slotId: string]: string[]; // ordered list of organistIds (next to play first)
}

export const WEEKDAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
export const WEEKDAY_NAMES_FULL = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
export const MONTH_NAMES_PT = [
  'JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO',
  'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO',
];
export const MONTH_NAMES_SHORT = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
];
