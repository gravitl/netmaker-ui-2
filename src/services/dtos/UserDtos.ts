import { Network } from '@/models/Network';
import { User, UserGroup, UserRoleId } from '@/models/User';

export interface CreateUserReqDto {
  username: string;
  password: string;
}

export type UpdateUserReqDto = Partial<User>;

export interface ExtraUserInfoForm {
  first_name: string;
  last_name: string;
  company_name: string;
  company_size_reported: string;
  primary_role: string;
  machine_estimate: string;
  primary_use_case: string;
  infrastructure_group: string;
  user_id?: string;
}

export interface CreateUserInviteReqDto {
  user_emails: string[];
  user_group_ids: UserGroup['id'][];
  platform_role_id: UserRoleId;
  network_roles: Record<Network['netid'], Record<UserRoleId, object>>;
}

export interface UserInviteReqDto {
  username: string;
  password: string;
}

export interface CreateUserGroupReqDto {
  user_group: Partial<UserGroup>;
  members: string[];
}
