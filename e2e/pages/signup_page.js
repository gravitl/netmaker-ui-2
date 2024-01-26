import { BasePage } from './base_page';

export class SignupPage extends BasePage {
  signinHeader;
  signupButton;
  finalizeRegistrationBtn;

  constructor(page) {
    super(page, process.env.STG_ACNT_URL);

    this.signinHeader = page.locator('h2', { hasText: 'Sign in' });
    this.signupButton = page.locator('button[type="submit"]');
    this.finalizeRegistrationBtn = page.getByRole('button', { name: 'Finalize registration' });
  }

  async visit() {
    //do nothing
  }
}
