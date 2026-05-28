import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

export class OrganistFormPage extends BasePage {
  readonly title: Locator;
  readonly nameInput: Locator;
  readonly saveButton: Locator;
  readonly addRestrictionButton: Locator;
  readonly restrictionChips: Locator;
  readonly backButton: Locator;

  // Segment buttons
  readonly segmentRJM: Locator;
  readonly segmentCO: Locator;
  readonly segmentAmbos: Locator;

  constructor(page: Page) {
    super(page);
    this.title = page.locator('ion-title').last();
    // getByPlaceholder pierces shadow DOM for ion-input
    this.nameInput = page.getByPlaceholder('Nome da organista');
    // "Salvar" button in the toolbar header
    this.saveButton = page.locator('ion-toolbar ion-button', { hasText: 'Salvar' });
    // "Adicionar" button for restrictions
    this.addRestrictionButton = page.locator('ion-button', { hasText: 'Adicionar' }).last();
    // Restriction chips (each is an ion-chip with color="danger")
    this.restrictionChips = page.locator('ion-chip[color="danger"]');
    this.backButton = page.locator('ion-back-button');

    this.segmentRJM = page.locator('ion-segment-button[value="RJM"]');
    this.segmentCO = page.locator('ion-segment-button[value="CO"]');
    this.segmentAmbos = page.locator('ion-segment-button[value="ambos"]');
  }

  async gotoNew(): Promise<void> {
    await this.page.goto('/organistas/nova');
    await this.page.waitForTimeout(400);
  }

  async gotoEdit(id: string): Promise<void> {
    await this.page.goto(`/organistas/editar/${id}`);
    await this.page.waitForTimeout(400);
  }

  // ------------------------------------------------------------------ title assertions

  async expectNewTitle(): Promise<void> {
    await expect(this.title).toContainText('Nova Organista', { timeout: 8000 });
  }

  async expectEditTitle(): Promise<void> {
    await expect(this.title).toContainText('Editar Organista', { timeout: 8000 });
  }

  // ------------------------------------------------------------------ name input

  async fillName(name: string): Promise<void> {
    // Click to focus then type — most reliable for Ionic ion-input with shadow DOM
    await this.nameInput.click();
    await this.nameInput.fill(name);
  }

  async clearName(): Promise<void> {
    await this.nameInput.click();
    await this.nameInput.fill('');
  }

  async getNameValue(): Promise<string> {
    return (await this.nameInput.inputValue()) ?? '';
  }

  // ------------------------------------------------------------------ segment / role

  async selectRole(role: 'RJM' | 'CO' | 'ambos'): Promise<void> {
    await this.page.locator(`ion-segment-button[value="${role}"]`).click();
    await this.page.waitForTimeout(200);
  }

  /**
   * Returns the value attribute of the currently active ion-segment-button.
   * Ionic adds aria-selected="true" to the active button.
   */
  async getSelectedRole(): Promise<string | null> {
    const active = this.page.locator('ion-segment-button[aria-selected="true"]');
    return await active.getAttribute('value');
  }

  // ------------------------------------------------------------------ save / back

  async save(): Promise<void> {
    await this.saveButton.click();
    await this.page.waitForTimeout(400);
  }

  // ------------------------------------------------------------------ restrictions

  async getRestrictionCount(): Promise<number> {
    return await this.restrictionChips.count();
  }

  async getRestrictionLabels(): Promise<string[]> {
    const count = await this.restrictionChips.count();
    const labels: string[] = [];
    for (let i = 0; i < count; i++) {
      labels.push((await this.restrictionChips.nth(i).locator('ion-label').innerText()).trim());
    }
    return labels;
  }

  /**
   * Opens the RestrictionPicker modal and selects a weekday restriction.
   * weekdayName must match one of the WEEKDAY_NAMES_FULL values, e.g. "Sábado".
   */
  async addWeekdayRestriction(weekdayName: string): Promise<void> {
    await this.addRestrictionButton.click();
    // Wait for the modal to appear
    await this.page.waitForSelector('ion-modal', { state: 'visible', timeout: 5000 });
    await this.page.waitForTimeout(300);

    // The weekday mode is selected by default; click the button for the given weekday
    const weekdayBtn = this.page.locator('ion-modal ion-button', { hasText: weekdayName });
    await weekdayBtn.click();
    await this.page.waitForTimeout(200);

    // Click the "Adicionar" confirm button in the modal header
    const modalAddBtn = this.page.locator('ion-modal ion-button', { hasText: 'Adicionar' });
    await modalAddBtn.click();
    await this.page.waitForTimeout(400);
  }

  /**
   * Removes the restriction chip at the given index by clicking it.
   */
  async removeRestrictionAt(index: number): Promise<void> {
    await this.restrictionChips.nth(index).click();
    await this.page.waitForTimeout(200);
  }

  // ------------------------------------------------------------------ toast assertion

  async expectValidationToast(message: string): Promise<void> {
    await this.waitForToast(message);
  }
}
