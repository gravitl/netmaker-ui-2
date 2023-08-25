import { Node } from './Node';

interface RemoteGatewayIds {
  [key: Node['id']]: object;
}

export interface User {
  username: string;
  isadmin: boolean;
  issuperadmin: boolean;
  remote_gw_ids: RemoteGatewayIds | null;
}
