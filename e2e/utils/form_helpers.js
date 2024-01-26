import { FormFieldType } from './constants';
import { TestHelper } from './helpers';

export class FormHelper {
  static async genericSetFieldVal(page, formMeta, value, instance = 0) {
    if (TestHelper.isNothing(value) || TestHelper.isNothing(formMeta) || TestHelper.isNothing(formMeta.fieldType))
      return;
    if (typeof formMeta.isDisabled !== 'undefined' && formMeta.isDisabled) return;
    if (TestHelper.isNotNullOrUndefined(formMeta?.instance)) instance = formMeta.instance;

    switch (formMeta.fieldType.name) {
      case FormFieldType.DDBOX.name:
        await this.setDdbox(page, formMeta.locator, value);
        //todo
        break;
      case FormFieldType.DDBOX_MUI.name:
        //todo
        break;
      case FormFieldType.MULTI_DDBOX.name:
        await this.setMultiDd(page, formMeta.locator, value);
        break;
      case FormFieldType.HYBRID_COMBOX.name:
        await formMeta.locator.click();
        await page.getByRole('cell', { name: value.name }).locator('a').click();
        break;
      case FormFieldType.COMBOX.name:
        //todo
        break;
      case FormFieldType.TXTBOX.name:
        await formMeta.locator.fill(value);
        break;
      case FormFieldType.MULTI_TXTDDBOX.name:
        for (let i = 0; i < value.length; i++) {
          await formMeta.locator.click();
          await page.keyboard.type(value[i]);
          await page.keyboard.press('Enter');
        }
        break;
      case FormFieldType.SWITCH.name:
        if (formMeta.locator.getAttribute('aria-checked') !== value.toString()) await formMeta.locator.click();
        break;
      case FormFieldType.LIST_CBOX.name:
        //todo
        break;
      case FormFieldType.LISTBOX.name:
        //todo
        break;
      case FormFieldType.DATETIME_PICKER.name:
        //todo
        break;
      case FormFieldType.CHBOX.name:
        //todo
        break;
      case FormFieldType.RADIO.name:
        await page.getByLabel(value.name).check();
        //todo
        break;
      case FormFieldType.FILE.name:
        //todo
        break;
      default:
      //nothing to do for now
    }
  }

  static async setDdbox(page, locator, value) {
    await locator.click();
    await page.getByTitle(value.name).locator('div').click();
  }

  static async setMultiDd(page, locator, values = []) {
    await page.locator(locator).click();
    //await locator.click();
    for (let i = 0; i < values.length; ++i) {
      await page.getByTitle(values[i].name).locator('div').click();
    }
  }
}
