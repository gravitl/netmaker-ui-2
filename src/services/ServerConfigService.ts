import { ApiRoutes } from '@/constants/ApiRoutes';
import { ServerConfig, ServerStatus } from '@/models/ServerConfig';
import { baseService } from './BaseService';

function getServerConfig() {
  return baseService.get<ServerConfig>(ApiRoutes.SERVER_CONFIG);
}

function getServerStatus() {
  return baseService.get<ServerStatus>(ApiRoutes.SERVER_STATUS);
}

export const ServerConfigService = {
  getServerConfig,
  getServerStatus,
};
