import { BasePage } from '../../pages/base_page';

export class YopmailPage extends BasePage {
  addressInput;
  checkInboxBtn;

  constructor(page) {
    super(page, process.env.STG_ACNT_URL);

    this.addressInput = page.locator('#login');
    this.checkInboxBtn = page.getByPlaceholder('Enter your inbox here');
  }

  async navigateToInbox(addr) {
    await this.addressInput.fill(addr);
    await this.addressInput.press('Enter');
    await this.checkInboxBtn.click();
  }

  async verifyEmail(emailProviderUrl = null) {
    await this.page.goto(emailProviderUrl);
    await this.page.bringToFront();
    await this.checkInboxBtn.fill('dentest');
    await this.checkInboxBtn.press('Enter');
    await this.page.frameLocator('iframe[name="ifmail"]').getByRole('link', { name: 'Verify My Email' }).click();
  }
}
