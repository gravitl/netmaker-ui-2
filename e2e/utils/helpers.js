import { expect } from '@playwright/test';

export class TestHelper {
  static hasValue = (val) => {
    return typeof val !== 'undefined' && val !== null && val !== '' && val !== 0;
  };

  static isNothing = (val) => {
    return (
      typeof val === 'undefined' ||
      val === null ||
      (typeof val == 'string' && val.trim().length == 0) ||
      val === 0 ||
      (typeof val === 'object' && Object.entries(val).length === 0) ||
      (Array.isArray(val) && val.length === 0)
    );
  };

  static isNotNullOrUndefined = (prop) => {
    return typeof prop !== 'undefined' && prop !== null;
  };

  /**
   * hex gen helpers
   */
  static getRandomChar = () => {
    return Math.random().toString(36).substring(2);
  };

  static generateNumber = (digits = 10) => {
    let num = '5' + Math.floor(100000000 + Math.random() * 9000000000).toString();
    return num.slice(0, digits);
  };

  static async waitForTheTableLoadingIconToDisappear(page) {
    const slowExpect = expect.configure({ timeout: 30000 });

    //to not exist
    await slowExpect(page.locator(`.ant-spin-dot`)).toHaveCount(0);
  }
}
