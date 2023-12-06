import { FormFieldType } from './constants';
import { TestHelper } from './helpers';

export class FormHelper {
  static async genericSetFieldVal(formMeta, value, instance = 0) {
    if (TestHelper.isNothing(value) || TestHelper.isNothing(formMeta) || TestHelper.isNothing(formMeta.fieldType))
      return;
    if (typeof formMeta.isDisabled !== 'undefined' && formMeta.isDisabled) return;
    if (TestHelper.isNotNullOrUndefined(formMeta?.instance)) instance = formMeta.instance;

    switch (formMeta.fieldType.name) {
      case FormFieldType.DDBOX.name:
        //todo
        break;
      case FormFieldType.DDBOX_MUI.name:
        //todo
        break;
      case FormFieldType.MULTI_DDBOX.name:
        //todo
        break;
      case FormFieldType.COMBOX.name:
        //todo
        break;
      case FormFieldType.TXTBOX.name:
        await formMeta.locator.fill(value);
        break;
      case FormFieldType.SWITCH.name:
        //todo
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
      case FormFieldType.FILE.name:
        //todo
        break;
      default:
      //nothing to do for now
    }
  }
}
