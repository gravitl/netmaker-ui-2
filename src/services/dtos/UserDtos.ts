import { UserGroup } from '@/models/User';

export interface CreateUserReqDto {
  username: string;
  password: string;
}

export interface UpdateUserReqDto {
  username: string;
  password: string;
}

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
  groups: UserGroup['id'][];
}

export interface UserInviteReqDto {
  username: string;
  password: string;
}
