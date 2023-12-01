import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/login_page';

test('has title', async ({ page }) => {
  const pom = new LoginPage(page);

  await pom.visit();

  await expect(pom.signinHeader).toBeVisible();
});
