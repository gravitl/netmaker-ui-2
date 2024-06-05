import { ExternalClient } from '@/models/ExternalClient';

export interface CreateExternalClientReqDto {
  clientid: ExternalClient['clientid'];
  publickey: ExternalClient['publickey'];
  address?: ExternalClient['address'];
  address6?: ExternalClient['address6'];
  extraallowedips?: ExternalClient['extraallowedips'];
}
