import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/home.page';
import { GenerateSchedulePage } from '../pages/generate-schedule.page';
import { resetAndLoad } from '../helpers/storage.helper';

test.describe('Home page', () => {
  let home: HomePage;

  test.beforeEach(async ({ page }) => {
    await resetAndLoad(page);
    home = new HomePage(page);
  });

  // ------------------------------------------------------------------ layout

  test('shows the app title "Escala Organistas"', async () => {
    await home.waitForTitle();
    await expect(home.title).toBeVisible();
  });

  test('has a "Gerar Nova Escala" button', async () => {
    await expect(home.generateButton).toBeVisible();
  });

  test('has an "Organistas" quick-nav button', async () => {
    await expect(home.page.locator('ion-button', { hasText: 'Organistas' }).first()).toBeVisible();
  });

  test('has a "Configurações" quick-nav button', async () => {
    await expect(home.page.locator('ion-button', { hasText: 'Configurações' }).first()).toBeVisible();
  });

  // ------------------------------------------------------------------ empty state

  test('shows empty state when no schedules exist', async () => {
    await home.expectEmptyState();
  });

  test('does not show schedule list when no schedules exist', async () => {
    const count = await home.getScheduleCount();
    expect(count).toBe(0);
  });

  // ------------------------------------------------------------------ navigation

  test('clicking "Gerar Nova Escala" navigates to /gerar', async ({ page }) => {
    await home.clickGenerateSchedule();
    await expect(page).toHaveURL(/\/gerar/, { timeout: 5000 });
  });

  test('clicking "Organistas" button navigates to /organistas', async ({ page }) => {
    await home.clickOrganists();
    await expect(page).toHaveURL(/\/organistas/, { timeout: 5000 });
  });

  test('clicking "Configurações" button navigates to /configuracoes', async ({ page }) => {
    await home.clickSettings();
    await expect(page).toHaveURL(/\/configuracoes/, { timeout: 5000 });
  });

  // ------------------------------------------------------------------ schedule list (after generating one)

  test.describe('with a generated schedule', () => {
    test.beforeEach(async ({ page }) => {
      // Generate a schedule via the UI so it appears in localStorage
      const generate = new GenerateSchedulePage(page);
      await generate.goto();
      await generate.generate();
      // Dismiss any warnings alert that might appear
      await generate.dismissWarningsAlert();
      // Navigate back home
      await page.goto('/home');
      await page.waitForTimeout(600);
    });

    test('shows the schedule list with at least one item', async () => {
      const count = await home.getScheduleCount();
      expect(count).toBeGreaterThanOrEqual(1);
    });

    test('first item has "Mais recente" badge', async () => {
      await expect(home.latestBadge).toBeVisible({ timeout: 5000 });
    });

    test('schedule item shows datetime with "às" format', async () => {
      const datetime = await home.firstScheduleDatetime();
      expect(datetime).toContain('às');
    });

    test('schedule item shows trimester label', async () => {
      const label = await home.firstScheduleLabel();
      // e.g. "2°.trimestre/2026" – should contain "trimestre"
      expect(label).toMatch(/trimestre/i);
    });

    test('deleting first schedule removes it from the list', async ({ page }) => {
      const before = await home.getScheduleCount();
      await home.swipeDeleteFirstSchedule();

      // Confirm deletion in the alert
      await home.waitForAlert();
      await home.clickAlertButton('Excluir');

      await page.waitForTimeout(600);
      const after = await home.getScheduleCount();
      expect(after).toBe(before - 1);
    });
  });
});
