import { test, expect } from '@playwright/test';
import { OrganistsPage } from '../pages/organists.page';
import { resetAndLoad } from '../helpers/storage.helper';

// Default organists seeded by storage.service.ts ensureInitialized()
const DEFAULT_ORGANISTS = ['Natalha', 'Juliana', 'Elisângela', 'Eduarda', 'Ana Livia'];

test.describe('Organists list page', () => {
  let organists: OrganistsPage;

  test.beforeEach(async ({ page }) => {
    await resetAndLoad(page);
    organists = new OrganistsPage(page);
    await organists.goto();
    await organists.waitForTitle();
  });

  // ------------------------------------------------------------------ layout

  test('shows "Organistas" title', async () => {
    await expect(organists.title).toBeVisible();
  });

  test('FAB "+" button is visible', async () => {
    await expect(organists.fabButton).toBeVisible();
  });

  // ------------------------------------------------------------------ default data

  test(`shows ${DEFAULT_ORGANISTS.length} default organists`, async () => {
    const count = await organists.getOrganistCount();
    expect(count).toBe(DEFAULT_ORGANISTS.length);
  });

  for (const name of DEFAULT_ORGANISTS) {
    test(`default organist "${name}" is visible`, async () => {
      await organists.expectOrganistVisible(name);
    });
  }

  test('each organist item shows a role badge', async () => {
    const count = await organists.getOrganistCount();
    for (let i = 0; i < count; i++) {
      const badge = organists.roleBadgeAt(i);
      await expect(badge).toBeVisible();
      const badgeText = await badge.innerText();
      expect(['RJM', 'CO', 'Ambos']).toContain(badgeText.trim());
    }
  });

  // ------------------------------------------------------------------ navigation

  test('clicking FAB navigates to /organistas/nova', async ({ page }) => {
    await organists.clickFab();
    await expect(page).toHaveURL(/\/organistas\/nova/, { timeout: 5000 });
  });

  test('clicking an organist item navigates to the edit form', async ({ page }) => {
    await organists.clickOrganistAt(0);
    await expect(page).toHaveURL(/\/organistas\/editar\//, { timeout: 5000 });
  });

  // ------------------------------------------------------------------ delete via swipe

  test('swiping an organist reveals delete option and shows confirmation alert', async ({ page }) => {
    await organists.swipeDeleteAt(0);
    // The IonAlert should now be visible
    const alert = await organists.waitForAlert();
    await expect(alert).toBeVisible();
    await expect(alert.locator('h2')).toContainText('Excluir');
  });

  test('confirming delete removes the organist from the list', async ({ page }) => {
    const before = await organists.getOrganistCount();
    await organists.swipeDeleteAt(0);
    await organists.waitForAlert();
    await organists.clickAlertButton('Excluir');
    await page.waitForTimeout(600);
    const after = await organists.getOrganistCount();
    expect(after).toBe(before - 1);
  });

  test('cancelling delete keeps the organist in the list', async ({ page }) => {
    const before = await organists.getOrganistCount();
    await organists.swipeDeleteAt(0);
    await organists.waitForAlert();
    await organists.clickAlertButton('Cancelar');
    await page.waitForTimeout(400);
    const after = await organists.getOrganistCount();
    expect(after).toBe(before);
  });

  // ------------------------------------------------------------------ restriction summary

  test('each organist item shows a restriction note', async () => {
    const count = await organists.getOrganistCount();
    for (let i = 0; i < count; i++) {
      const note = organists.organistItems.nth(i).locator('ion-note');
      await expect(note).toBeVisible();
    }
  });
});
