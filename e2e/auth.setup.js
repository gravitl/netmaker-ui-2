import { test as setup, expect } from '@playwright/test';
import { LoginModel } from './model/login_model';
import { LoginPage } from './pages/login_page';
import { MainPage } from './pages/main_page';
import { STORAGE_STATE } from '../playwright.config';

setup('authenticate', async ({ page }) => {
  // Perform authentication steps.
  let login_pom = new LoginPage(page);
  await login_pom.visit();

  const login = new LoginModel(page, process.env.ACCOUNT_YOPMAIL_EMAIL2, process.env.ACCOUNT_YOPMAIL_PASSWORD2);
  await login.filloutForm();
  await login_pom.btnLogin.click();

  // Wait until the page receives the cookies.
  const main_pom = new MainPage(page, process.env.ACCOUNT_YOPMAIL_EMAIL2);
  const slowExpect = expect.configure({ timeout: 25000 });
  await slowExpect(main_pom.loggedinUserMenuItem).toBeVisible();

  // End of authentication steps.
  await page.context().storageState({ path: STORAGE_STATE });
});
