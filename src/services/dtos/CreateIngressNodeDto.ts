import { Node } from '@/models/Node';

export interface CreateIngressNodeDto {
  extclientdns: Node['ingressdns'];
  is_internet_gw: Node['isinternetgateway'];
  metadata: Node['metadata'];
}
