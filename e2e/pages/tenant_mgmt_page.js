import { BasePage } from './base_page';
import { expect } from '@playwright/test';

export class TenantManagementPage extends BasePage {
  lblTenant;
  tabUsers;
  btnAddUser;
  inptUserEmail;
  btnInvite;
  tblUser;
  tabSettings;
  dtlName;
  dtlId;

  page;

  constructor(page, name) {
    super(page, `${process.env.STG_ACNT_URL}dashboard?tenantId=**`);

    this.page = page;
    this.lblTenant = page.locator(`header span:has-text("${name}")`);
    this.tabUsers = page.getByRole('tab', { name: 'Users' });
    this.btnAddUser = page.getByRole('button', { name: 'Add User' });
    this.inptUserEmail = page.getByPlaceholder('For e.g. john@gmail.com');
    this.btnInvite = page.getByRole('button', { name: 'Send invite' });
    this.tblUser = page.locator('table:has-text("Owner")');

    this.tabSettings = page.getByRole('tab', { name: 'Settings' });
    this.dtlName = page.locator(`li:has-text("Tenant Name")`).getByText(name);
    this.dtlId = page.locator(`li:has-text("Tenant ID")`);
  }

  async validateInfo() {
    await expect(this.lblTenant).toBeVisible();

    await this.tabSettings.click();
    await expect(this.lblTenant).toBeVisible();
    await expect(this.dtlName).toBeVisible();
  }

  async inviteUser(inviteeEmail = null) {
    await this.btnAddUser.click();
    await this.inptUserEmail.fill(inviteeEmail);
    await this.btnInvite.click();
  }

  async validateInvite(inviteeEmail = null) {
    const row = this.tblUser.locator(`tr:has-text("${inviteeEmail}")`);
    await expect(row).toBeVisible();
    await expect(row.getByText(`Invite`)).toBeVisible();
  }
}
