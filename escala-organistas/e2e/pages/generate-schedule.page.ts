import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

export class GenerateSchedulePage extends BasePage {
  readonly title: Locator;
  readonly generateButton: Locator;
  readonly exportPdfButton: Locator;
  readonly monthItem: Locator;
  readonly calendarGrid: Locator;

  constructor(page: Page) {
    super(page);
    this.title = page.locator('ion-title', { hasText: 'Gerar Escala' });
    this.generateButton = page.locator('ion-button', { hasText: 'Gerar Escala' });
    // "Exportar PDF" button (appears after generation; two instances rendered, pick first)
    this.exportPdfButton = page.locator('ion-button', { hasText: 'Exportar PDF' }).first();
    // The clickable month selector item
    this.monthItem = page.locator('ion-card ion-item').first();
    // CalendarGrid component wrapper
    this.calendarGrid = page.locator('.calendar-grid, ion-grid').first();
  }

  async goto(): Promise<void> {
    await this.page.goto('/gerar');
    await this.page.waitForTimeout(400);
  }

  async waitForTitle(): Promise<void> {
    await expect(this.title).toBeVisible({ timeout: 8000 });
  }

  // ------------------------------------------------------------------ month info

  /**
   * Returns the trimester label text shown in the month selector item (h2 inside ion-label).
   */
  async getMonthSelectorLabel(): Promise<string> {
    return (await this.monthItem.locator('h2').innerText()).trim();
  }

  /**
   * Returns the 3-month range text shown below the trimester label (p tag).
   */
  async getMonthRangeText(): Promise<string> {
    return (await this.monthItem.locator('p').innerText()).trim();
  }

  // ------------------------------------------------------------------ generate

  /**
   * Clicks the "Gerar Escala" button and waits for the calendar to appear.
   * Generation is fast (synchronous algorithm), so 2 s is plenty.
   */
  async generate(): Promise<void> {
    await this.generateButton.click();
    // Wait for either the calendar grid or the toast success message
    await Promise.race([
      this.page.waitForSelector('ion-grid', { state: 'visible', timeout: 8000 }),
      this.page.waitForSelector('ion-toast', { state: 'visible', timeout: 8000 }),
    ]);
    await this.page.waitForTimeout(400);
  }

  // ------------------------------------------------------------------ post-generation assertions

  async expectCalendarVisible(): Promise<void> {
    // CalendarGrid renders an ion-grid with calendar tables
    await expect(this.page.locator('ion-grid').first()).toBeVisible({ timeout: 8000 });
  }

  async expectExportButtonVisible(): Promise<void> {
    await expect(this.exportPdfButton).toBeVisible({ timeout: 8000 });
  }

  async expectTrimesterLabelVisible(label: string): Promise<void> {
    await expect(this.page.locator('h3', { hasText: label })).toBeVisible({ timeout: 8000 });
  }

  // ------------------------------------------------------------------ month picker modal

  async openMonthPicker(): Promise<void> {
    await this.monthItem.click();
    await this.page.waitForSelector('ion-modal', { state: 'visible', timeout: 5000 });
    await this.page.waitForTimeout(300);
  }

  async closeMonthPicker(): Promise<void> {
    await this.page.locator('ion-modal ion-button', { hasText: 'OK' }).click();
    await this.page.waitForTimeout(300);
  }

  // ------------------------------------------------------------------ warnings

  async hasWarnings(): Promise<boolean> {
    return await this.page.locator('ion-alert').isVisible();
  }

  async dismissWarningsAlert(): Promise<void> {
    const alert = this.page.locator('ion-alert');
    if (await alert.isVisible()) {
      await this.page.locator('ion-alert button', { hasText: 'OK' }).click();
      await this.page.waitForTimeout(300);
    }
  }
}
