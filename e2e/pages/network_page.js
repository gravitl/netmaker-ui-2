import { BasePage } from './base_page';

export class NetworkPage extends BasePage {
  tabOverview;
  tabHosts;
  tabRemoteAccess;
  tabRelays;
  tabEgress;
  tabDns;
  tabAcl;
  tabGraph;
  tabMetrics;

  constructor(page) {
    super(page);

    this.tabOverview = page.getByRole('tab', { name: 'Overview' });
    this.tabHosts = page.getByRole('tab', { name: 'Hosts' });
    this.tabRemoteAccess = page.getByRole('tab', { name: 'Clients' });
    this.tabRelays = page.getByRole('tab', { name: 'Relays' });
    this.tabEgress = page.getByRole('tab', { name: 'Egress' });
    this.tabDns = page.getByRole('tab', { name: 'DNS' });
    this.tabAcl = page.getByRole('tab', { name: 'Access Control' });
    this.tabGraph = page.getByRole('tab', { name: 'Graph' });
    this.tabMetrics = page.getByRole('tab', { name: 'Metrics' });
  }

  async mockNodes(page, arrData = []) {
    await page.route('**/api/nodes', async (route) => {
      const response = await route.fetch();
      const json = await response.json();
      arrData.forEach((d) => {
        json.push(d);
      });
      await route.fulfill({ response, json });
    });
  }
}
