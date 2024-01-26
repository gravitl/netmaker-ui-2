import { BasePage } from './base_page';
import { TestHelper } from '../utils/helpers';
import { expect } from '@playwright/test';

export class TenantsPage extends BasePage {
  btnCreateTenant;
  optSaaSTenant;
  btnNext;
  btnCreate;
  btnRefresh;
  inptTenantName;
  tblList;
  subMenuManageAccount;

  constructor(page) {
    super(page, `${process.env.STG_ACNT_URL}tenants`);

    this.btnCreateTenant = page.getByRole('button', { name: ' Create Tenant' }); //locator('button').filter({ hasText: /^Create Tenant$/ })
    this.optSaaSTenant = page.getByRole('heading', { name: 'SaaS' });
    this.btnNext = page.getByRole('button', { name: 'Next' });
    this.btnRefresh = page.getByRole('button', { name: 'Refresh Tenants' });
    this.inptTenantName = page.getByPlaceholder('Tenant name');
    this.btnCreate = page.getByRole('button', { name: 'Create', exact: true });
    this.tblList = page.getByRole('table');
    this.subMenuManageAccount = page.getByRole('link', { name: 'Manage Account' });
  }

  async create(name = null) {
    if (name === null) return;

    await this.btnCreateTenant.click();
    await expect(this.optSaaSTenant).toBeVisible(); //wait for it to appear
    await this.optSaaSTenant.click();
    await this.btnNext.click();
    await this.inptTenantName.fill(name);
    await this.btnCreate.click();
  }

  async tenantExists(page, name = null, isAvailable = false) {
    if (name === null) return;
    const row = this.getTableRowLocator(name);

    await expect(row).toBeVisible();
    await expect(row.getByText('SaaS Pro')).toBeVisible();
    await expect(row.getByText(isAvailable ? 'ok' : 'unavailable')).toBeVisible();
  }

  async goToManageAccount(name = null) {
    const row = this.getTableRowLocator(name);
    await row.getByLabel('more').click();
    await this.subMenuManageAccount.click();
  }

  async goToDashboard(name = null) {
    const row = this.getTableRowLocator(name);
    await row.getByRole('button', { name: 'Go to Dashboard' }).click();
  }

  getTableRowLocator(name = null) {
    return this.tblList.locator(`tr:has-text("${name}")`);
  }

  async loginToTenantName(name = null) {
    const row = this.getTableRowLocator(name);
    await row.getByRole('button', { name: 'Login' }).click();
  }

  async waitForTenantToBeAvailable(page, name = null, recurseCounter = 6) {
    if (recurseCounter < 0) return;
    if (page.getByRole('table').locator(`tr:has-text("${name}")`).getByText('unavailable') !== null) {
      await this.btnRefresh.click();
      await page.waitForTimeout(5000); //5 seconds per recursion
      await TestHelper.waitForTheTableLoadingIconToDisappear(page);
      await this.waitForTenantToBeAvailable(page, name, --recurseCounter);
      return;
    }
  }
}
