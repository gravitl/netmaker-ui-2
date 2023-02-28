import { ExternalClient } from '../../models/ExternalClient';

export interface UpdateExternalClientDto {
  clientid: ExternalClient['clientid'];
  enabled: ExternalClient['enabled'];
}
