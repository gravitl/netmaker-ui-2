export class BasePage {
  page;
  url;
  dialogWindow;

  constructor(page, url) {
    this.page = page;
    this.url = url;
    this.dialogWindow = page.locator('[role="dialog"]').first();
  }

  async visit() {
    await this.page.goto(this.url);
  }
}
