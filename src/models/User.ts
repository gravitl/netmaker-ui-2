interface RemoteGatewayIds {
  [key: string]: object;
}

export interface User {
  username: string;
  isadmin: boolean;
  issuperadmin: boolean;
  remote_gw_ids: RemoteGatewayIds | null;
}
