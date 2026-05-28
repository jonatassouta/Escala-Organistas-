import { Page } from '@playwright/test';

/**
 * Clears all localStorage keys used by @capacitor/preferences in web mode.
 * Capacitor/Preferences stores keys with the prefix "_cap_" in localStorage.
 */
export async function clearAppStorage(page: Page): Promise<void> {
  await page.evaluate(() => {
    const keysToRemove: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key) keysToRemove.push(key);
    }
    keysToRemove.forEach((k) => window.localStorage.removeItem(k));
  });
}

/**
 * Clears storage and navigates to /home, then waits for the app to
 * re-seed default data (organists + settings) on first load.
 *
 * Must navigate FIRST so the page is on the app origin before
 * accessing localStorage (avoids SecurityError on about:blank).
 */
export async function resetAndLoad(page: Page): Promise<void> {
  // Navigate to the app origin first so localStorage is accessible
  await page.goto('/home');
  await page.waitForLoadState('domcontentloaded');
  // Clear all storage
  await clearAppStorage(page);
  // Reload so ensureInitialized() runs again and re-seeds defaults
  await page.reload();
  await page.waitForLoadState('networkidle');
  // Extra wait for Ionic + Capacitor async init
  await page.waitForTimeout(700);
}

/**
 * Seeds a specific localStorage value directly (bypasses Capacitor Preferences
 * layer — use only when you need fine-grained control).
 */
export async function setStorageKey(page: Page, key: string, value: unknown): Promise<void> {
  await page.evaluate(
    ([k, v]) => window.localStorage.setItem(`_cap_${k}`, JSON.stringify(v)),
    [key, value] as [string, unknown],
  );
}
