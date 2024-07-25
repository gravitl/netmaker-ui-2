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
  return axiosService.put<NetworkPayload>(`${ApiRoutes.NETWORKS}/${encodeURIComponent(networkId)}`, payload);
}

function deleteNetwork(networkId: Network['netid']) {
  return axiosService.delete<void>(`${ApiRoutes.NETWORKS}/${encodeURIComponent(networkId)}`);
}

function createAccessKey(networkId: Network['netid'], payload: CreateAccessKeyDto) {
  return axiosService.post<AccessKey>(`${ApiRoutes.NETWORKS}/${encodeURIComponent(networkId)}/keys`, payload);
}

function getAccessKeys(networkId: Network['netid']) {
  return axiosService.get<AccessKey[]>(`${ApiRoutes.NETWORKS}/${encodeURIComponent(networkId)}/keys`);
}

function deleteAccessKey(networkId: Network['netid'], accessKeyName: AccessKey['name']) {
  return axiosService.delete<void>(
    `${ApiRoutes.NETWORKS}/${encodeURIComponent(networkId)}/keys/${encodeURIComponent(accessKeyName)}`,
  );
}

function createDns(networkId: Network['netid'], payload: DNS) {
  return axiosService.post<DNS>(`${ApiRoutes.DNS}/${encodeURIComponent(networkId)}`, payload);
}

function getDnses() {
  return axiosService.get<DNS[]>(`${ApiRoutes.DNS}`);
}

function getDnsesPerNetwork(network: Network['netid']) {
  return axiosService.get<DNS[]>(`${ApiRoutes.DNS_ADMIN}/${encodeURIComponent(network)}`);
}

function deleteDns(networkId: Network['netid'], dnsName: DNS['name']) {
  return axiosService.delete<void>(`${ApiRoutes.DNS}/${encodeURIComponent(networkId)}/${encodeURIComponent(dnsName)}`);
}

function getAcls(networkId: Network['netid']) {
  return axiosService.get<NodeAclContainer>(`${ApiRoutes.NETWORKS}/${encodeURIComponent(networkId)}/acls`);
}

function updateAcls(networkId: Network['netid'], payload: NodeAclContainer) {
  return axiosService.put<NodeAclContainer>(`${ApiRoutes.NETWORKS}/${encodeURIComponent(networkId)}/acls`, payload);
}

function updateAclsV2(networkId: Network['netid'], payload: NodeAclContainer) {
  return axiosService.put<NodeAclContainer>(`${ApiRoutes.NETWORKS}/${encodeURIComponent(networkId)}/acls/v2`, payload);
}

function getNodeMetrics(networkId: Network['netid']) {
  return axiosService.get<NetworkMetrics>(`${ApiRoutes.METRICS}/${encodeURIComponent(networkId)}`);
}

function getClientMetrics(networkId: Network['netid']) {
  return axiosService.get<Record<ExternalClient['clientid'], NodeOrClientMetric>>(
    `${ApiRoutes.METRICS_EXTERNAL_CLIENT}/${encodeURIComponent(networkId)}`,
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
  getDnsesPerNetwork,
  deleteDns,
  getAcls,
  updateAcls,
  getNodeMetrics,
  getClientMetrics,
  updateAclsV2,
};
