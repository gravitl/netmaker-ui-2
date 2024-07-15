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

export type UserRole = 'super_admin' | 'admin' | 'user' | 'network_admin' | 'network_user' | string;

export type RsrcType =
  | 'hosts'
  | 'relays'
  | 'remote_access_gw'
  | 'extclients'
  | 'inet_gw'
  | 'egress'
  | 'networks'
  | 'enrollment_key'
  | 'users'
  | 'acl'
  | 'dns'
  | 'fail_over';

type RsrcID =
  | 'all_host'
  | 'all_relay'
  | 'all_remote_access_gw'
  | 'all_extclients'
  | 'all_inet_gw'
  | 'all_egress'
  | 'all_network'
  | 'all_enrollment_key'
  | 'all_user'
  | 'all_dns'
  | 'all_fail_over'
  | 'all_acls';

export interface RsrcPermissionScope {
  Read: 'read';
  Write: 'write';
  Execute: 'execute';
  None: 'none';
}

export interface UserRolePermissionTemplate {
  id: UserRole;
  default: boolean;
  denyDashboardAccess: boolean;
  fullAccess: boolean;
  networkID: string;
  networkLevelAccess: { [key in RsrcType]: { [key in RsrcID]: RsrcPermissionScope } };
  globalLevelAccess: { [key in RsrcType]: { [key in RsrcID]: RsrcPermissionScope } };
}
