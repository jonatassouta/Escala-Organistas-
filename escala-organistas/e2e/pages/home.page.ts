import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

export class HomePage extends BasePage {
  // Header elements
  readonly title: Locator;

  // Action buttons (main card + quick-nav row)
  readonly generateButton: Locator;
  readonly organistNavButton: Locator;
  readonly settingsNavButton: Locator;

  // Schedule list
  readonly scheduleList: Locator;
  readonly scheduleItems: Locator;

  constructor(page: Page) {
    super(page);
    this.title = page.locator('ion-title', { hasText: 'Escala Organistas' });

    // The big "Gerar Nova Escala" button inside the primary card
    this.generateButton = page.locator('ion-button', { hasText: 'Gerar Nova Escala' });

    // The two quick-nav outline buttons below the card
    this.organistNavButton = page.locator('ion-button[href="/organistas"], ion-button[routerlink="/organistas"]').first();
    this.settingsNavButton = page.locator('ion-button[href="/configuracoes"], ion-button[routerlink="/configuracoes"]').first();

    this.scheduleList = page.locator('ion-list');
    this.scheduleItems = page.locator('ion-item-sliding');
  }

  async goto(): Promise<void> {
    await this.page.goto('/home');
    await this.page.waitForTimeout(400);
  }

  async waitForTitle(): Promise<void> {
    await expect(this.title).toBeVisible({ timeout: 8000 });
  }

  // ------------------------------------------------------------------ navigation

  async clickGenerateSchedule(): Promise<void> {
    await this.generateButton.click();
    await this.waitForNavigation();
  }

  async clickOrganists(): Promise<void> {
    // Use text match so we hit the outline button in the quick-nav row, not the header icon
    await this.page.locator('ion-button', { hasText: 'Organistas' }).first().click();
    await this.waitForNavigation();
  }

  async clickSettings(): Promise<void> {
    await this.page.locator('ion-button', { hasText: 'Configurações' }).first().click();
    await this.waitForNavigation();
  }

  // ------------------------------------------------------------------ schedule list helpers

  async getScheduleCount(): Promise<number> {
    return await this.scheduleItems.count();
  }

  /**
   * Returns the IonBadge "Mais recente" locator on the first schedule item.
   */
  get latestBadge(): Locator {
    return this.scheduleItems.first().locator('ion-badge', { hasText: 'Mais recente' });
  }

  /**
   * Returns the first schedule item's h2 label text (trimester label).
   */
  async firstScheduleLabel(): Promise<string> {
    return (await this.scheduleItems.first().locator('h2').innerText()).trim();
  }

  /**
   * Returns the first schedule item's IonNote text (datetime).
   */
  async firstScheduleDatetime(): Promise<string> {
    return (await this.scheduleItems.first().locator('ion-note').innerText()).trim();
  }

  /**
   * Swipes the first schedule item left to reveal the delete option and clicks it.
   * Then waits for the confirmation alert.
   */
  async swipeDeleteFirstSchedule(): Promise<void> {
    const item = this.scheduleItems.first();
    const box = await item.boundingBox();
    if (!box) throw new Error('Could not get bounding box of first schedule item');

    // Simulate a swipe from right to left to reveal the IonItemOptions
    await this.page.mouse.move(box.x + box.width - 10, box.y + box.height / 2);
    await this.page.mouse.down();
    await this.page.mouse.move(box.x + 20, box.y + box.height / 2, { steps: 15 });
    await this.page.mouse.up();
    await this.page.waitForTimeout(400);

    // Click the revealed delete option
    await this.page.locator('ion-item-option[color="danger"]').first().click();
    await this.page.waitForTimeout(300);
  }

  /**
   * Asserts the "no schedules" empty-state text is visible.
   */
  async expectEmptyState(): Promise<void> {
    await expect(
      this.page.locator('text=Nenhuma escala gerada ainda'),
    ).toBeVisible({ timeout: 5000 });
  }
}
