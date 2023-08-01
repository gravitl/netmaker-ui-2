import { ExtClientAcls, ExternalClient } from '../../models/ExternalClient';

export interface UpdateExternalClientDto {
  clientid: ExternalClient['clientid'];
  enabled: ExternalClient['enabled'];
  dns: ExternalClient['dns'];
  extraallowedips: ExternalClient['extraallowedips'];
  deniednodeacls?: ExtClientAcls;
}
