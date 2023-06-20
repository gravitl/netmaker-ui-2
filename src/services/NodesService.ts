import { ApiRoutes } from '../constants/ApiRoutes';
import { ExternalClient } from '../models/ExternalClient';
import { Network } from '../models/Network';
import { Node } from '../models/Node';
import { baseService } from './BaseService';
import { CreateEgressNodeDto } from './dtos/CreateEgressNodeDto';
import { CreateExternalClientReqDto } from './dtos/CreateExternalClientReqDto';
import { CreateIngressNodeDto } from './dtos/CreateIngressNodeDto';
import { CreateNodeRelayDto } from './dtos/CreateNodeRelayDto';
import { UpdateExternalClientDto } from './dtos/UpdateExternalClientDto';

function getNodes() {
  return baseService.get<Node[]>(ApiRoutes.NODES);
}

function approveNode(nodeId: Node['id'], networkId: Network['netid']) {
  return baseService.post<void>(`${ApiRoutes.NODES}/${networkId}/${nodeId}/approve`);
}

function createEgressNode(nodeId: Node['id'], networkId: Network['netid'], payload: CreateEgressNodeDto) {
  return baseService.post<Node>(`${ApiRoutes.NODES}/${networkId}/${nodeId}/creategateway`, payload);
}

function createExternalClient(nodeId: Node['id'], networkId: Network['netid'], payload?: CreateExternalClientReqDto) {
  return baseService.post<void>(`${ApiRoutes.EXTERNAL_CLIENTS}/${networkId}/${nodeId}`, payload);
}

function createIngressNode(nodeId: Node['id'], networkId: Network['netid'], payload: CreateIngressNodeDto) {
  return baseService.post<void>(`${ApiRoutes.NODES}/${networkId}/${nodeId}/createingress`, payload);
}

function deleteEgressNode(nodeId: Node['id'], networkId: Network['netid']) {
  return baseService.delete<Node>(`${ApiRoutes.NODES}/${networkId}/${nodeId}/deletegateway`);
}

function deleteExternalClient(extClientId: ExternalClient['clientid'], networkId: Network['netid']) {
  return baseService.delete<void>(`${ApiRoutes.EXTERNAL_CLIENTS}/${networkId}/${extClientId}`);
}

function deleteIngressNode(nodeId: Node['id'], networkId: Network['netid']) {
  return baseService.delete<Node>(`${ApiRoutes.NODES}/${networkId}/${nodeId}/deleteingress`);
}

function deleteNode(nodeId: Node['id'], networkId: Network['netid']) {
  return baseService.delete<Node>(`${ApiRoutes.NODES}/${networkId}/${nodeId}`);
}

function getExternalClientConfig(
  extClientId: ExternalClient['clientid'],
  networkId: Network['netid'],
  type: 'qr' | 'file'
) {
  return baseService.get<string | ArrayBuffer>(`${ApiRoutes.EXTERNAL_CLIENTS}/${networkId}/${extClientId}/${type}`, {
    responseType: type === 'qr' ? 'arraybuffer' : undefined,
  });
}

function getExternalClients() {
  return baseService.get<ExternalClient[]>(`${ApiRoutes.EXTERNAL_CLIENTS}`);
}

function updateExternalClient(
  extClientId: ExternalClient['clientid'],
  networkId: Network['netid'],
  payload: UpdateExternalClientDto
) {
  return baseService.put<ExternalClient>(`${ApiRoutes.EXTERNAL_CLIENTS}/${networkId}/${extClientId}`, payload);
}

function updateNode(nodeId: ExternalClient['clientid'], networkId: Network['netid'], payload: Node) {
  return baseService.put<Node>(`${ApiRoutes.NODES}/${networkId}/${nodeId}`, payload);
}

function createRelay(nodeId: Node['id'], networkId: Network['netid'], payload: CreateNodeRelayDto) {
  return baseService.post<Node>(`${ApiRoutes.NODES}/${networkId}/${nodeId}/createrelay`, payload);
}

function deleteRelay(nodeId: Node['id'], networkId: Network['netid']) {
  return baseService.delete<Node>(`${ApiRoutes.NODES}/${networkId}/${nodeId}/deleterelay`);
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
  getExternalClients,
  updateExternalClient,
  updateNode,
  createRelay,
  deleteRelay,
};
