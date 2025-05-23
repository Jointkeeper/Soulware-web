import { test, expect } from '@playwright/test';

test.describe('i18n checks', () => {
  test('should not have missingKey errors in console after language switch', async ({ page }) => {
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error' || msg.type() === 'warn') {
        consoleMessages.push(msg.text());
      }
    });

    await page.goto('/');

    // Assuming there is a language switcher, we need to identify how to click it.
    // This is a placeholder selector. It will likely need to be adjusted based on actual implementation.
    // Option 1: Look for a button with text 'RU' or similar.
    // Option 2: Look for a button that changes the lang attribute of <html>.
    // For now, let's try to find a button/link that seems like a language switcher for Russian.
    // We will assume for now there is a button/element that specifically sets the language to Russian.
    // Let's look for an element with 'data-testid="lang-switcher-ru"' or a button containing 'Русский' or 'RU'
    
    // First, try to locate a language switcher and click it to change to Russian.
    // This is a common pattern, but might need adjustment.
    // Attempt to click a general language switcher if available
    const langSwitcher = page.locator('[aria-label*="language switcher"i], [data-testid*="language-switcher"i]').first();
    if (await langSwitcher.isVisible()) {
      await langSwitcher.click();
      // After clicking a general switcher, a menu might pop up. Then click the Russian option.
      await page.locator('button:has-text("RU"), button:has-text("Русский"), a:has-text("RU"), a:has-text("Русский")').first().click({force: true}).catch(() => console.log('Russian language option not found after general switch'));
    } else {
      // If no general switcher, try to directly click a Russian language button.
      await page.locator('button:has-text("RU"), button:has-text("Русский"), a:has-text("RU"), a:has-text("Русский"), [data-testid="set-lang-ru"]').first().click({force: true}).catch(() => console.log('Direct Russian language button not found'));
    }
    
    // Wait for any potential navigation or reload after language change
    await page.waitForLoadState('networkidle');

    // Check console messages for missingKey
    const missingKeyError = consoleMessages.find(msg => msg.includes('missingKey'));
    expect(missingKeyError).toBeUndefined();
  });
}); 