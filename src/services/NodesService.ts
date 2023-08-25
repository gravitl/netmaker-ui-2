import { ApiRoutes } from '../constants/ApiRoutes';
import { ExternalClient } from '../models/ExternalClient';
import { Network } from '../models/Network';
import { Node } from '../models/Node';
import { axiosService } from './BaseService';
import { CreateEgressNodeDto } from './dtos/CreateEgressNodeDto';
import { CreateExternalClientReqDto } from './dtos/CreateExternalClientReqDto';
import { CreateIngressNodeDto } from './dtos/CreateIngressNodeDto';
import { CreateNodeRelayDto } from './dtos/CreateNodeRelayDto';
import { GatewayUsersResDto } from './dtos/GatewayUsersResDto';
import { UpdateExternalClientDto } from './dtos/UpdateExternalClientDto';

function getNodes() {
  return axiosService.get<Node[]>(ApiRoutes.NODES);
}

function approveNode(nodeId: Node['id'], networkId: Network['netid']) {
  return axiosService.post<void>(`${ApiRoutes.NODES}/${networkId}/${nodeId}/approve`);
}

function createEgressNode(nodeId: Node['id'], networkId: Network['netid'], payload: CreateEgressNodeDto) {
  return axiosService.post<Node>(`${ApiRoutes.NODES}/${networkId}/${nodeId}/creategateway`, payload);
}

function createExternalClient(nodeId: Node['id'], networkId: Network['netid'], payload?: CreateExternalClientReqDto) {
  return axiosService.post<void>(`${ApiRoutes.EXTERNAL_CLIENTS}/${networkId}/${nodeId}`, payload);
}

function createIngressNode(nodeId: Node['id'], networkId: Network['netid'], payload: CreateIngressNodeDto) {
  return axiosService.post<void>(`${ApiRoutes.NODES}/${networkId}/${nodeId}/createingress`, payload);
}

function deleteEgressNode(nodeId: Node['id'], networkId: Network['netid']) {
  return axiosService.delete<Node>(`${ApiRoutes.NODES}/${networkId}/${nodeId}/deletegateway`);
}

function deleteExternalClient(extClientId: ExternalClient['clientid'], networkId: Network['netid']) {
  return axiosService.delete<void>(`${ApiRoutes.EXTERNAL_CLIENTS}/${networkId}/${extClientId}`);
}

function deleteIngressNode(nodeId: Node['id'], networkId: Network['netid']) {
  return axiosService.delete<Node>(`${ApiRoutes.NODES}/${networkId}/${nodeId}/deleteingress`);
}

function deleteNode(nodeId: Node['id'], networkId: Network['netid'], forceDelete = false) {
  return axiosService.delete<Node>(`${ApiRoutes.NODES}/${networkId}/${nodeId}?force=${forceDelete}`);
}

function getExternalClientConfig(
  extClientId: ExternalClient['clientid'],
  networkId: Network['netid'],
  type: 'qr' | 'file',
) {
  return axiosService.get<string | ArrayBuffer>(`${ApiRoutes.EXTERNAL_CLIENTS}/${networkId}/${extClientId}/${type}`, {
    responseType: type === 'qr' ? 'arraybuffer' : undefined,
  });
}

function getAllExternalClients() {
  return axiosService.get<ExternalClient[]>(`${ApiRoutes.EXTERNAL_CLIENTS}`);
}

function getNetworkExternalClients(network: Network['netid']) {
  return axiosService.get<ExternalClient[]>(`${ApiRoutes.EXTERNAL_CLIENTS}/${network}`);
}

function updateExternalClient(
  extClientId: ExternalClient['clientid'],
  networkId: Network['netid'],
  payload: UpdateExternalClientDto,
) {
  return axiosService.put<ExternalClient>(`${ApiRoutes.EXTERNAL_CLIENTS}/${networkId}/${extClientId}`, payload);
}

function updateNode(nodeId: ExternalClient['clientid'], networkId: Network['netid'], payload: Node) {
  return axiosService.put<Node>(`${ApiRoutes.NODES}/${networkId}/${nodeId}`, payload);
}

function createRelay(nodeId: Node['id'], networkId: Network['netid'], payload: CreateNodeRelayDto) {
  return axiosService.post<Node>(`${ApiRoutes.NODES}/${networkId}/${nodeId}/createrelay`, payload);
}

function deleteRelay(nodeId: Node['id'], networkId: Network['netid']) {
  return axiosService.delete<Node>(`${ApiRoutes.NODES}/${networkId}/${nodeId}/deleterelay`);
}

export const NodesService = {
  getNodes,
  approveNode,
  createEgressNode,
  createExternalClient,
  createIngressNode,
  deleteEgressNode,
  deleteExternalClient,
  deleteIngressNode,
  deleteNode,
  getExternalClientConfig,
  getAllExternalClients,
  getNetworkExternalClients,
  updateExternalClient,
  updateNode,
  createRelay,
  deleteRelay,
};
