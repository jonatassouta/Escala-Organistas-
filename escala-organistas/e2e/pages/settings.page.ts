import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

export class SettingsPage extends BasePage {
  readonly title: Locator;
  readonly saveButton: Locator;

  // Tab segment buttons
  readonly tabDocumento: Locator;
  readonly tabCulto: Locator;
  readonly tabEnsaio: Locator;
  readonly tabRecomendacoes: Locator;
  readonly tabTelefones: Locator;

  constructor(page: Page) {
    super(page);
    this.title = page.locator('ion-title', { hasText: 'Configurações' });
    this.saveButton = page.locator('ion-toolbar ion-button', { hasText: 'Salvar' });

    this.tabDocumento = page.locator('ion-segment-button[value="documento"]');
    this.tabCulto = page.locator('ion-segment-button[value="culto"]');
    this.tabEnsaio = page.locator('ion-segment-button[value="ensaio"]');
    this.tabRecomendacoes = page.locator('ion-segment-button[value="recomendacoes"]');
    this.tabTelefones = page.locator('ion-segment-button[value="telefones"]');
  }

  async goto(): Promise<void> {
    await this.page.goto('/configuracoes');
    await this.page.waitForTimeout(500);
  }

  async waitForTitle(): Promise<void> {
    await expect(this.title).toBeVisible({ timeout: 8000 });
  }

  // ------------------------------------------------------------------ tabs

  async clickTab(tab: 'documento' | 'culto' | 'ensaio' | 'recomendacoes' | 'telefones'): Promise<void> {
    await this.page.locator(`ion-segment-button[value="${tab}"]`).click();
    await this.page.waitForTimeout(300);
  }

  // ------------------------------------------------------------------ DOCUMENTO tab

  /** Returns the ion-input for docTitle (first input on the Documento tab). */
  get docTitleInput(): Locator {
    return this.page.getByPlaceholder('Ex: Rodízio de Organistas');
  }

  get congregationInput(): Locator {
    return this.page.getByPlaceholder('Ex: Parque das Hortências');
  }

  get cityInput(): Locator {
    return this.page.getByPlaceholder('Ex: Araraquara – SP');
  }

  async getDocTitle(): Promise<string> {
    return (await this.docTitleInput.inputValue()) ?? '';
  }

  async setDocTitle(value: string): Promise<void> {
    await this.docTitleInput.click();
    await this.docTitleInput.fill(value);
  }

  async getCongregationName(): Promise<string> {
    return (await this.congregationInput.inputValue()) ?? '';
  }

  async getCity(): Promise<string> {
    return (await this.cityInput.inputValue()) ?? '';
  }

  // ------------------------------------------------------------------ CULTO tab

  /** Number of service slots currently rendered in the list. */
  async getSlotCount(): Promise<number> {
    return await this.page.locator('ion-list ion-item').count();
  }

  get addDayButton(): Locator {
    return this.page.locator('ion-button', { hasText: 'Adicionar Dia' });
  }

  get configurarTodosButton(): Locator {
    return this.page.locator('ion-button', { hasText: 'Configurar Todos' });
  }

  /**
   * Opens the "Adicionar Dia de Culto" modal, selects a weekday and tipo,
   * then confirms with "Adicionar".
   */
  async addServiceSlot(weekdayValue: number, tipoValue: 'CO' | 'RJM'): Promise<void> {
    await this.addDayButton.click();
    await this.page.waitForSelector('ion-modal', { state: 'visible', timeout: 5000 });
    await this.page.waitForTimeout(300);

    // Select weekday in the modal
    const weekdaySelect = this.page.locator('ion-modal ion-item').first().locator('ion-select');
    await weekdaySelect.click();
    await this.page.waitForSelector('ion-popover', { state: 'visible', timeout: 5000 });
    await this.page
      .locator('ion-popover ion-radio-group ion-item button')
      .nth(weekdayValue)
      .click();
    await this.page.waitForTimeout(300);

    // Select tipo in the modal
    const tipoSelect = this.page.locator('ion-modal ion-item').nth(1).locator('ion-select');
    await tipoSelect.click();
    await this.page.waitForSelector('ion-popover', { state: 'visible', timeout: 5000 });
    await this.page
      .locator('ion-popover ion-radio-group ion-item button', { hasText: tipoValue })
      .click();
    await this.page.waitForTimeout(300);

    // Confirm
    await this.page.locator('ion-modal ion-button', { hasText: 'Adicionar' }).click();
    await this.page.waitForTimeout(400);
  }

  // ------------------------------------------------------------------ ENSAIO tab

  get ensaioToggle(): Locator {
    return this.page.locator('ion-toggle');
  }

  async isEnsaioEnabled(): Promise<boolean> {
    return await this.ensaioToggle.isChecked();
  }

  // ------------------------------------------------------------------ RECOMENDAÇÕES tab

  get recommendationsTextarea(): Locator {
    return this.page.locator('ion-textarea');
  }

  async getRecommendationsText(): Promise<string> {
    return (await this.recommendationsTextarea.inputValue()) ?? '';
  }

  // ------------------------------------------------------------------ TELEFONES tab

  /** Returns the number of contact items rendered. */
  async getContactCount(): Promise<number> {
    // ContactsEditor renders ion-item elements
    return await this.page.locator('ion-content ion-item').count();
  }

  // ------------------------------------------------------------------ save

  async save(): Promise<void> {
    await this.saveButton.click();
    await this.page.waitForTimeout(400);
  }

  async expectSavedToast(): Promise<void> {
    await this.waitForToast('Configurações salvas!');
  }
}
