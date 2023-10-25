export interface ServerConfig {
  AllowedOrigin: string;
  APIConnString: string;
  APIHost: string;
  APIPort: string;
  Broker: string;
  ClientID: string;
  ClientSecret: string;
  CoreDNSAddr: string;
  Database: string;
  DeployedByOperator: boolean;
  DisableRemoteIPCheck: string;
  DisplayKeys: string;
  DNSKey: string;
  DNSMode: string;
  EmqxRestEndpoint: string;
  FrontendURL: string;
  HostNetwork: string;
  IsEE: string;
  LicenseValue: string;
  MasterKey: string;
  MetricsExporter: string;
  MQPassword: string;
  MQUserName: string;
  NetclientAutoUpdate: string;
  NetclientEndpointDetection: string;
  NetmakerTenantID: string;
  NodeID: string;
  OIDCIssuer: string;
  Platform: string;
  PublicIPService: string;
  RestBackend: string;
  Server: string;
  ServerBrokerEndpoint: string;
  SQLConn: string;
  StunList: string;
  StunPort: number;
  Telemetry: string;
  TurnApiServer: string;
  TurnPassword: string;
  TurnPort: number;
  TurnServer: string;
  TurnUserName: string;
  UseTurn: boolean;
  UsersLimit: number;
  Verbosity: number;
  Version: string;
}

export interface TenantConfig {
  baseUrl: string;
  jwt?: string;
  email?: string;
  username?: string;
  tenantId?: string;
  tenantName?: string;
  amuiAuthToken?: string;
  amuiUserId?: string;
}

export interface ServerStatus {
  db_connected: boolean;
  broker_connected: boolean;
  healthyNetwork: boolean;
  license_error: string;
  is_pro: boolean;
}

export type IntercomTiers = 'paid_tier' | 'free_tier';
