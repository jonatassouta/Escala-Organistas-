import { test, expect } from '@playwright/test';
import { OrganistFormPage } from '../pages/organist-form.page';
import { OrganistsPage } from '../pages/organists.page';
import { resetAndLoad } from '../helpers/storage.helper';

test.describe('Organist form — new organist (/organistas/nova)', () => {
  let form: OrganistFormPage;

  test.beforeEach(async ({ page }) => {
    await resetAndLoad(page);
    form = new OrganistFormPage(page);
    await form.gotoNew();
    await form.expectNewTitle();
  });

  // ------------------------------------------------------------------ layout

  test('shows title "Nova Organista"', async () => {
    await expect(form.title).toContainText('Nova Organista');
  });

  test('name field is empty by default', async () => {
    const value = await form.getNameValue();
    expect(value).toBe('');
  });

  test('role segment defaults to "ambos" (Ambos selected)', async () => {
    const role = await form.getSelectedRole();
    expect(role).toBe('ambos');
  });

  test('"Salvar" button is visible in the header', async () => {
    await expect(form.saveButton).toBeVisible();
  });

  test('"Adicionar" restriction button is visible', async () => {
    await expect(form.addRestrictionButton).toBeVisible();
  });

  test('no restriction chips visible by default', async () => {
    const count = await form.getRestrictionCount();
    expect(count).toBe(0);
  });

  // ------------------------------------------------------------------ role segment

  test('clicking RJM segment changes selected role to RJM', async () => {
    await form.selectRole('RJM');
    const role = await form.getSelectedRole();
    expect(role).toBe('RJM');
  });

  test('clicking CO segment changes selected role to CO', async () => {
    await form.selectRole('CO');
    const role = await form.getSelectedRole();
    expect(role).toBe('CO');
  });

  // ------------------------------------------------------------------ validation

  test('saving with empty name shows toast "Informe o nome da organista"', async () => {
    await form.save();
    // The toast message in OrganistForm ends with a period: "Informe o nome da organista."
    await form.expectValidationToast('Informe o nome da organista');
  });

  test('remains on the form page after failed save (empty name)', async ({ page }) => {
    await form.save();
    await expect(page).toHaveURL(/\/organistas\/nova/, { timeout: 3000 });
  });

  // ------------------------------------------------------------------ happy path: add new organist

  test('filling name and saving navigates back to organists list', async ({ page }) => {
    await form.fillName('Teste Organista');
    await form.save();
    await page.waitForTimeout(600);
    await expect(page).toHaveURL(/\/organistas$/, { timeout: 5000 });
  });

  test('new organist appears in the organists list after saving', async ({ page }) => {
    const name = 'Nova Organista Teste';
    await form.fillName(name);
    await form.save();

    // Wait for navigation back to /organistas
    const organists = new OrganistsPage(page);
    await organists.waitForTitle();
    await organists.expectOrganistVisible(name);
  });

  test('new organist with RJM role shows RJM badge in list', async ({ page }) => {
    await form.fillName('RJM Organista');
    await form.selectRole('RJM');
    await form.save();

    const organists = new OrganistsPage(page);
    await organists.waitForTitle();
    // Find the newly added item — it will be at the end of the list
    const count = await organists.getOrganistCount();
    const badge = organists.roleBadgeAt(count - 1);
    await expect(badge).toContainText('RJM');
  });

  // ------------------------------------------------------------------ restrictions

  test('adding a weekday restriction adds a chip to the list', async () => {
    const before = await form.getRestrictionCount();
    await form.addWeekdayRestriction('Sábado');
    const after = await form.getRestrictionCount();
    expect(after).toBe(before + 1);
  });

  test('added restriction chip shows the weekday label', async () => {
    await form.addWeekdayRestriction('Sábado');
    const labels = await form.getRestrictionLabels();
    expect(labels.some((l) => l.includes('Sáb'))).toBe(true);
  });

  test('clicking a restriction chip removes it from the list', async () => {
    await form.addWeekdayRestriction('Sábado');
    const before = await form.getRestrictionCount();
    await form.removeRestrictionAt(0);
    const after = await form.getRestrictionCount();
    expect(after).toBe(before - 1);
  });

  test('IonBackButton navigates back to organists list', async ({ page }) => {
    await form.clickBack();
    await expect(page).toHaveURL(/\/organistas$/, { timeout: 5000 });
  });
});

test.describe('Organist form — edit existing organist (/organistas/editar/:id)', () => {
  let form: OrganistFormPage;
  let organists: OrganistsPage;

  test.beforeEach(async ({ page }) => {
    await resetAndLoad(page);
    form = new OrganistFormPage(page);
    organists = new OrganistsPage(page);

    // Navigate to organists list, then click the first item to get to its edit page
    await organists.goto();
    await organists.waitForTitle();
    await organists.clickOrganistAt(0);
    await form.expectEditTitle();
  });

  // ------------------------------------------------------------------ layout

  test('shows title "Editar Organista"', async () => {
    await expect(form.title).toContainText('Editar Organista');
  });

  test('name field is pre-filled with the organist\'s name', async () => {
    const value = await form.getNameValue();
    // First default organist is "Natalha"
    expect(value).toBe('Natalha');
  });

  test('role segment shows the organist\'s existing role', async () => {
    const role = await form.getSelectedRole();
    // Natalha has role "CO"
    expect(role).toBe('CO');
  });

  // ------------------------------------------------------------------ edit + save

  test('editing the name and saving updates the organist in the list', async ({ page }) => {
    await form.fillName('Natalha Editada');
    await form.save();

    await organists.waitForTitle();
    await organists.expectOrganistVisible('Natalha Editada');
  });

  test('changing role and saving persists the new role', async ({ page }) => {
    await form.selectRole('ambos');
    await form.save();
    await organists.waitForTitle();

    // First item badge should now be "Ambos"
    const badge = organists.roleBadgeAt(0);
    await expect(badge).toContainText('Ambos');
  });

  // ------------------------------------------------------------------ restrictions on edit

  test('adding a restriction in edit mode persists after saving', async ({ page }) => {
    await form.addWeekdayRestriction('Segunda');
    const countAfterAdd = await form.getRestrictionCount();
    expect(countAfterAdd).toBeGreaterThanOrEqual(1);

    await form.save();
    await organists.waitForTitle();

    // Re-enter edit form and verify restriction persisted
    await organists.clickOrganistAt(0);
    await form.expectEditTitle();
    const countAfterReopen = await form.getRestrictionCount();
    expect(countAfterReopen).toBeGreaterThanOrEqual(1);
  });
});
