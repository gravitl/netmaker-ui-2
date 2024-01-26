import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/login_page';

// Reset storage state for this file to avoid being authenticated
test.use({ storageState: { cookies: [], origins: [] } });

test('has title', async ({ page }) => {
  const pom = new LoginPage(page);

  await pom.visit();

  await expect(pom.signinHeader).toBeVisible();
});
