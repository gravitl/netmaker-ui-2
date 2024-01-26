import { BasePage } from './base_page';
import { expect } from '@playwright/test';

export class EnrollmentKeysPage extends BasePage {
  tblList;
  btnCreateKey;
  createFormLabel;
  btnSubmit;

  constructor(page) {
    super(page);

    this.tblList = page.getByRole('table');
    this.btnCreateKey = page.getByRole('button', { name: 'Create Key' });
    this.createFormLabel = page.getByText('Create a Key');
    this.btnSubmit = page.locator(`div[role="dialog"]`).getByRole('button', { name: 'Create Key' });
  }

  async validateKeyRecordInTbl(name, validity) {
    const row = this.tblList.locator(`tr:has-text("${name}")`);
    await expect(row).toBeVisible();
    await expect(row.getByText(validity)).toBeVisible();
  }
}
