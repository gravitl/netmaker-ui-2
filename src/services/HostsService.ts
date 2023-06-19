import { ApiRoutes } from '../constants/ApiRoutes';
import { Host } from '../models/Host';
import { Network } from '../models/Network';
import { baseService } from './BaseService';

function getHosts() {
  return baseService.get<Host[]>(ApiRoutes.HOSTS);
}

function deleteHost(hostId: Host['id']) {
  return baseService.delete<Host>(`${ApiRoutes.HOSTS}/${hostId}`);
}
function updateHostsNetworks(hostId: Host['id'], networkId: Network['netid'], action: 'join' | 'leave') {
  return action === 'join'
    ? baseService.post<void>(`${ApiRoutes.HOSTS}/${hostId}/networks/${networkId}`)
    : baseService.delete<void>(`${ApiRoutes.HOSTS}/${hostId}/networks/${networkId}`);
}

function updateHost(hostId: Host['id'], payload: Host) {
  return baseService.put<Host>(`${ApiRoutes.HOSTS}/${hostId}`, payload);
}

function refreshAllHostsKeys() {
  return baseService.put<void>(`${ApiRoutes.HOSTS}/keys`);
}

function refreshHostKeys(hostId: Host['id']) {
  return baseService.put<void>(`${ApiRoutes.HOSTS}/${hostId}/keys`);
}

export const HostsService = {
  getHosts,
  deleteHost,
  updateHostsNetworks,
  updateHost,
  refreshAllHostsKeys,
  refreshHostKeys,
};
