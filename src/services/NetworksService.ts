import { NodeAclContainer } from '@/models/Acl';
import { ApiRoutes } from '../constants/ApiRoutes';
import { AccessKey } from '../models/AccessKey';
import { DNS } from '../models/Dns';
import { Network, NetworkPayload } from '../models/Network';
import { baseService } from './BaseService';
import { CreateAccessKeyDto } from './dtos/CreateAccessKeyDto';
import { CreateNetworkDto } from './dtos/CreateNetworkDto';
import { NetworkMetrics } from '@/models/Metrics';

function getNetworks() {
  return baseService.get<NetworkPayload[]>(`${ApiRoutes.NETWORKS}`);
}

function createNetwork(payload: CreateNetworkDto) {
  return baseService.post<NetworkPayload>(`${ApiRoutes.NETWORKS}`, payload);
}

function updateNetwork(networkId: Network['netid'], payload: NetworkPayload) {
  return baseService.put<NetworkPayload>(`${ApiRoutes.NETWORKS}/${networkId}`, payload);
}

function deleteNetwork(networkId: Network['netid']) {
  return baseService.delete<void>(`${ApiRoutes.NETWORKS}/${networkId}`);
}

function createAccessKey(networkId: Network['netid'], payload: CreateAccessKeyDto) {
  return baseService.post<AccessKey>(`${ApiRoutes.NETWORKS}/${networkId}/keys`, payload);
}

function getAccessKeys(networkId: Network['netid']) {
  return baseService.get<AccessKey[]>(`${ApiRoutes.NETWORKS}/${networkId}/keys`);
}

function deleteAccessKey(networkId: Network['netid'], accessKeyName: AccessKey['name']) {
  return baseService.delete<void>(`${ApiRoutes.NETWORKS}/${networkId}/keys/${accessKeyName}`);
}

function createDns(networkId: Network['netid'], payload: DNS) {
  return baseService.post<DNS>(`${ApiRoutes.DNS}/${networkId}`, payload);
}

function getDnses() {
  return baseService.get<DNS[]>(`${ApiRoutes.DNS}`);
}

function deleteDns(networkId: Network['netid'], dnsName: DNS['name']) {
  return baseService.delete<void>(`${ApiRoutes.DNS}/${networkId}/${dnsName}`);
}

function getAcls(networkId: Network['netid']) {
  return baseService.get<NodeAclContainer>(`${ApiRoutes.NETWORKS}/${networkId}/acls`);
}

function updateAcls(networkId: Network['netid'], payload: NodeAclContainer) {
  return baseService.put<NodeAclContainer>(`${ApiRoutes.NETWORKS}/${networkId}/acls`, payload);
}

function getNodeMetrics(networkId: Network['netid']) {
  return baseService.get<NetworkMetrics>(`${ApiRoutes.METRICS}/${networkId}`);
}

function getClientMetrics(networkId: Network['netid']) {
  return baseService.get<NetworkMetrics>(`${ApiRoutes.METRICS_EXTERNAL_CLIENT}/${networkId}`);
}

export const NetworksService = {
  getNetworks,
  createNetwork,
  updateNetwork,
  deleteNetwork,
  createAccessKey,
  getAccessKeys,
  deleteAccessKey,
  createDns,
  getDnses,
  deleteDns,
  getAcls,
  updateAcls,
  getNodeMetrics,
  getClientMetrics,
};
