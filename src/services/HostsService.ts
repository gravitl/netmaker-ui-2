import { ApiRoutes } from '../constants/ApiRoutes';
import { Host } from '../models/Host';
import { Network } from '../models/Network';
import { axiosService } from './BaseService';

function getHosts() {
  return axiosService.get<Host[]>(ApiRoutes.HOSTS);
}

function deleteHost(hostId: Host['id'], force = false) {
  return axiosService.delete<Host>(`${ApiRoutes.HOSTS}/${hostId}?force=${force}`);
}
function updateHostsNetworks(
  hostId: Host['id'],
  networkId: Network['netid'],
  action: 'join' | 'leave',
  forceLeave = false,
) {
  return action === 'join'
    ? axiosService.post<void>(`${ApiRoutes.HOSTS}/${hostId}/networks/${networkId}`)
    : axiosService.delete<void>(`${ApiRoutes.HOSTS}/${hostId}/networks/${networkId}?force=${forceLeave}`);
}

function updateHost(hostId: Host['id'], payload: Host) {
  return axiosService.put<Host>(`${ApiRoutes.HOSTS}/${hostId}`, payload);
}

function refreshAllHostsKeys() {
  return axiosService.put<void>(`${ApiRoutes.HOSTS}/keys`);
}

function refreshHostKeys(hostId: Host['id']) {
  return axiosService.put<void>(`${ApiRoutes.HOSTS}/${hostId}/keys`);
}

function requestHostPull(hostId: Host['id']) {
  return axiosService.post<void>(`${ApiRoutes.HOSTS}/${hostId}/sync`);
}

function upgradeClientVersion(hostId: Host['id']) {
  return axiosService.put<void>(`${ApiRoutes.HOSTS}/${hostId}/upgrade`);
}

export const HostsService = {
  getHosts,
  deleteHost,
  updateHostsNetworks,
  updateHost,
  refreshAllHostsKeys,
  refreshHostKeys,
  requestHostPull,
  upgradeClientVersion,
};
