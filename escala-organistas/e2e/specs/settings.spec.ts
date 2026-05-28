import { test, expect } from '@playwright/test';
import { SettingsPage } from '../pages/settings.page';
import { resetAndLoad } from '../helpers/storage.helper';

test.describe('Settings page (/configuracoes)', () => {
  let settings: SettingsPage;

  test.beforeEach(async ({ page }) => {
    await resetAndLoad(page);
    settings = new SettingsPage(page);
    await settings.goto();
    await settings.waitForTitle();
  });

  // ------------------------------------------------------------------ layout

  test('shows title "Configurações"', async () => {
    await expect(settings.title).toBeVisible();
  });

  test('"Salvar" button is visible in the header', async () => {
    await expect(settings.saveButton).toBeVisible();
  });

  // ------------------------------------------------------------------ tabs existence

  test('has "Documento" tab button', async () => {
    await expect(settings.tabDocumento).toBeVisible();
  });

  test('has "Dias de Culto" tab button', async () => {
    await expect(settings.tabCulto).toBeVisible();
  });

  test('has "Ensaio" tab button', async () => {
    await expect(settings.tabEnsaio).toBeVisible();
  });

  test('has "Recomendações" tab button', async () => {
    await expect(settings.tabRecomendacoes).toBeVisible();
  });

  test('has "Telefones" tab button', async () => {
    await expect(settings.tabTelefones).toBeVisible();
  });

  // ------------------------------------------------------------------ DOCUMENTO tab (default)

  test.describe('DOCUMENTO tab', () => {
    // Documento is the default tab, no need to click it

    test('shows docTitle input with default value "Rodízio de Organistas"', async () => {
      const value = await settings.getDocTitle();
      expect(value).toBe('Rodízio de Organistas');
    });

    test('shows congregationName input with default value', async () => {
      const value = await settings.getCongregationName();
      expect(value).toBe('Parque das Hortências');
    });

    test('shows city input with default value', async () => {
      const value = await settings.getCity();
      expect(value).toMatch(/Araraquara/);
    });

    test('editing docTitle and saving persists the value', async ({ page }) => {
      const newTitle = 'Escala de Organistas TESTE';
      await settings.setDocTitle(newTitle);
      await settings.save();
      await settings.expectSavedToast();

      // Reload the page to verify persistence
      await page.reload();
      await page.waitForTimeout(600);
      const persisted = await settings.getDocTitle();
      expect(persisted).toBe(newTitle);
    });

    test('editing congregationName and saving persists the value', async ({ page }) => {
      const newName = 'Congregação Teste';
      await settings.congregationInput.click();
      await settings.congregationInput.fill(newName);
      await settings.save();
      await settings.expectSavedToast();

      await page.reload();
      await page.waitForTimeout(600);
      const persisted = await settings.getCongregationName();
      expect(persisted).toBe(newName);
    });
  });

  // ------------------------------------------------------------------ DIAS DE CULTO tab

  test.describe('DIAS DE CULTO tab', () => {
    test.beforeEach(async () => {
      await settings.clickTab('culto');
    });

    test('shows 4 default service slots', async () => {
      const count = await settings.getSlotCount();
      expect(count).toBe(4);
    });

    test('"Configurar Todos" button is visible', async () => {
      await expect(settings.configurarTodosButton).toBeVisible();
    });

    test('"Adicionar Dia" button is visible', async () => {
      await expect(settings.addDayButton).toBeVisible();
    });

    test('each slot row shows a day badge', async ({ page }) => {
      // Slots have an IonBadge with the slot label (RJM or CO)
      const badges = page.locator('ion-list ion-item ion-badge');
      const count = await badges.count();
      expect(count).toBeGreaterThanOrEqual(2); // at least the CO and RJM label badges
    });

    test('each slot row has Tipo (ion-select) and Modo (ion-select)', async ({ page }) => {
      // Each slot row has 2 ion-select elements (Tipo and Modo)
      const selects = page.locator('ion-list ion-item ion-select');
      const count = await selects.count();
      // 4 slots × 2 selects minimum = 8 (some fixo slots have a 3rd for organist)
      expect(count).toBeGreaterThanOrEqual(8);
    });

    test('each slot row has a delete button', async ({ page }) => {
      const deleteBtns = page.locator('ion-list ion-item ion-button[color="danger"]');
      const count = await deleteBtns.count();
      expect(count).toBe(4);
    });

    test('adding a new day slot increases count by 1', async ({ page }) => {
      const before = await settings.getSlotCount();
      await settings.addServiceSlot(6, 'RJM'); // Saturday, RJM
      const after = await settings.getSlotCount();
      expect(after).toBe(before + 1);
    });
  });

  // ------------------------------------------------------------------ ENSAIO tab

  test.describe('ENSAIO tab', () => {
    test.beforeEach(async () => {
      await settings.clickTab('ensaio');
    });

    test('shows the "Marcar ensaio automaticamente" toggle', async () => {
      await expect(settings.ensaioToggle).toBeVisible();
    });

    test('ensaio toggle is enabled by default', async () => {
      const enabled = await settings.isEnsaioEnabled();
      expect(enabled).toBe(true);
    });

    test('when toggle is on, weekday select is visible', async ({ page }) => {
      // IonSelect for weekday — appears only when toggle is enabled (default)
      const selects = page.locator('ion-select');
      const count = await selects.count();
      expect(count).toBeGreaterThanOrEqual(2); // weekday + occurrence selects
    });

    test('disabling the toggle hides weekday and occurrence selects', async ({ page }) => {
      await settings.ensaioToggle.click();
      await page.waitForTimeout(300);
      const selects = page.locator('ion-select');
      const count = await selects.count();
      expect(count).toBe(0);
    });
  });

  // ------------------------------------------------------------------ RECOMENDAÇÕES tab

  test.describe('RECOMENDAÇÕES tab', () => {
    test.beforeEach(async () => {
      await settings.clickTab('recomendacoes');
    });

    test('shows a textarea', async () => {
      await expect(settings.recommendationsTextarea).toBeVisible();
    });

    test('textarea has default recommendations text', async () => {
      const text = await settings.getRecommendationsText();
      expect(text.length).toBeGreaterThan(20);
      // Default text includes Portuguese church-related content
      expect(text).toMatch(/organista/i);
    });

    test('editing textarea and saving persists the value', async ({ page }) => {
      const newText = 'Texto de recomendação de teste.';
      await settings.recommendationsTextarea.click();
      await settings.recommendationsTextarea.fill(newText);
      await settings.save();
      await settings.expectSavedToast();

      await page.reload();
      await page.waitForTimeout(600);
      await settings.clickTab('recomendacoes');
      const persisted = await settings.getRecommendationsText();
      expect(persisted).toBe(newText);
    });
  });

  // ------------------------------------------------------------------ TELEFONES tab

  test.describe('TELEFONES tab', () => {
    test.beforeEach(async () => {
      await settings.clickTab('telefones');
    });

    test('shows contacts list', async ({ page }) => {
      const count = await settings.getContactCount();
      expect(count).toBeGreaterThan(0);
    });

    test('contacts list has 20 default entries', async ({ page }) => {
      // ContactsEditor renders 20 default contacts
      const count = await settings.getContactCount();
      expect(count).toBe(20);
    });

    test('first contact includes a name and phone', async ({ page }) => {
      const firstItem = page.locator('ion-content ion-item').first();
      const text = await firstItem.innerText();
      expect(text.length).toBeGreaterThan(3);
    });
  });

  // ------------------------------------------------------------------ save

  test('clicking "Salvar" shows "Configurações salvas!" toast', async () => {
    await settings.save();
    await settings.expectSavedToast();
  });

  // ------------------------------------------------------------------ back navigation

  test('IonBackButton navigates back to /home', async ({ page }) => {
    await settings.clickBack();
    await expect(page).toHaveURL(/\/home/, { timeout: 5000 });
  });
});
