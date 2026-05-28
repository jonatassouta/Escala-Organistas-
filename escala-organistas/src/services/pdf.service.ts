// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import {
  AppSettings,
  DayAssignment,
  GeneratedSchedule,
  MONTH_NAMES_PT,
  PdfFontSizes,
  ServiceSlot,
} from '../models/types';
import { getMonthWeeks, getTrimesterLabel } from './schedule.service';

// ─── Palette ───────────────────────────────────────────────────────────────
const DARK_BLUE    = [26, 58, 107] as [number, number, number];
const PRIMARY_RGB  = [26, 95, 180] as [number, number, number];
const HEADER_BG    = [232, 149, 109] as [number, number, number];
const SERVICE_BG   = [239, 246, 255] as [number, number, number];
const ENSAIO_BG    = [255, 243, 205] as [number, number, number];
const ENSAIO_TXT   = [133, 100, 4]  as [number, number, number];
const GRID_LINE    = [200, 200, 200] as [number, number, number];
const WHITE        = [255, 255, 255] as [number, number, number];

// ─── Layout (A4 in points) ────────────────────────────────────────────────
const PAGE_W   = 595.28;
const MARGIN   = 18;
const LEFT_X   = MARGIN;           // 18
const LEFT_W   = 324;              // ~58 %
const RIGHT_X  = LEFT_X + LEFT_W + 6; // 348 — small gap between columns
const RIGHT_W  = PAGE_W - RIGHT_X - MARGIN; // ≈ 229 pt

const DEFAULT_FONT_SIZES: PdfFontSizes = { calendar: 6, recommendations: 7, contacts: 7 };

// ─── Sanitiser (same rules as before) ─────────────────────────────────────
function sanitizeForPdf(text: string): string {
  return text
    .replace(/[←-⯿]/g, '')        // BMP symbol/emoji blocks (U+2190–U+2BFF)
    .replace(/[︀-️]/g, '')        // variation selectors 1–16
    .replace(/[​‌‍﻿]/g, ''); // ZWS, ZWNJ, ZWJ, BOM
}

// ─── Helpers ───────────────────────────────────────────────────────────────
function padZ(n: number): string {
  return String(n).padStart(2, '0');
}

function toDateStr(year: number, month: number, day: number): string {
  return `${year}-${padZ(month + 1)}-${padZ(day)}`;
}

// ─── Monthly calendar table ────────────────────────────────────────────────
function addMonthTable(
  doc: jsPDF,
  startY: number,
  year: number,
  month: number,
  assignments: DayAssignment[],
  fs: number,
  serviceSlots: ServiceSlot[],
): number {
  const monthName = `${MONTH_NAMES_PT[month]} ${year}`;
  const weeks = getMonthWeeks(year, month);
  const serviceDays = new Set(serviceSlots.map((s) => s.dayOfWeek));

  // Month title
  doc.setFontSize(fs + 2);
  doc.setTextColor(...PRIMARY_RGB);
  doc.setFont('helvetica', 'bold');
  doc.text(monthName, LEFT_X + LEFT_W / 2, startY + 5, { align: 'center' });
  const afterTitle = startY + 10;

  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');

  const DAY_HEADERS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  // Build body rows
  const bodyRows: any[][] = weeks.map((week) =>
    week.map((day, dow) => {
      if (day === null) return { content: '', styles: { fillColor: null } };

      const dateStr = toDateStr(year, month, day);
      const assignment = assignments.find((a) => a.date === dateStr);
      const isEnsaio = assignment?.isEnsaio ?? false;
      const hasService = !!(assignment && assignment.slots.length > 0);

      let cellText = String(day);
      if (hasService) {
        for (const slot of assignment!.slots) {
          const label = slot.slotLabel ? `${slot.slotLabel}: ` : '';
          cellText += `\n${label}${slot.organistName}`;
        }
      }
      if (isEnsaio) {
        cellText += '\nEnsaio';
      }

      const fill = isEnsaio ? ENSAIO_BG : hasService ? SERVICE_BG : null;
      return {
        content: cellText,
        styles: {
          fillColor: fill,
          textColor: isEnsaio ? ENSAIO_TXT : [0, 0, 0],
          fontSize: fs,
        },
      };
    }),
  );

  // Detect which weekdays have ensaio events — those columns also need wider width
  const ensaioDays = new Set<number>();
  for (const a of assignments) {
    if (a.isEnsaio) {
      const d = new Date(a.date + 'T00:00:00');
      ensaioDays.add(d.getDay());
    }
  }

  // Column widths: service-day and ensaio-day columns are wider
  const totalCols = 7;
  const narrowW = 30;   // pt for non-service/non-ensaio day columns
  const wideSet = new Set([...serviceDays, ...ensaioDays]);
  const wideCount = wideSet.size || 1;
  const remainW = LEFT_W - narrowW * (totalCols - wideCount);
  const wideW = Math.max(remainW / wideCount, 36); // at least 36pt for wide cols

  const columnStyles: Record<number, any> = {};
  for (let i = 0; i < 7; i++) {
    columnStyles[i] = { cellWidth: wideSet.has(i) ? wideW : narrowW, halign: 'left' };
  }

  autoTable(doc, {
    startY: afterTitle,
    tableWidth: LEFT_W,
    margin: { left: LEFT_X, right: PAGE_W - LEFT_X - LEFT_W },
    head: [DAY_HEADERS],
    body: bodyRows,
    headStyles: {
      fillColor: HEADER_BG,
      textColor: WHITE,
      fontSize: fs + 0.5,
      fontStyle: 'bold',
      halign: 'center',
      cellPadding: 1.5,
    },
    styles: {
      fontSize: fs,
      cellPadding: 1.5,
      overflow: 'linebreak',
      textColor: [0, 0, 0],
      lineColor: GRID_LINE,
      lineWidth: 0.3,
    },
    columnStyles,
    theme: 'grid',
  });

  return (doc as any).lastAutoTable.finalY + 6;
}

// ─── Recommendations block ─────────────────────────────────────────────────
function addRecommendations(
  doc: jsPDF,
  startY: number,
  text: string,
  fs: number,
): number {
  const lines = text.split('\n');
  const titleLine = sanitizeForPdf(lines[0] || 'Recomendações às irmãs Organistas:');

  let y = startY;

  doc.setFontSize(fs + 0.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(titleLine, RIGHT_X, y, { maxWidth: RIGHT_W });
  y += (fs + 0.5) * 1.3;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(fs);

  for (const rawLine of lines.slice(1)) {
    const sanitized = sanitizeForPdf(rawLine);
    if (sanitized.trim()) {
      const wrapped = doc.splitTextToSize(sanitized, RIGHT_W);
      doc.text(wrapped, RIGHT_X, y);
      y += wrapped.length * fs * 1.3 + 2;
    } else {
      y += fs * 0.8; // blank line spacing
    }
  }

  return y + 6;
}

// ─── Contacts table ────────────────────────────────────────────────────────
function addContactsTable(
  doc: jsPDF,
  startY: number,
  contacts: AppSettings['contacts'],
  fs: number,
): number {
  const rows = contacts.map((c) => [
    sanitizeForPdf(c.name),
    c.phone2 ? `${c.phone} / ${c.phone2}` : c.phone,
  ]);

  autoTable(doc, {
    startY,
    tableWidth: RIGHT_W,
    margin: { left: RIGHT_X, right: MARGIN },
    head: [[{ content: 'Telefones:', colSpan: 2 }]],
    body: rows,
    headStyles: {
      fillColor: HEADER_BG,
      textColor: WHITE,
      fontSize: fs + 0.5,
      fontStyle: 'bold',
      halign: 'center',
      cellPadding: 1.5,
    },
    styles: {
      fontSize: fs,
      cellPadding: 1.5,
      textColor: [0, 0, 0],
      lineColor: GRID_LINE,
      lineWidth: 0.3,
    },
    columnStyles: {
      0: { cellWidth: RIGHT_W * 0.55 },
      1: { cellWidth: RIGHT_W * 0.45 },
    },
    theme: 'grid',
  });

  return (doc as any).lastAutoTable.finalY;
}

// ─── Main document builder ─────────────────────────────────────────────────
function buildDocPdf(schedule: GeneratedSchedule, settings: AppSettings): jsPDF {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const fz = settings.pdfFontSizes ?? DEFAULT_FONT_SIZES;

  const [yearStr, monthStr] = schedule.startMonth.split('-');
  const startYear = parseInt(yearStr, 10);
  const startMonthNum = parseInt(monthStr, 10) - 1; // 0-based

  const trimesterLabel = getTrimesterLabel(schedule.startMonth);

  // ── Header ──────────────────────────────────────────────────────────────
  let y = MARGIN + 8;

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(sanitizeForPdf(settings.docTitle), PAGE_W / 2, y, { align: 'center' });
  y += 16;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'italic');
  doc.text(
    sanitizeForPdf(`${settings.congregationName} — ${settings.city}`),
    PAGE_W / 2,
    y,
    { align: 'center' },
  );
  y += 13;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...DARK_BLUE);
  doc.text(trimesterLabel, PAGE_W / 2, y, { align: 'center' });
  y += 10;

  doc.setTextColor(0, 0, 0);

  // ── Left column: 3 monthly calendars ────────────────────────────────────
  let leftY = y;
  for (let i = 0; i < 3; i++) {
    const mo = (startMonthNum + i) % 12;
    const yr = startYear + Math.floor((startMonthNum + i) / 12);
    leftY = addMonthTable(doc, leftY, yr, mo, schedule.assignments, fz.calendar, settings.serviceSlots);
  }

  // ── Right column: recommendations + contacts ─────────────────────────────
  let rightY = y;
  rightY = addRecommendations(doc, rightY, settings.recommendations, fz.recommendations);
  addContactsTable(doc, rightY, settings.contacts, fz.contacts);

  return doc;
}

// ─── Public API ────────────────────────────────────────────────────────────
export async function generateAndSharePDF(
  schedule: GeneratedSchedule,
  settings: AppSettings,
): Promise<void> {
  const doc = buildDocPdf(schedule, settings);
  const trimesterLabel = getTrimesterLabel(schedule.startMonth);
  const filename = `escala-${schedule.startMonth}.pdf`;

  if (Capacitor.isNativePlatform()) {
    // jsPDF is synchronous — no Promise/timeout needed
    const base64 = doc.output('datauristring').split(',')[1];

    await Filesystem.writeFile({
      path: filename,
      data: base64,
      directory: Directory.Cache,
    });

    const uriResult = await Filesystem.getUri({
      path: filename,
      directory: Directory.Cache,
    });

    await Share.share({
      title: `Escala de Organistas - ${trimesterLabel}`,
      files: [uriResult.uri],
      dialogTitle: 'Compartilhar Escala',
    });
  } else {
    doc.save(filename);
  }
}

export async function generatePDFBase64(
  schedule: GeneratedSchedule,
  settings: AppSettings,
): Promise<string> {
  const doc = buildDocPdf(schedule, settings);
  return doc.output('datauristring').split(',')[1];
}
