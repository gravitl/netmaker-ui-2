import { BaseModel } from './base_model';
import { FormFieldType } from '../utils/constants';

export class SignupModel extends BaseModel {
  email = {
    value: null,
    form: {
      fieldType: FormFieldType.TXTBOX,
      locator: this.page.locator('#email'),
      isRequired: true,
    },
  };

  password = {
    value: null,
    form: {
      fieldType: FormFieldType.TXTBOX,
      locator: this.page.locator('#password'),
      isRequired: true,
    },
  };

  passwordConf = {
    value: null,
    form: {
      fieldType: FormFieldType.TXTBOX,
      locator: this.page.locator('#confirm_password'),
      isRequired: true,
    },
  };

  constructor(page, email, password) {
    super(page);

    this.email.value = email;
    this.password.value = password;
    this.passwordConf.value = password;
  }
}
