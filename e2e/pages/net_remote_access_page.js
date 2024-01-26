import { BasePage } from './base_page';

export class RemoteAccessPage extends BasePage {
  btnCreateGw;
  btnCreateClient;
  modalBtnCreateClient;
  drwrAdvSettings;

  constructor(page) {
    super(page);

    this.btnCreateGw = page.getByRole('tab', { name: 'Overview' });
    this.btnCreateClient = page.getByRole('button', { name: 'Create Client' });
    this.modalBtnCreateClient = this.dialogWindow.getByRole('button', { name: 'Create Client' });
    this.drwrAdvSettings = page.getByRole('button', { name: 'Advanced Settings' });
  }
}
