import { BaseModel } from './base_model';
import { FormFieldType } from '../utils/constants';

export class EnrollmentKeyModel extends BaseModel {
  tag = {
    value: null,
    form: {
      fieldType: FormFieldType.TXTBOX,
      locator: this.page.locator('#add-enrollment-key-form_tags'),
      isRequired: true,
    },
  };

  type = {
    value: null,
    form: {
      fieldType: FormFieldType.RADIO,
      locator: null,
      isRequired: false,
    },
  };

  networks = {
    value: null,
    form: {
      fieldType: FormFieldType.MULTI_DDBOX,
      locator: '#add-enrollment-key-form_networks', //this.page.locator('#add-enrollment-key-form_networks'),
      isRequired: false,
    },
  };

  constructor(page, tag, type = null, networks) {
    super(page);

    this.tag.value = tag;
    this.type.value = type;
    this.networks.value = networks;
  }
}
