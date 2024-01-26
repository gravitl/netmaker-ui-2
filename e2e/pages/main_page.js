import { BasePage } from './base_page';
import { expect } from '@playwright/test';

export class MainPage extends BasePage {
  loggedinUserMenuItem;
  profileMenuItem;
  switchTenantMenuItem;
  allNetworksMenuItem;
  enrollmentKeysMenuItem;
  hostsMenuItem;
  upgradeLink;

  constructor(page, username = null) {
    super(page, process.env.STG_BASE_URL);

    if (username !== null) {
      this.loggedinUserMenuItem = page.getByText(username);
    }
    this.profileMenuItem = page.getByText('Profile');
    this.switchTenantMenuItem = page.getByText('Switch Tenant');
    this.allNetworksMenuItem = page.getByText('All Networks');
    this.enrollmentKeysMenuItem = page.getByText('Enrollment Keys');
    this.upgradeLink = page.getByRole('link', { name: 'Upgrade Now' });
    this.hostsMenuItem = page.locator('li:has-text("Hosts")');
  }

  async visit() {
    //do nothing
  }

  async UxLoadIssueWorkaround(page) {
    //wait for the second refresh (workaround to a known UX issue)
    const responsePromise = page.waitForResponse(
      (resp) => resp.url().includes('/api/server/getconfig') && resp.status() === 200,
    );

    const slowExpect = expect.configure({ timeout: 50000 });
    await slowExpect(this.upgradeLink).toHaveCount(0);

    await responsePromise;
    //const response = await responsePromise;
  }

  async navigateToProfilePage() {
    await this.loggedinUserMenuItem.click();
    await this.profileMenuItem.click();
  }

  async navigateToNetworkName(name) {
    await this.page.getByRole('menuitem', { name: name }).click();
  }
}
