import { test, expect } from '@playwright/test';
import { TenantsPage } from './pages/tenants_page';
import { TestHelper } from './utils/helpers';
import { LoginPage } from './pages/login_page';
import { SignupPage } from './pages/signup_page';
import { SignupModel } from './model/signup_model';
import { ProfileModel } from './model/profile_model';
import { YopmailPage } from './utils/email/yopmail_page';
import { LoginModel } from './model/login_model';
import { ACL, HOST_PLATFORMS, RoleAtCompany } from './model/constants';
import { MainPage } from './pages/main_page';
import { TenantManagementPage } from './pages/tenant_mgmt_page';
import { AllNetworksPage } from './pages/all_networks_page';
import { EnrollmentKeysPage } from './pages/enrollment_keys_page';
import { NetworkModel } from './model/network_model';
import { EnrollmentKeyModel } from './model/enrollment_key_model';
import { HostsPage } from './pages/hosts_page';
import { SAMPLE_HOSTS } from './data/host_data';
import { SAMPLE_ENROLL_KEYS } from './data/enroll_keys_data';
import { NetworkPage } from './pages/network_page';
import { SAMPLE_NODES } from './data/nodes_data';
import { ClientModel } from './model/client_model';
import { RemoteGatewayModel } from './model/ra_gw_model';
import { SAMPLE_EXT_CLIENTS } from './data/ext_client_data';
import { RemoteAccessPage } from './pages/net_remote_access_page';

export const SMOKE_ACCOUNT = {
  email: process.env.SMOKE_ACCOUNT_YOPMAIL_EMAIL,
  password: process.env.SMOKE_ACCOUNT_YOPMAIL_PASSWORD,
};

export const INVITEE_ACCOUNTS = [
  { email: process.env.ACCOUNT_YOPMAIL_EMAIL2, password: process.env.ACCOUNT_YOPMAIL_PASSWORD2 },
];

export const TENANT_NAME = `elevenant-${TestHelper.getRandomChar()}`;

export const DEFAULT_NETWORK = {
  name: 'netmaker',
  cidr: '10.101.0.0/16',
};

export const DEFAULT_KEY = {
  name: 'netmaker',
  status: 'Valid',
};

export const SAMPLE_NETWORK = {
  name: 'e2e-net',
  ipv4: '192.168.111.0/24',
  ipv6: 'fd11::/112',
};

let SAMPLE_ENROLL_KEY = SAMPLE_ENROLL_KEYS[0];

let SMOKE_HOSTS = SAMPLE_HOSTS;
let SMOKE_NODES = SAMPLE_NODES;
let SMOKE_RA_GW = [{ host: SMOKE_HOSTS[0], defDns: '8.8.4.4' }];
let SMOKE_CLIENTS = SAMPLE_EXT_CLIENTS;

//remove existing account
test.beforeAll(async ({ request }) => {
  //check if sample account exists
  const acnt = await request.get(
    `${process.env.STG_API_ACNT_URL}auth/signup/email/exists?email=${SMOKE_ACCOUNT.email.replace('@', '%40')}`,
  );
  let acntBody = await acnt.json();
  if (acntBody.exists) {
    //login to account
    const login = await request.post(`${process.env.STG_API_ACNT_URL}auth/signin`, {
      data: {
        formFields: [
          { id: 'email', value: SMOKE_ACCOUNT.email },
          { id: 'password', value: SMOKE_ACCOUNT.password },
        ],
      },
    });

    //get token
    const testing2 = await login.headersArray().find((r) => r.name === 'St-Access-Token');

    //delete account using the token
    const delAcnt = await request.delete(`${process.env.STG_API_ACNT_URL}api/v1/user`, {
      headers: {
        Cookie: `sAccessToken=${encodeURIComponent(testing2.value)}`,
      },
    });
    await expect(delAcnt.ok()).toBeTruthy();
  }
});

test.beforeEach(async ({ page }, testInfo) => {
  if (testInfo.title === 'can signup using email address') return;

  let login_pom = new LoginPage(page);
  await login_pom.visit();

  const login = new LoginModel(page, SMOKE_ACCOUNT.email, SMOKE_ACCOUNT.password);
  await login.filloutForm();
  await login_pom.btnLogin.click();

  // Wait until the page receives the cookies.
  const main_pom = new MainPage(page, SMOKE_ACCOUNT.email);
  const slowExpect = expect.configure({ timeout: 30000 });
  await slowExpect(main_pom.loggedinUserMenuItem).toBeVisible();
});

test('can signup using email address', async ({ page, context }) => {
  test.setTimeout(90000);

  let login_pom = new LoginPage(page);
  const signup_pom = new SignupPage(page);
  const signup = new SignupModel(page, SMOKE_ACCOUNT.email, SMOKE_ACCOUNT.password);

  await login_pom.visit();
  await login_pom.navigateToSignUp();

  await signup.filloutForm();
  await signup_pom.signupButton.click();

  //specify account information
  const profile = new ProfileModel(page, 'My First Name', 'My Last Name', 'My Company Name', RoleAtCompany.QA);
  await profile.filloutForm();
  await signup_pom.finalizeRegistrationBtn.click();

  //temporary: arbitrarily wait for the email verification message
  await page.waitForTimeout(10000);

  //verify email
  const emailPage = await context.newPage();
  const yopmail_pom = new YopmailPage(emailPage);
  const newPagePromise = emailPage.waitForEvent('popup');
  await yopmail_pom.verifyEmail(process.env.YOPMAIL_URL);
  const newPage = await newPagePromise;

  //waits for the verification to finish
  await newPage.getByRole('button', { name: 'Click here to verify email' });
  await newPage.waitForTimeout(10000);
  /* login_pom = new LoginPage(newPage)
  await expect(login_pom.btnLogin).toBeVisible(); */

  //temporary: close account
  //const main_pom = new MainPage(newPage, sampleAccount.email)
  //const profile_pom = new ProfilePage(newPage)
  //await main_pom.navigateToProfilePage()
  //await profile_pom.closeAccount()
});

test('can create and login to tenant; and then invite user', async ({ page }) => {
  test.setTimeout(240000);

  let tenants_pom = new TenantsPage(page);
  //await tenants_pom.visit();
  await tenants_pom.create(TENANT_NAME);
  await tenants_pom.tenantExists(page, TENANT_NAME);

  //navigate to dash
  await tenants_pom.goToManageAccount(TENANT_NAME);
  let tenant_mgmt_pom = new TenantManagementPage(page, TENANT_NAME);
  await tenant_mgmt_pom.validateInfo();

  //invite user
  await tenant_mgmt_pom.tabUsers.click();
  await tenant_mgmt_pom.inviteUser(INVITEE_ACCOUNTS[0].email);
  await tenant_mgmt_pom.validateInvite(INVITEE_ACCOUNTS[0].email);

  //validate tenant availability
  const main_pom = new MainPage(page);
  await main_pom.switchTenantMenuItem.click();
  await tenants_pom.waitForTenantToBeAvailable(page, TENANT_NAME);
  await tenants_pom.tenantExists(page, TENANT_NAME, true);

  //can login to tenant
  await tenants_pom.loginToTenantName(TENANT_NAME);
});

test('can create network and key', async ({ page }) => {
  test.setTimeout(60000);

  const main_pom = new MainPage(page, SMOKE_ACCOUNT.email);
  await main_pom.UxLoadIssueWorkaround(page);

  //validate one network exists
  await main_pom.allNetworksMenuItem.click();
  const allnet_pom = new AllNetworksPage(page);
  await allnet_pom.validateNetworkRecordInTbl(DEFAULT_NETWORK.name, DEFAULT_NETWORK.cidr);
  await expect(page.getByRole('menuitem', { name: 'netmaker' })).toBeVisible();

  //create network
  await allnet_pom.btnCreate.click();
  await expect(allnet_pom.createFormLabel).toBeVisible();
  const network = new NetworkModel(page, SAMPLE_NETWORK.name, SAMPLE_NETWORK.ipv4, SAMPLE_NETWORK.ipv6, ACL.ALLOW);
  await network.filloutForm();
  await allnet_pom.btnSubmit.click();

  //validate new network exists
  await allnet_pom.validateNetworkRecordInTbl(SAMPLE_NETWORK.name, SAMPLE_NETWORK.ipv4, SAMPLE_NETWORK.ipv6);
  await expect(page.getByRole('menuitem', { name: SAMPLE_NETWORK.name })).toBeVisible();

  //one key exists
  await main_pom.enrollmentKeysMenuItem.click();
  const keys_pom = new EnrollmentKeysPage(page);
  await keys_pom.validateKeyRecordInTbl(DEFAULT_KEY.name, DEFAULT_KEY.status);

  //create key
  await page.route('**/api/v1/enrollment-keys', async (route) => {
    const response = await route.fetch();
    const respbody = await response.json();
    SAMPLE_ENROLL_KEY.token = respbody.token;
    await route.fulfill({ response, respbody });
  });
  await keys_pom.btnCreateKey.click();
  await expect(keys_pom.createFormLabel).toBeVisible();
  const enrollKey = new EnrollmentKeyModel(page, SAMPLE_ENROLL_KEY.name, SAMPLE_ENROLL_KEY.type, [SAMPLE_NETWORK]);
  await enrollKey.filloutForm();
  await keys_pom.btnSubmit.click();

  //validate new key exists
  await keys_pom.validateKeyRecordInTbl(SAMPLE_ENROLL_KEY.name, 'Valid');
});

test('can create hosts', async ({ page }) => {
  test.setTimeout(120000);

  const hosts_page = new HostsPage(page);
  await hosts_page.mockHost(page, [SMOKE_HOSTS[0]]);

  const main_pom = new MainPage(page, SMOKE_ACCOUNT.email);
  await main_pom.UxLoadIssueWorkaround(page);

  //validate no host exists
  await expect(main_pom.hostsMenuItem).toBeVisible();
  await main_pom.hostsMenuItem.click();
  await expect(hosts_page.tblList).toHaveCount(0);

  //connect a linux host
  await hosts_page.btnConnectHost.click();
  await hosts_page.connectHost(SAMPLE_ENROLL_KEY, HOST_PLATFORMS.LINUX, true);

  //verify host
  const slowExpect = expect.configure({ timeout: 30000 });
  await hosts_page.verifyRecordInTbl(SMOKE_HOSTS[0], slowExpect);
});

test('can setup remote access', async ({ page }) => {
  test.setTimeout(120000);

  //mock host
  const hosts_page = new HostsPage(page);
  await hosts_page.mockHost(page, SMOKE_HOSTS);

  //mock nodes
  const network_pom = new NetworkPage(page);
  await network_pom.mockNodes(page, SMOKE_NODES);

  //mock ingress
  //  await page.route('**/api/nodes/*/*/createingress', async route => {
  //    //const response = await route.fetch();
  //    //const json = await response.json();
  //    const json = MOCK_IN_GW[0];
  //    await route.fulfill({json});
  //    /* await route.fulfill({
  //      json,
  //      //response,
  //      //json,
  //      //headers: {
  //      //  ...response.headers(),
  //      //  'Status Code': 200
  //      //}
  //    }); */
  //  });

  //navigate to network page
  const main_pom = new MainPage(page, SMOKE_ACCOUNT.email);
  await main_pom.UxLoadIssueWorkaround(page);
  await main_pom.navigateToNetworkName(SAMPLE_NETWORK.name);
  await network_pom.tabRemoteAccess.click();

  //create
  const ra_pom = new RemoteAccessPage(page);
  await ra_pom.btnCreateClient.click();
  await ra_pom.drwrAdvSettings.click();
  const raGw = new RemoteGatewayModel(page, SMOKE_RA_GW[0].host, SMOKE_RA_GW[0].defDns);
  const extClient1 = new ClientModel(
    page,
    SMOKE_CLIENTS[0].clientid,
    SMOKE_CLIENTS[0].publickey,
    SMOKE_CLIENTS[0].dns,
    SMOKE_CLIENTS[0].extraallowedips,
  );
  //const extClient2 = new ClientModel(page, SMOKE_CLIENTS[1].clientid, SMOKE_CLIENTS[1].publickey, SMOKE_CLIENTS[1].dns, SMOKE_CLIENTS[1].extraallowedips);
  await raGw.filloutForm();
  await extClient1.filloutForm();
  await ra_pom.modalBtnCreateClient.click();
});

/* 
test('can setup relay', async ({ page }) => { 
  //mock host
  const hosts_page = new HostsPage(page);
  await hosts_page.mockHost(page, SMOKE_HOSTS);

  //mock nodes
  const network_pom = new NetworkPage(page);
  await network_pom.mockNodes(page, SMOKE_NODES);

  //navigate to network page
  const main_pom = new MainPage(page, SMOKE_ACCOUNT.email);
  await main_pom.UxLoadIssueWorkaround(page);
  await main_pom.navigateToNetworkName(SAMPLE_NETWORK.name);
  await network_pom.tabRelays.click();

  //create relay

}) */
