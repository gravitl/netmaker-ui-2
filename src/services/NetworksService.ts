import { NodeAclContainer } from '@/models/Acl';
import { ApiRoutes } from '../constants/ApiRoutes';
import { AccessKey } from '../models/AccessKey';
import { DNS } from '../models/Dns';
import { Network, NetworkPayload } from '../models/Network';
import { axiosService } from './BaseService';
import { CreateAccessKeyDto } from './dtos/CreateAccessKeyDto';
import { CreateNetworkDto } from './dtos/CreateNetworkDto';
import { NetworkMetrics, NodeOrClientMetric } from '@/models/Metrics';
import { ExternalClient } from '@/models/ExternalClient';

function getNetworks() {
  return axiosService.get<NetworkPayload[]>(`${ApiRoutes.NETWORKS}`);
}

function createNetwork(payload: CreateNetworkDto) {
  return axiosService.post<NetworkPayload>(`${ApiRoutes.NETWORKS}`, payload);
}

function updateNetwork(networkId: Network['netid'], payload: NetworkPayload) {
  return axiosService.put<NetworkPayload>(`${ApiRoutes.NETWORKS}/${networkId}`, payload);
}

function deleteNetwork(networkId: Network['netid']) {
  return axiosService.delete<void>(`${ApiRoutes.NETWORKS}/${networkId}`);
}

function createAccessKey(networkId: Network['netid'], payload: CreateAccessKeyDto) {
  return axiosService.post<AccessKey>(`${ApiRoutes.NETWORKS}/${networkId}/keys`, payload);
}

function getAccessKeys(networkId: Network['netid']) {
  return axiosService.get<AccessKey[]>(`${ApiRoutes.NETWORKS}/${networkId}/keys`);
}

function deleteAccessKey(networkId: Network['netid'], accessKeyName: AccessKey['name']) {
  return axiosService.delete<void>(`${ApiRoutes.NETWORKS}/${networkId}/keys/${accessKeyName}`);
}

function createDns(networkId: Network['netid'], payload: DNS) {
  return axiosService.post<DNS>(`${ApiRoutes.DNS}/${networkId}`, payload);
}

function getDnses() {
  return axiosService.get<DNS[]>(`${ApiRoutes.DNS}`);
}

function deleteDns(networkId: Network['netid'], dnsName: DNS['name']) {
  return axiosService.delete<void>(`${ApiRoutes.DNS}/${networkId}/${dnsName}`);
}

function getAcls(networkId: Network['netid']) {
  return axiosService.get<NodeAclContainer>(`${ApiRoutes.NETWORKS}/${networkId}/acls`);
}

function updateAcls(networkId: Network['netid'], payload: NodeAclContainer) {
  return axiosService.put<NodeAclContainer>(`${ApiRoutes.NETWORKS}/${networkId}/acls`, payload);
}

function getNodeMetrics(networkId: Network['netid']) {
  return axiosService.get<NetworkMetrics>(`${ApiRoutes.METRICS}/${networkId}`);
}

function getClientMetrics(networkId: Network['netid']) {
  return axiosService.get<Record<ExternalClient['clientid'], NodeOrClientMetric>>(
    `${ApiRoutes.METRICS_EXTERNAL_CLIENT}/${networkId}`,
  );
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
