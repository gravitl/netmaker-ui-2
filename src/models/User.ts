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

export interface NewUser {
  username: string;
  groups: string[];
  platformRole: UserRole;
  networkRoles: UserRole[];
}

export interface UserRole {
  id: string;
  name: string;
  type: 'platform' | 'network';
  permissions?: string[];
}

export interface UserGroup {
  id: string;
  name: string;
  networkRoles: UserRole[];
  members: User['username'][];
}
