import { Network } from './Network';
import { Node } from './Node';

interface RemoteGatewayIds {
  [key: Node['id']]: object;
}

export interface User {
  username: string;
  isadmin: boolean;
  issuperadmin: boolean;
  remote_gw_ids: RemoteGatewayIds | null;
  user_group_ids: Record<UserGroup['id'], object>;
  platform_role_id: UserRoleId;
  network_roles: Record<Network['netid'], Record<UserRoleId, object>>;
  auth_type: 'basic_auth' | 'oauth';
}

export type UserRoleId = 'super-admin' | 'admin' | 'user' | 'network-admin' | 'network-user' | string;

export type UserRoleType = 'network-role' | 'platform-role';

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
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
  vpn_access: boolean;
  self_only: boolean;
}

export type RsrcTypeValue = {
  [key in RsrcID]?: RsrcPermissionScope;
};

export interface UserRole {
  id: UserRoleId;
  ui_name: string;
  default: boolean;
  deny_dashboard_access: boolean;
  full_access: boolean;
  network_id: Network['netid'];
  network_level_access: { [key in RsrcType]?: RsrcTypeValue | { [key: string]: RsrcPermissionScope } } | null;
  global_level_access: { [key in RsrcType]?: RsrcTypeValue } | null;
}

export interface UserGroup {
  id: string;
  platform_role: UserRoleId;
  network_roles: { [network in Network['netid']]: { [role in UserRoleId]: object } };
  meta_data: string;
}

export interface UserInvite {
  email: string;
  user_group_ids: Record<UserGroup['id'], object>;
  invite_code: string;
  platform_role_id: UserRoleId;
  invite_url: string;
}
