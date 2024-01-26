import { BasePage } from './base_page';

export class LoginPage extends BasePage {
  signinHeader;
  signupLink;
  btnGoogle;
  btnGithub;
  btnLogin;

  constructor(page) {
    super(page, process.env.STG_ACNT_URL);

    this.signinHeader = page.getByRole('heading', { name: 'Sign in' });
    this.signupLink = page.locator('a', { hasText: 'Sign up' });
    this.btnGoogle = page.locator('button', { hasText: 'Continue with Google' });
    this.btnGithub = page.locator('button', { hasText: 'Continue with Github' });
    this.btnLogin = page.locator('button', { hasText: 'Login' });
  }

  async navigateToSignUp() {
    await this.signupLink.click();
  }
}

export class GoogleLoginPage extends BasePage {
  constructor(page) {
    super(page, process.env.STG_ACNT_URL);

    this.signinHeader = page.locator('h2', { hasText: 'Sign in' });
    this.signupLink = page.locator('a', { hasText: 'Sign up' });
    this.btnGoogle = page.locator('button', { hasText: 'Continue with Google' });
    this.btnGithub = page.locator('button', { hasText: 'Continue with Github' });
  }

  async navigateToSignUp() {
    await this.signupLink.click();
  }
}
