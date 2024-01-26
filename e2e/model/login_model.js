import { BaseModel } from './base_model';
import { FormFieldType } from '../utils/constants';

export class LoginModel extends BaseModel {
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

  constructor(page, email, password) {
    super(page);

    this.email.value = email;
    this.password.value = password;
  }
}
