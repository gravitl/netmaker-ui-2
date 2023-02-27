import { ApiRoutes } from '../constants/ApiRoutes';
import { Host } from '../models/Host';
import { Network } from '../models/Network';
import { Node } from '../models/Node';
import { baseService } from './BaseService';

export function getHosts() {
  return baseService.get<Host[]>(ApiRoutes.HOSTS);
}

export function deleteHost(id: Host['id']) {}

// export function createRelay(nodeId: Node['id'], networkId: Network['netid'], payload: CreateIngressNodeDto) {
//   return baseService.post<void>(`${ApiRoutes.NODES}/${networkId}/${nodeId}/createingress`);
// }
