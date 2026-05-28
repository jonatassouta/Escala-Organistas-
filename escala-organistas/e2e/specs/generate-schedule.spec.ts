import { test, expect } from '@playwright/test';
import { GenerateSchedulePage } from '../pages/generate-schedule.page';
import { HomePage } from '../pages/home.page';
import { resetAndLoad } from '../helpers/storage.helper';

test.describe('Generate Schedule page (/gerar)', () => {
  let generate: GenerateSchedulePage;

  test.beforeEach(async ({ page }) => {
    await resetAndLoad(page);
    generate = new GenerateSchedulePage(page);
    await generate.goto();
    await generate.waitForTitle();
  });

  // ------------------------------------------------------------------ layout

  test('shows title "Gerar Escala"', async () => {
    await expect(generate.title).toBeVisible();
  });

  test('"Gerar Escala" button is visible', async () => {
    await expect(generate.generateButton).toBeVisible();
  });

  test('month selector item is visible', async () => {
    await expect(generate.monthItem).toBeVisible();
  });

  test('month selector shows a trimester label containing "trimestre"', async () => {
    const label = await generate.getMonthSelectorLabel();
    expect(label).toMatch(/trimestre/i);
  });

  test('month range shows 3 months separated by "•"', async () => {
    const range = await generate.getMonthRangeText();
    // e.g. "Jun/2026 • Jul/2026 • Ago/2026"
    const parts = range.split('•');
    expect(parts.length).toBe(3);
  });

  test('"Exportar PDF" button is NOT visible before generation', async () => {
    await expect(generate.exportPdfButton).not.toBeVisible();
  });

  test('calendar grid is NOT visible before generation', async ({ page }) => {
    // The ion-grid for the calendar appears only after generation
    // Before that, the page only has a card (no ion-grid in content area)
    const grids = await page.locator('ion-grid').count();
    expect(grids).toBe(0);
  });

  // ------------------------------------------------------------------ month picker modal

  test('clicking the month item opens the month picker modal', async ({ page }) => {
    await generate.openMonthPicker();
    await expect(page.locator('ion-modal')).toBeVisible({ timeout: 5000 });
    // Should contain IonDatetime with month-year presentation
    await expect(page.locator('ion-datetime')).toBeVisible();
  });

  test('month picker modal has "OK" button to close it', async ({ page }) => {
    await generate.openMonthPicker();
    await expect(page.locator('ion-modal ion-button', { hasText: 'OK' })).toBeVisible();
    await generate.closeMonthPicker();
    await expect(page.locator('ion-modal')).not.toBeVisible({ timeout: 3000 });
  });

  // ------------------------------------------------------------------ generation happy path

  test('clicking "Gerar Escala" shows a calendar grid', async () => {
    await generate.generate();
    await generate.expectCalendarVisible();
  });

  test('after generation "Exportar PDF" button appears', async () => {
    await generate.generate();
    await generate.expectExportButtonVisible();
  });

  test('after generation the trimester heading is visible', async ({ page }) => {
    await generate.generate();
    // The h3 element with the trimester label appears after generation
    await expect(page.locator('h3').filter({ hasText: /trimestre/i })).toBeVisible({ timeout: 5000 });
  });

  test('dismisses warnings alert if conflicts exist after generation', async ({ page }) => {
    await generate.generate();
    // If a warning alert appears, dismiss it
    const alert = page.locator('ion-alert');
    if (await alert.isVisible()) {
      await page.locator('ion-alert button', { hasText: 'OK' }).click();
      await page.waitForTimeout(300);
    }
    // Either way, the calendar should still be visible
    await generate.expectCalendarVisible();
  });

  // ------------------------------------------------------------------ schedule persisted in Home

  test('generated schedule appears in Home page history list', async ({ page }) => {
    await generate.generate();
    await generate.dismissWarningsAlert();

    // Navigate to Home
    const home = new HomePage(page);
    await home.goto();
    await home.waitForTitle();

    const count = await home.getScheduleCount();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('generated schedule shows "Mais recente" badge on Home', async ({ page }) => {
    await generate.generate();
    await generate.dismissWarningsAlert();

    const home = new HomePage(page);
    await home.goto();
    await home.waitForTitle();

    await expect(home.latestBadge).toBeVisible({ timeout: 5000 });
  });

  // ------------------------------------------------------------------ back navigation

  test('IonBackButton navigates back to /home', async ({ page }) => {
    await generate.clickBack();
    await expect(page).toHaveURL(/\/home/, { timeout: 5000 });
  });
});
