import { ApiRoutes } from '../constants/ApiRoutes';
import { ExternalClient } from '../models/ExternalClient';
import { Network } from '../models/Network';
import { Node } from '../models/Node';
import { axiosService } from './BaseService';
import { CreateEgressNodeDto } from './dtos/CreateEgressNodeDto';
import { CreateExternalClientReqDto } from './dtos/CreateExternalClientReqDto';
import { CreateIngressNodeDto } from './dtos/CreateIngressNodeDto';
import { CreateNodeRelayDto } from './dtos/CreateNodeRelayDto';
import { CreateInternetGatewayDto, UpdateInternetGatewayDto } from './dtos/InternetGatewayDto';
import { UpdateExternalClientDto } from './dtos/UpdateExternalClientDto';

function getNodes() {
  return axiosService.get<Node[]>(ApiRoutes.NODES);
}

function getNetworkNodes(network: Network['netid']) {
  return axiosService.get<Node[]>(`${ApiRoutes.NODES}/${encodeURIComponent(network)}`);
}

function approveNode(nodeId: Node['id'], networkId: Network['netid']) {
  return axiosService.post<void>(
    `${ApiRoutes.NODES}/${encodeURIComponent(networkId)}/${encodeURIComponent(nodeId)}/approve`,
  );
}

function createEgressNode(nodeId: Node['id'], networkId: Network['netid'], payload: CreateEgressNodeDto) {
  return axiosService.post<Node>(
    `${ApiRoutes.NODES}/${encodeURIComponent(networkId)}/${encodeURIComponent(nodeId)}/creategateway`,
    payload,
  );
}

function createExternalClient(nodeId: Node['id'], networkId: Network['netid'], payload?: CreateExternalClientReqDto) {
  return axiosService.post<void>(
    `${ApiRoutes.EXTERNAL_CLIENTS}/${encodeURIComponent(networkId)}/${encodeURIComponent(nodeId)}`,
    payload,
  );
}

function createIngressNode(nodeId: Node['id'], networkId: Network['netid'], payload: CreateIngressNodeDto) {
  return axiosService.post<Node>(
    `${ApiRoutes.NODES}/${encodeURIComponent(networkId)}/${encodeURIComponent(nodeId)}/createingress`,
    payload,
  );
}

function deleteEgressNode(nodeId: Node['id'], networkId: Network['netid']) {
  return axiosService.delete<Node>(
    `${ApiRoutes.NODES}/${encodeURIComponent(networkId)}/${encodeURIComponent(nodeId)}/deletegateway`,
  );
}

function deleteExternalClient(extClientId: ExternalClient['clientid'], networkId: Network['netid']) {
  return axiosService.delete<void>(
    `${ApiRoutes.EXTERNAL_CLIENTS}/${encodeURIComponent(networkId)}/${encodeURIComponent(extClientId)}`,
  );
}

function deleteIngressNode(nodeId: Node['id'], networkId: Network['netid']) {
  return axiosService.delete<Node>(
    `${ApiRoutes.NODES}/${encodeURIComponent(networkId)}/${encodeURIComponent(nodeId)}/deleteingress`,
  );
}

function deleteNode(nodeId: Node['id'], networkId: Network['netid'], forceDelete = false) {
  return axiosService.delete<Node>(
    `${ApiRoutes.NODES}/${encodeURIComponent(networkId)}/${encodeURIComponent(nodeId)}?force=${forceDelete}`,
  );
}

function getExternalClientConfig(
  extClientId: ExternalClient['clientid'],
  networkId: Network['netid'],
  type: 'qr' | 'file',
  preferredEndpoint?: string,
) {
  return axiosService.get<string | ArrayBuffer>(
    `${ApiRoutes.EXTERNAL_CLIENTS}/${encodeURIComponent(networkId)}/${encodeURIComponent(
      extClientId,
    )}/${encodeURIComponent(type)}`,
    {
      responseType: type === 'qr' ? 'arraybuffer' : undefined,
      params: {
        preferredip: preferredEndpoint,
      },
    },
  );
}

function getAllExternalClients() {
  return axiosService.get<ExternalClient[]>(`${ApiRoutes.EXTERNAL_CLIENTS}`);
}

function getNetworkExternalClients(network: Network['netid']) {
  return axiosService.get<ExternalClient[]>(`${ApiRoutes.EXTERNAL_CLIENTS}/${encodeURIComponent(network)}`);
}

function updateExternalClient(
  extClientId: ExternalClient['clientid'],
  networkId: Network['netid'],
  payload: UpdateExternalClientDto,
) {
  return axiosService.put<ExternalClient>(
    `${ApiRoutes.EXTERNAL_CLIENTS}/${encodeURIComponent(networkId)}/${encodeURIComponent(extClientId)}`,
    payload,
  );
}

function updateNode(nodeId: ExternalClient['clientid'], networkId: Network['netid'], payload: Node) {
  return axiosService.put<Node>(
    `${ApiRoutes.NODES}/${encodeURIComponent(networkId)}/${encodeURIComponent(nodeId)}`,
    payload,
  );
}

function createRelay(nodeId: Node['id'], networkId: Network['netid'], payload: CreateNodeRelayDto) {
  return axiosService.post<Node>(
    `${ApiRoutes.NODES}/${encodeURIComponent(networkId)}/${encodeURIComponent(nodeId)}/createrelay`,
    payload,
  );
}

function deleteRelay(nodeId: Node['id'], networkId: Network['netid']) {
  return axiosService.delete<Node>(
    `${ApiRoutes.NODES}/${encodeURIComponent(networkId)}/${encodeURIComponent(nodeId)}/deleterelay`,
  );
}

function setNodeAsFailover(nodeId: Node['id']) {
  return axiosService.post<Node>(`${ApiRoutes.NODE}/${encodeURIComponent(nodeId)}/failover`);
}

function removeNodeFailoverStatus(nodeId: Node['id']) {
  return axiosService.delete<Node>(`${ApiRoutes.NODE}/${encodeURIComponent(nodeId)}/failover`);
}

function createInternetGateway(nodeId: Node['id'], networkId: Network['netid'], payload: CreateInternetGatewayDto) {
  return axiosService.post<Node>(
    `${ApiRoutes.NODES}/${encodeURIComponent(networkId)}/${encodeURIComponent(nodeId)}/inet_gw`,
    payload,
  );
}

function updateInternetGateway(nodeId: Node['id'], networkId: Network['netid'], payload: UpdateInternetGatewayDto) {
  return axiosService.put<Node>(
    `${ApiRoutes.NODES}/${encodeURIComponent(networkId)}/${encodeURIComponent(nodeId)}/inet_gw`,
    payload,
  );
}

function deleteInternetGateway(nodeId: Node['id'], networkId: Network['netid']) {
  return axiosService.delete<Node>(
    `${ApiRoutes.NODES}/${encodeURIComponent(networkId)}/${encodeURIComponent(nodeId)}/inet_gw`,
  );
}

export const NodesService = {
  getNodes,
  getNetworkNodes,
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
  setNodeAsFailover,
  removeNodeFailoverStatus,
  createInternetGateway,
  updateInternetGateway,
  deleteInternetGateway,
};
