import { BasePage } from './base_page';
import { expect } from '@playwright/test';

export class AllNetworksPage extends BasePage {
  tblList;
  btnCreate;
  createFormLabel;
  btnSubmit;

  constructor(page) {
    super(page, process.env.STG_BASE_URL);

    this.tblList = page.getByRole('table');
    this.btnCreate = page.getByRole('button', { name: 'Create Network' });
    this.createFormLabel = page.getByLabel('Create a Network');
    this.btnSubmit = page.locator(`div[role="dialog"]`).getByRole('button', { name: 'Create Network' });
  }

  async validateNetworkRecordInTbl(name, addressRange4 = null, addressRange6 = null) {
    const row = this.tblList.locator(`tr:has-text("${name}")`);
    await expect(row).toBeVisible();
    if (addressRange4 !== null) await expect(row.getByText(addressRange4)).toBeVisible();
    if (addressRange6 !== null) await expect(row.getByText(addressRange6)).toBeVisible();
  }
}
