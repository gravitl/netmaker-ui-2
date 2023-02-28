import { Host } from '../../models/Host';

export interface CreateHostRelayDto {
  hostid: Host['id'];
  relayed_hosts: Host['id'][];
}
