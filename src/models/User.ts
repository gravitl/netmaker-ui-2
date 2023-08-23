interface RemoteGatewayIds {
  [key: string]: object;
}

export interface User {
  username: string;
  isadmin: boolean;
  // networks: null | Array<Network['netid']>;
  // groups: null | Array<UserGroup>;
  issuperadmin: boolean;
  remote_gw_ids: RemoteGatewayIds;
}
