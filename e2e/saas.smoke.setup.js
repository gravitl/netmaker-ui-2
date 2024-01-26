import { test as setup, expect } from '@playwright/test';
import { TestHelper } from './utils/helpers';

export const SMOKE_ACCOUNT = {
  email: process.env.SMOKE_ACCOUNT_YOPMAIL_EMAIL,
  password: process.env.SMOKE_ACCOUNT_YOPMAIL_PASSWORD,
};

export const TENANT_NAME = `elevenant-${TestHelper.getRandomChar()}`;

setup('remove existing account', async ({ page, request }) => {
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
