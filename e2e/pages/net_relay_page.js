import { BasePage } from './base_page';

export class RelayPage extends BasePage {
  btnCreateRelay;
  modalBtnCreateRelay;

  constructor(page) {
    super(page);

    this.btnCreateRelay = page.getByRole('button', { name: 'Create Relay' });
    this.modalBtnCreateRelay = this.dialogWindow.getByRole('button', { name: 'Create Relay' });
  }
}
