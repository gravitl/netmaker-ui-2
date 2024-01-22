import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/login_page';
import { SignupPage } from './pages/signup_page';
import { SignupModel } from './model/signup_model';
import { TestHelper } from './utils/helpers';

const sampleAccount = {
  email: 'dentest100@yopmail.com', //`${TestHelper.getRandomChar()}@${process.env.SAMPLE_EMAIL_DOMAIN}`,
  password: 'Pass@123',
};

test('can signup', async ({ page }) => {
  const login_pom = new LoginPage(page);
  const signup_pom = new SignupPage(page);
  const signup = new SignupModel(page, sampleAccount.email, sampleAccount.password);

  await login_pom.visit();
  await login_pom.navigateToSignUp();

  await signup.filloutForm();
  await signup_pom.signupButton.click();
});

test.afterAll(async () => {
  //todo
  //close account
});
