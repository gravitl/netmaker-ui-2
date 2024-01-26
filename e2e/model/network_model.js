import { BaseModel } from './base_model';
import { FormFieldType } from '../utils/constants';

export class NetworkModel extends BaseModel {
  netid = {
    value: null,
    form: {
      fieldType: FormFieldType.TXTBOX,
      locator: this.page.locator('#add-network-form_netid'),
      isRequired: true,
    },
  };

  isipv4 = {
    value: true,
    form: {
      fieldType: FormFieldType.SWITCH,
      locator: this.page.locator('#add-network-form_isipv4'),
      isRequired: false,
    },
  };

  addressrange = {
    value: null,
    form: {
      fieldType: FormFieldType.TXTBOX,
      locator: this.page.locator('#add-network-form_addressrange'),
      isRequired: false,
    },
  };

  isipv6 = {
    value: false,
    form: {
      fieldType: FormFieldType.SWITCH,
      locator: this.page.locator('#add-network-form_isipv6'),
      isRequired: false,
    },
  };

  addressrange6 = {
    value: null,
    form: {
      fieldType: FormFieldType.TXTBOX,
      locator: this.page.locator('#add-network-form_addressrange6'),
      isRequired: false,
    },
  };

  //todo
  //defaultacl = {
  //  value: null,
  //  form: {
  //    fieldType: FormFieldType.DDBOX,
  //    locator: this.page.locator('#add-network-form_defaultacl'),
  //    isRequired: false,
  //  },
  //};

  constructor(page, netid, addressrange = null, addressrange6 = null) {
    //, defaultacl) {

    super(page);

    this.netid.value = netid;
    if (addressrange === null) this.isipv4.value = false;
    this.addressrange.value = addressrange;
    if (addressrange6 !== null) this.isipv6.value = true;
    this.addressrange6.value = addressrange6;
    //this.defaultacl.value = defaultacl;
  }
}
