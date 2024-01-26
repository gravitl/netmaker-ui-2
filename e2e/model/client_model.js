import { BaseModel } from './base_model';
import { FormFieldType } from '../utils/constants';

export class ClientModel extends BaseModel {
  clientid = {
    value: null,
    form: {
      fieldType: FormFieldType.TXTBOX,
      locator: this.page.locator('#add-client-form_clientid'),
      isRequired: true,
    },
  };

  publickey = {
    value: null,
    form: {
      fieldType: FormFieldType.TXTBOX,
      locator: this.page.locator('#add-client-form_publickey'),
      isRequired: false,
    },
  };

  dns = {
    value: null,
    form: {
      fieldType: FormFieldType.TXTBOX,
      locator: this.page.locator('#add-client-form_dns'),
      isRequired: false,
    },
  };

  extraallowedips = {
    value: [],
    form: {
      fieldType: FormFieldType.MULTI_TXTDDBOX,
      locator: this.page.locator('#add-client-form_extraallowedips'),
      isRequired: false,
    },
  };

  constructor(page, clientid, publickey = null, dns = null, extraallowedips = []) {
    super(page);

    this.clientid.value = clientid;
    this.publickey.value = publickey;
    this.dns.value = dns;
    this.extraallowedips.value = extraallowedips;
  }
}
