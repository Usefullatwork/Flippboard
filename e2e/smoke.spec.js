import { test, expect } from '@playwright/test';

// One smoke test: boot, hotkey navigation, kiosk enter/exit.
// Esc-quits-app is Electron-UA-gated in Controls.js, so Esc is safe here.
test('boot, D flips to next quote, F enters kiosk, Esc exits', async ({ page }) => {
  await page.goto('/');

  // Boot: board rendered, first quote's author shown
  await expect(page.locator('#vestaboard-screen')).toBeVisible();
  const source = page.locator('#quote-source-label');
  await expect(source).toHaveText('— Mahatma Gandhi');

  // D = next quote (sequential mode: deterministic second quote)
  await page.keyboard.press('d');
  await expect(source).toHaveText('— Eleanor Roosevelt');

  // F = kiosk mode on, Esc = off
  await page.keyboard.press('f');
  await expect(page.locator('body')).toHaveClass(/kiosk-mode/);
  await page.keyboard.press('Escape');
  await expect(page.locator('body')).not.toHaveClass(/kiosk-mode/);
});
