import { Network } from '@/models/Network';
import { Node } from '@/models/Node';

export interface CreateNodeRelayDto {
  nodeid: Node['id'];
  netid: Network['netid'];
  relayaddrs: Node['id'][];
}
