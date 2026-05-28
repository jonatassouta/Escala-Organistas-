import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

export class OrganistsPage extends BasePage {
  readonly title: Locator;
  readonly organistItems: Locator;
  readonly fabButton: Locator;

  constructor(page: Page) {
    super(page);
    this.title = page.locator('ion-title', { hasText: 'Organistas' });
    // Each organist is wrapped in ion-item-sliding
    this.organistItems = page.locator('ion-item-sliding');
    // The FAB "+" button at the bottom-right
    this.fabButton = page.locator('ion-fab-button');
  }

  async goto(): Promise<void> {
    await this.page.goto('/organistas');
    await this.page.waitForTimeout(400);
  }

  async waitForTitle(): Promise<void> {
    await expect(this.title).toBeVisible({ timeout: 8000 });
  }

  // ------------------------------------------------------------------ list helpers

  async getOrganistCount(): Promise<number> {
    return await this.organistItems.count();
  }

  /**
   * Returns the text content of the h2 element (name + badge text) of the nth item (0-based).
   */
  async getOrganistNameAt(index: number): Promise<string> {
    const h2 = this.organistItems.nth(index).locator('h2');
    return (await h2.innerText()).trim();
  }

  /**
   * Returns all organist names currently visible.
   */
  async getAllOrganistNames(): Promise<string[]> {
    const count = await this.getOrganistCount();
    const names: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = await this.getOrganistNameAt(i);
      // Strip badge text — the name is before the badge (e.g. "Natalha CO")
      // We get only the first word-sequence up to the badge content
      names.push(text);
    }
    return names;
  }

  /**
   * Returns the IonBadge (role badge) locator inside the nth item.
   */
  roleBadgeAt(index: number): Locator {
    return this.organistItems.nth(index).locator('ion-badge');
  }

  /**
   * Clicks on the nth organist item to navigate to its edit form.
   */
  async clickOrganistAt(index: number): Promise<void> {
    await this.organistItems.nth(index).locator('ion-item').click();
    await this.waitForNavigation();
  }

  // ------------------------------------------------------------------ FAB / add

  async clickFab(): Promise<void> {
    await this.fabButton.click();
    await this.waitForNavigation();
  }

  // ------------------------------------------------------------------ swipe delete

  /**
   * Swipes the nth item to reveal the delete option and clicks it.
   */
  async swipeDeleteAt(index: number): Promise<void> {
    const item = this.organistItems.nth(index);
    const box = await item.boundingBox();
    if (!box) throw new Error(`Could not get bounding box of organist item at index ${index}`);

    await this.page.mouse.move(box.x + box.width - 10, box.y + box.height / 2);
    await this.page.mouse.down();
    await this.page.mouse.move(box.x + 20, box.y + box.height / 2, { steps: 15 });
    await this.page.mouse.up();
    await this.page.waitForTimeout(400);

    // The delete option (danger color) inside that sliding item
    await item.locator('ion-item-option[color="danger"]').click();
    await this.page.waitForTimeout(300);
  }

  /**
   * Swipes to reveal the edit option and clicks it.
   */
  async swipeEditAt(index: number): Promise<void> {
    const item = this.organistItems.nth(index);
    const box = await item.boundingBox();
    if (!box) throw new Error(`Could not get bounding box of organist item at index ${index}`);

    await this.page.mouse.move(box.x + box.width - 10, box.y + box.height / 2);
    await this.page.mouse.down();
    await this.page.mouse.move(box.x + 20, box.y + box.height / 2, { steps: 15 });
    await this.page.mouse.up();
    await this.page.waitForTimeout(400);

    await item.locator('ion-item-option[color="primary"]').click();
    await this.waitForNavigation();
  }

  // ------------------------------------------------------------------ assertions

  async expectOrganistVisible(name: string): Promise<void> {
    await expect(
      this.page.locator('ion-item h2').filter({ hasText: name }),
    ).toBeVisible({ timeout: 5000 });
  }

  async expectEmptyState(): Promise<void> {
    await expect(
      this.page.locator('text=Nenhuma organista cadastrada'),
    ).toBeVisible({ timeout: 5000 });
  }
}
