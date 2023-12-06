import { BasePage } from './base_page';

export class LoginPage extends BasePage {
  signinHeader;
  signupLink;

  constructor(page) {
    super(page, process.env.STG_ACNT_URL);

    this.signinHeader = page.locator('h2', { hasText: 'Sign in' });
    this.signupLink = page.locator('a', { hasText: 'Sign up' });
  }

  async navigateToSignUp() {
    await this.signupLink.click();
  }
}
