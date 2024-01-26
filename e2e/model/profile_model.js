import { BaseModel } from './base_model';
import { FormFieldType } from '../utils/constants';

export class ProfileModel extends BaseModel {
  first_name = {
    value: null,
    form: {
      fieldType: FormFieldType.TXTBOX,
      locator: this.page.locator('#first_name'),
      isRequired: true,
    },
  };

  last_name = {
    value: null,
    form: {
      fieldType: FormFieldType.TXTBOX,
      locator: this.page.locator('#last_name'),
      isRequired: true,
    },
  };

  company_name = {
    value: null,
    form: {
      fieldType: FormFieldType.TXTBOX,
      locator: this.page.locator('#company_name'),
      isRequired: false,
    },
  };

  primary_role = {
    value: null,
    form: {
      fieldType: FormFieldType.DDBOX,
      locator: this.page.locator('#primary_role'),
      isRequired: false,
    },
  };

  company_size_reported = {
    value: null,
    form: {
      fieldType: FormFieldType.DDBOX,
      locator: this.page.locator('#company_size_reported'),
      isRequired: false,
    },
  };

  machine_estimate = {
    value: null,
    form: {
      fieldType: FormFieldType.DDBOX,
      locator: this.page.locator('#machine_estimate'),
      isRequired: false,
    },
  };

  primary_use_case = {
    value: null,
    form: {
      fieldType: FormFieldType.DDBOX,
      locator: this.page.locator('#primary_use_case'),
      isRequired: false,
    },
  };

  infrastructure_group = {
    value: null,
    form: {
      fieldType: FormFieldType.DDBOX,
      locator: this.page.locator('#infrastructure_group'),
      isRequired: false,
    },
  };

  user_id;

  constructor(
    page,
    first_name,
    last_name,
    company_name = null,
    primary_role = null,
    company_size_reported = null,
    machine_estimate = null,
    primary_use_case = null,
    infrastructure_group = null,
    user_id = null,
  ) {
    super(page);

    this.first_name.value = first_name;
    this.last_name.value = last_name;
    this.company_name.value = company_name;
    this.primary_role.value = primary_role;
    this.company_size_reported.value = company_size_reported;
    this.machine_estimate.value = machine_estimate;
    this.primary_use_case.value = primary_use_case;
    this.infrastructure_group.value = infrastructure_group;
    this.user_id = user_id;
  }
}
