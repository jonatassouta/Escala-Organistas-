import { Page, Locator, expect } from '@playwright/test';

export class BasePage {
  constructor(protected page: Page) {}

  /**
   * Asserts that the last ion-title in the DOM matches the expected text.
   * Using .last() because Ionic stacks pages and older page titles remain in DOM.
   */
  async waitForPage(title: string): Promise<void> {
    await expect(this.page.locator('ion-title').last()).toContainText(title, { timeout: 8000 });
  }

  /**
   * Clicks the ion-back-button and waits for the Ionic navigation animation.
   */
  async clickBack(): Promise<void> {
    await this.page.locator('ion-back-button').click();
    await this.page.waitForTimeout(400);
  }

  /**
   * Short pause for Ionic route/animation transitions.
   */
  async waitForNavigation(): Promise<void> {
    await this.page.waitForTimeout(400);
  }

  /**
   * Waits for an ion-toast to appear with the given message text.
   */
  async waitForToast(message: string): Promise<Locator> {
    const toast = this.page.locator('ion-toast').filter({ hasText: message });
    await expect(toast).toBeVisible({ timeout: 5000 });
    return toast;
  }

  /**
   * Waits for an ion-alert to appear.
   */
  async waitForAlert(): Promise<Locator> {
    await this.page.waitForSelector('ion-alert', { state: 'visible', timeout: 5000 });
    return this.page.locator('ion-alert');
  }

  /**
   * Clicks a button inside an ion-alert by its text.
   */
  async clickAlertButton(buttonText: string): Promise<void> {
    await this.page.locator('ion-alert button', { hasText: buttonText }).click();
    await this.page.waitForTimeout(300);
  }
}
