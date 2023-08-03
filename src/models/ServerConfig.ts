export interface ServerConfig {
  APIConnString: string; //""
  APIHost: string; // "hakeee.duckdns.org"
  APIPort: number; // "8081"
  AgentBackend: boolean; // "on"
  AllowedOrigin: string; // "*"
  ClientMode: boolean; // "on"
  CoreDNSAddr: string; // "89.177.140.210"
  DNSMode: boolean; // "off"
  Database: string; // "sqlite"
  DefaultNodeLimit: number; // 0
  DisableDefaultNet: boolean; // "off"
  DisableRemoteIPCheck: boolean; // "off"
  GRPCConnString: string; // ""
  GRPCHost: string; // "hakeee.duckdns.org"
  GRPCPort: number; // "50051"
  GRPCSSL: boolean; // "off"
  GRPCSecure: string; // ""
  MasterKey: string; // "(hidden)"
  Platform: string; // "linux"
  RestBackend: boolean; // "on"
  SQLConn: string; // ""
  Verbosity: number; // 0
  Version: string; // "v0.7.3"
  RCE: boolean; // "on"
  IsEE: 'yes' | 'no'; // yes or no
}

export interface TenantConfig {
  baseUrl: string;
  jwt?: string;
  email?: string;
  username?: string;
  tenantId?: string;
  tenantName?: string;
  amuiAuthToken?: string;
}

export interface ServerStatus {
  db_connected: boolean;
  broker_connected: boolean;
  healthyNetwork: boolean;
  license_error: string;
}
