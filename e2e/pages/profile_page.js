import { BasePage } from './base_page';

export class ProfilePage extends BasePage {
  btnCloseAccount;
  btnCloseAcntModal;

  constructor(page) {
    super(page, process.env.STG_BASE_URL);

    this.btnCloseAccount = page.getByTestId('close-account-button');
    this.btnCloseAcntModal = page.getByRole('button', { name: 'Close account' });
  }

  async visit() {
    //do nothing
  }

  async closeAccount() {
    await this.btnCloseAccount.click();
    await this.btnCloseAcntModal.click();
  }
}
