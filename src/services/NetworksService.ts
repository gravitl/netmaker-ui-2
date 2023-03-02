import { ApiRoutes } from '../constants/ApiRoutes';
import { AccessKey } from '../models/AccessKey';
import { DNS } from '../models/Dns';
import { Network } from '../models/Network';
import { baseService } from './BaseService';
import { CreateAccessKeyDto } from './dtos/CreateAccessKeyDto';
import { CreateNetworkDto } from './dtos/CreateNetworkDto';

export function getNetworks() {
  return baseService.get<Network[]>(`${ApiRoutes.NETWORKS}`);
}

export function createNetwork(payload: CreateNetworkDto) {
  return baseService.post<Network>(`${ApiRoutes.NETWORKS}`, payload);
}

export function deleteNetwork(networkId: Network['netid']) {
  return baseService.delete<void>(`${ApiRoutes.NETWORKS}/${networkId}`);
}

export function createAccessKey(networkId: Network['netid'], payload: CreateAccessKeyDto) {
  return baseService.post<AccessKey>(`${ApiRoutes.NETWORKS}/${networkId}/keys`, payload);
}

export function getAccessKeys(networkId: Network['netid']) {
  return baseService.get<AccessKey[]>(`${ApiRoutes.NETWORKS}/${networkId}/keys`);
}

export function deleteAccessKey(networkId: Network['netid'], accessKeyName: AccessKey['name']) {
  return baseService.delete<void>(`${ApiRoutes.NETWORKS}/${networkId}/keys/${accessKeyName}`);
}

export function createDns(networkId: Network['netid'], payload: DNS) {
  return baseService.post<DNS>(`${ApiRoutes.DNS}/${networkId}`, payload);
}

export function getDns() {
  return baseService.get<DNS[]>(`${ApiRoutes.DNS}`);
}

export function deleteDns(networkId: Network['netid'], dnsName: DNS['name']) {
  return baseService.delete<void>(`${ApiRoutes.DNS}/${networkId}/${dnsName}`);
}
