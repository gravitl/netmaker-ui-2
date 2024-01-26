import { BaseModel } from './base_model';
import { FormFieldType } from '../utils/constants';

export class RemoteGatewayModel extends BaseModel {
  gatewayId = {
    value: null,
    form: {
      fieldType: FormFieldType.HYBRID_COMBOX,
      locator: this.page.locator('#add-client-form_gatewayId'),
      isRequired: true,
    },
  };

  extclientdns = {
    value: null,
    form: {
      fieldType: FormFieldType.TXTBOX,
      locator: this.page.locator('#add-client-form_extclientdns'),
      isRequired: false,
    },
  };

  constructor(page, gatewayId, extclientdns = null) {
    super(page);

    this.gatewayId.value = { name: gatewayId.name };
    this.extclientdns.value = extclientdns;
  }
}
