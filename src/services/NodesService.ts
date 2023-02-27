import { ApiRoutes } from '../constants/ApiRoutes';
import { ExternalClient } from '../models/ExternalClient';
import { Network } from '../models/Network';
import { Node } from '../models/Node';
import { baseService } from './BaseService';
import { CreateEgressNodeDto } from './dtos/CreateEgressNodeDto';
import { CreateIngressNodeDto } from './dtos/CreateIngressNodeDto';
import { UpdateExternalClientDto } from './dtos/UpdateExternalClientDto';

export function getNodes() {
  return baseService.get<Node[]>(ApiRoutes.NODES);
}

export function approveNode(nodeId: Node['id'], networkId: Network['netid']) {
  return baseService.post<void>(`${ApiRoutes.NODES}/${networkId}/${nodeId}/approve`);
}

export function createEgressNode(nodeId: Node['id'], networkId: Network['netid'], payload: CreateEgressNodeDto) {
  return baseService.post<Node>(`${ApiRoutes.NODES}/${networkId}/${nodeId}/creategateway`, payload);
}

export function createExternalClient(nodeId: Node['id'], networkId: Network['netid']) {
  return baseService.post<void>(`${ApiRoutes.EXTERNAL_CLIENTS}/${networkId}/${nodeId}`);
}

export function createIngressNode(nodeId: Node['id'], networkId: Network['netid'], payload: CreateIngressNodeDto) {
  return baseService.post<void>(`${ApiRoutes.NODES}/${networkId}/${nodeId}/createingress`, payload);
}

export function deleteEgressNode(nodeId: Node['id'], networkId: Network['netid']) {
  return baseService.delete<Node>(`${ApiRoutes.NODES}/${networkId}/${nodeId}/deletegateway`);
}

export function deleteExternalClient(extClientId: ExternalClient['clientid'], networkId: Network['netid']) {
  return baseService.delete<void>(`${ApiRoutes.EXTERNAL_CLIENTS}/${networkId}/${extClientId}`);
}

export function deleteIngressNode(nodeId: Node['id'], networkId: Network['netid']) {
  return baseService.delete<Node>(`${ApiRoutes.NODES}/${networkId}/${nodeId}/deleteingress`);
}

export function deleteNode(nodeId: Node['id'], networkId: Network['netid']) {
  return baseService.delete<Node>(`${ApiRoutes.NODES}/${networkId}/${nodeId}`);
}

export function getExternalClientConfig(
  extClientId: ExternalClient['clientid'],
  networkId: Network['netid'],
  type: 'qr' | 'file'
) {
  return baseService.get<string>(`${ApiRoutes.EXTERNAL_CLIENTS}/${networkId}/${extClientId}/${type}`);
}

export function getExternalClients() {
  return baseService.get<ExternalClient[]>(`${ApiRoutes.EXTERNAL_CLIENTS}`);
}

export function updateExternalClient(
  extClientId: ExternalClient['clientid'],
  networkId: Network['netid'],
  payload: UpdateExternalClientDto
) {
  return baseService.put<ExternalClient>(`${ApiRoutes.EXTERNAL_CLIENTS}/${networkId}/${extClientId}`, payload);
}

export function updateNode(nodeId: ExternalClient['clientid'], networkId: Network['netid'], payload: Node) {
  return baseService.put<Node>(`${ApiRoutes.NODES}/${networkId}/${nodeId}`, payload);
}
