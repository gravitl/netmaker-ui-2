import { BasePage } from './base_page';
import { expect } from '@playwright/test';

export class HostsPage extends BasePage {
  tblList;
  btnConnectHost;
  btnDiaNext;

  constructor(page) {
    super(page);

    this.tblList = page.getByRole('table');
    this.btnConnectHost = page.getByRole('button', { name: 'Connect a Host' });
    this.btnDiaNext = page.locator(`[role="dialog"]`).getByRole('button', { name: 'Next' });
    this.btnDiaFinish = page.locator(`[role="dialog"]`).getByRole('button', { name: 'Finish' });
  }

  async selectEnrollKey(name) {
    await this.page.locator(`tr:has-text("${name}")`).click();
  }

  async selectPlatform(pf) {
    await this.page.locator(`.os-button:has-text("${pf}")`).click();
  }

  async validateKeyRecordInTbl(name, validity) {
    const row = this.tblList.locator(`tr:has-text("${name}")`);
    await expect(row).toBeVisible();
    await expect(row.getByText(validity)).toBeVisible();
  }

  async connectHost(enrollKey, pf, verifyTokenVal = false) {
    await this.selectEnrollKey(enrollKey.name);
    await this.selectPlatform(pf);
    await this.btnDiaNext.click();

    if (verifyTokenVal) {
      await expect(this.dialogWindow.locator('code').getByText(enrollKey.token).first()).toBeVisible();
    }

    await this.btnDiaFinish.click();
  }

  async verifyRecordInTbl(objHost, objExpect) {
    const row = this.tblList.locator(`tr[data-row-key="${objHost.id}"]`);

    await objExpect(row.getByText(objHost.name)).toBeVisible();
    await objExpect(row.getByText(objHost.endpointip)).toBeVisible();
    await objExpect(row.getByText(objHost.wg_public_listen_port)).toBeVisible();
    await objExpect(row.getByText(objHost.version)).toBeVisible();
  }

  async mockHost(page, arrData = []) {
    await page.route('**/api/hosts', async (route) => {
      const response = await route.fetch();
      const json = await response.json();
      arrData.forEach((d) => {
        json.push(d);
      });
      await route.fulfill({ response, json });
    });
  }
}
