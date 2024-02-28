import { Node } from '@/models/Node';

export interface CreateInternetGatewayDto {
  inet_node_client_ids: Node['id'][];
}

export interface UpdateInternetGatewayDto {
  inet_node_client_ids: Node['id'][];
}
