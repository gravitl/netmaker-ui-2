export class BasePage {
  page;
  url;

  constructor(page, url) {
    this.page = page;
    this.url = url;
  }

  async visit() {
    await this.page.goto(this.url);
  }
}
