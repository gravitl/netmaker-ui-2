import { ApiRoutes } from '../constants/ApiRoutes';
import { Host } from '../models/Host';
import { Network } from '../models/Network';
import { baseService } from './BaseService';
import { CreateHostRelayDto } from './dtos/CreateHostRelayDto';

function getHosts() {
  return baseService.get<Host[]>(ApiRoutes.HOSTS);
}

function deleteHost(hostId: Host['id']) {
  return baseService.delete<Host>(`${ApiRoutes.HOSTS}/${hostId}`);
}

function createHostRelay(hostId: Host['id'], payload: CreateHostRelayDto) {
  return baseService.post<Host>(`${ApiRoutes.HOSTS}/${hostId}/relay`, payload);
}

function deleteHostRelay(hostId: Host['id']) {
  return baseService.delete<Host>(`${ApiRoutes.HOSTS}/${hostId}/relay`);
}

function updateHostsNetworks(hostId: Host['id'], networkId: Network['netid'], action: 'join' | 'leave') {
  return action === 'join'
    ? baseService.post<void>(`${ApiRoutes.HOSTS}/networks/${networkId}`)
    : baseService.delete<void>(`${ApiRoutes.HOSTS}/networks/${networkId}`);
}

function updateHost(hostId: Host['id'], payload: Host) {
  return baseService.put<Host>(`${ApiRoutes.HOSTS}/${hostId}`, payload);
}

export const HostsService = {
  getHosts,
  deleteHost,
  createHostRelay,
  deleteHostRelay,
  updateHostsNetworks,
  updateHost,
};
