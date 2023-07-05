import { ApiRoutes } from '@/constants/ApiRoutes';
import { ServerConfig, ServerStatus } from '@/models/ServerConfig';
import { baseService } from '@/services/BaseService';
import { ServerConfigService } from '@/services/ServerConfigService';
import MockAdapter from 'axios-mock-adapter';
import { version } from '../../../package.json';

describe('ServerConfigService', () => {
  const mock = new MockAdapter(baseService);

  afterEach(() => {
    mock.reset();
  });

  it('should successfully acquire server config', async () => {
    const mockRes: ServerConfig = {
      APIConnString: '',
      APIHost: '',
      APIPort: 0,
      AgentBackend: false,
      AllowedOrigin: '',
      ClientMode: false,
      CoreDNSAddr: '',
      DNSMode: false,
      Database: '',
      DefaultNodeLimit: 0,
      DisableDefaultNet: false,
      DisableRemoteIPCheck: false,
      GRPCConnString: '',
      GRPCHost: '',
      GRPCPort: 0,
      GRPCSSL: false,
      GRPCSecure: '',
      MasterKey: '',
      Platform: '',
      RestBackend: false,
      SQLConn: '',
      Verbosity: 0,
      Version: '',
      RCE: false,
      IsEE: 'no',
    };
    mock.onGet(ApiRoutes.SERVER_CONFIG).replyOnce(200, mockRes);

    const res = (await ServerConfigService.getServerConfig()).data;

    expect(res).toEqual(mockRes);
  });

  it('should throw when get server config', async () => {
    mock.onGet(ApiRoutes.SERVER_CONFIG).replyOnce(401);
    await expect(ServerConfigService.getServerConfig()).rejects.toThrow();
  });

  it('should successfully acquire server status', async () => {
    const mockRes: ServerStatus = {
      db_connected: false,
      broker_connected: false,
      healthyNetwork: false,
    };
    mock.onGet(ApiRoutes.SERVER_STATUS).replyOnce(200, mockRes);

    const res = (await ServerConfigService.getServerStatus()).data;

    expect(res).toEqual(mockRes);
  });

  it('should throw when get server status fails', async () => {
    mock.onGet(ApiRoutes.SERVER_CONFIG).replyOnce(500);
    await expect(ServerConfigService.getServerStatus()).rejects.toThrow();

    mock.onGet(ApiRoutes.SERVER_CONFIG).networkErrorOnce();
    await expect(ServerConfigService.getServerStatus()).rejects.toThrow();

    mock.onGet(ApiRoutes.SERVER_CONFIG).abortRequestOnce();
    await expect(ServerConfigService.getServerStatus()).rejects.toThrow();
  });

  it('should successfully acquire ui version', async () => {
    const uiVersion = version ? `v${version}` : 'latest';
    const res = await ServerConfigService.getUiVersion();

    expect(res).toEqual(uiVersion);
  });
});
