import { ApiRoutes } from '@/constants/ApiRoutes';
import { ServerConfig, ServerStatus } from '@/models/ServerConfig';
import { axiosService } from './BaseService';
import { version as uiVersion } from '../../package.json';

function getServerConfig() {
  return axiosService.get<ServerConfig>(ApiRoutes.SERVER_CONFIG);
}

function getServerStatus() {
  return axiosService.get<ServerStatus>(ApiRoutes.SERVER_STATUS);
}

function getUiVersion(): string {
  if (!uiVersion) {
    return 'latest';
  }
  if (uiVersion.charAt(0) === 'v' || uiVersion.charAt(0) === 'V') {
    return uiVersion;
  }
  return `v${uiVersion}`;
}

export const ServerConfigService = {
  getServerConfig,
  getServerStatus,
  getUiVersion,
};
