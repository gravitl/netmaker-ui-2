import { ApiRoutes } from '@/constants/ApiRoutes';
import { axiosService } from './BaseService';
import { User, UserInvite, UserRole, UserRoleType } from '@/models/User';
import { CreateUserGroupReqDto, CreateUserInviteReqDto, UpdateUserReqDto, UserInviteReqDto } from './dtos/UserDtos';
import { UserGroup } from '@/models/User';
import { CreateUserReqDto } from './dtos/UserDtos';
import { Node } from '@/models/Node';
import { GatewayUsersResDto } from './dtos/GatewayUsersResDto';
import { GenericResponseDto } from './dtos/GenericDto';

function getUsers() {
  return axiosService.get<User[]>(ApiRoutes.USERS);
}

function getUser(username: User['username']) {
  return axiosService.get<GenericResponseDto<User & { platform_role: UserRole }>>(
    `${ApiRoutes.USERS_V1}?username=${encodeURIComponent(username)}`,
  );
}

function serverHasAdmin() {
  return axiosService.get<boolean>(`${ApiRoutes.USERS_ADMIN}/hassuperadmin`);
}

function createAdminUser(payload: CreateUserReqDto) {
  return axiosService.post<User>(`${ApiRoutes.USERS_ADMIN}/createsuperadmin`, payload);
}

function createUser(payload: User) {
  return axiosService.post<User>(`${ApiRoutes.USERS}/${encodeURIComponent(payload.username)}`, payload);
}

function updateUser(username: User['username'], payload: UpdateUserReqDto) {
  return axiosService.put<User>(`${ApiRoutes.USERS}/${encodeURIComponent(username)}`, payload);
}

function updateUserDetails(username: User['username'], payload: User) {
  return axiosService.put<User>(`${ApiRoutes.USERS}/networks/${encodeURIComponent(username)}`, payload);
}

function updateAdminUser(username: User['username'], payload: User) {
  return axiosService.put<User>(`${ApiRoutes.USERS}/${encodeURIComponent(username)}/adm`, payload);
}

function deleteUser(username: User['username']) {
  return axiosService.delete<void>(`${ApiRoutes.USERS}/${encodeURIComponent(username)}`);
}

// function createUserGroup(userGroupName: UserGroup) {
//   return axiosService.post<void>(`${ApiRoutes.USER_GROUPS}/${encodeURIComponent(userGroupName)}`);
// }

// function getUserGroups(): Promise<UserGroup[]> {
//   return axiosService
//     .get<Record<UserGroup, never>>(`${ApiRoutes.USER_GROUPS}`)
//     .then((userGroups) => Object.keys(userGroups.data));
// }

// function deleteUserGroup(userGroupName: UserGroup) {
//   return axiosService.delete<void>(`${ApiRoutes.USER_GROUPS}/${encodeURIComponent(userGroupName)}`);
// }

function attachUserToIngress(username: User['username'], ingressId: Node['id']) {
  return axiosService.post<void>(
    `${ApiRoutes.USERS}/${encodeURIComponent(username)}/remote_access_gw/${encodeURIComponent(ingressId)}`,
  );
}

function removeUserFromIngress(username: User['username'], ingressId: Node['id']) {
  return axiosService.delete<void>(
    `${ApiRoutes.USERS}/${encodeURIComponent(username)}/remote_access_gw/${encodeURIComponent(ingressId)}`,
  );
}

function transferSuperAdminRights(username: User['username']) {
  return axiosService.post<void>(`${ApiRoutes.USERS_ADMIN}/transfersuperadmin/${encodeURIComponent(username)}`);
}

function getIngressUsers(nodeId: Node['id']) {
  return axiosService.get<GatewayUsersResDto>(`${ApiRoutes.USERS}/ingress/${encodeURIComponent(nodeId)}`);
}

function getPendingUsers() {
  return axiosService.get<User[]>(`${ApiRoutes.PENDING_USERS}`);
}

function approvePendingUser(username: string) {
  return axiosService.post<void>(`${ApiRoutes.PENDING_USERS}/user/${encodeURIComponent(username)}`);
}

function denyPendingUser(username: string) {
  return axiosService.delete<void>(`${ApiRoutes.PENDING_USERS}/user/${encodeURIComponent(username)}`);
}

function denyAllPendingUsers() {
  return axiosService.delete<void>(`${ApiRoutes.PENDING_USERS}`);
}

function createRole(role: Partial<UserRole>) {
  return axiosService.post<GenericResponseDto<UserRole>>(ApiRoutes.USER_ROLE, role);
}

function getRoles(roleType: UserRoleType = 'network-role') {
  if (roleType === 'platform-role') {
    return axiosService.get<GenericResponseDto<UserRole[]>>(`${ApiRoutes.USER_ROLES}?platform=true`);
  }
  return axiosService.get<GenericResponseDto<UserRole[]>>(ApiRoutes.USER_ROLES);
}

function getRole(roleId: UserRole['id']) {
  return axiosService.get<GenericResponseDto<UserRole>>(`${ApiRoutes.USER_ROLE}?role_id=${encodeURIComponent(roleId)}`);
}

function updateRole(role: UserRole) {
  return axiosService.put<UserRole>(`${ApiRoutes.USER_ROLE}?role_id=${encodeURIComponent(role.id)}`, role);
}

function deleteRole(roleId: string) {
  return axiosService.delete<void>(`${ApiRoutes.USER_ROLE}?role_id=${encodeURIComponent(roleId)}`);
}

function createGroup(group: CreateUserGroupReqDto) {
  return axiosService.post<GenericResponseDto<UserGroup>>(ApiRoutes.USER_GROUP, group);
}

function getGroups() {
  return axiosService.get<GenericResponseDto<UserGroup[]>>(ApiRoutes.USER_GROUPS);
}

function getGroup(groupId: UserGroup['id']) {
  return axiosService.get<GenericResponseDto<UserGroup>>(
    `${ApiRoutes.USER_GROUP}?group_id=${encodeURIComponent(groupId)}`,
  );
}

function updateGroup(group: UserGroup) {
  return axiosService.put<GenericResponseDto<UserGroup>>(
    `${ApiRoutes.USER_GROUP}?group_id=${encodeURIComponent(group.id)}`,
    group,
  );
}

function deleteGroup(groupId: string) {
  return axiosService.delete<void>(`${ApiRoutes.USER_GROUP}?group_id=${encodeURIComponent(groupId)}`);
}

function createUserInvite(dto: CreateUserInviteReqDto) {
  return axiosService.post<void>(ApiRoutes.USERS_INVITE, dto);
}

function getUserInvites() {
  return axiosService.get<GenericResponseDto<UserInvite[]>>(ApiRoutes.USERS_INVITES);
}

function userInviteSignup(inviteCode: string, dto: UserInviteReqDto) {
  return axiosService.post<void>(
    `${ApiRoutes.USERS_INVITE_SIGNUP}?email=${dto.username}&invite_code=${encodeURIComponent(inviteCode)}`,
    dto,
  );
}

function deleteUserInvite(inviteeEmail: string) {
  return axiosService.delete<string>(`${ApiRoutes.USERS_INVITE}?invitee_email=${encodeURIComponent(inviteeEmail)}`);
}

function deleteAllUserInvites() {
  return axiosService.delete<string>(`${ApiRoutes.USERS_INVITES}`);
}

export const UsersService = {
  getUsers,
  getUser,
  serverHasAdmin,
  createAdminUser,
  createUser,
  updateUser,
  updateUserDetails,
  updateAdminUser,
  deleteUser,
  // createUserGroup,
  // getUserGroups,
  // deleteUserGroup,
  attachUserToIngress,
  removeUserFromIngress,
  transferSuperAdminRights,
  getIngressUsers,
  getPendingUsers,
  approvePendingUser,
  denyPendingUser,
  denyAllPendingUsers,
  getRoles,
  getRole,
  createRole,
  updateRole,
  deleteRole,
  createGroup,
  getGroups,
  getGroup,
  updateGroup,
  deleteGroup,
  createUserInvite,
  getUserInvites,
  userInviteSignup,
  deleteUserInvite,
  deleteAllUserInvites,
};
