import { ApiRoutes } from '@/constants/ApiRoutes';
import { axiosService } from './BaseService';
import { User } from '@/models/User';
import { UpdateUserReqDto } from './dtos/UserDtos';
import { UserGroup } from '@/models/UserGroup';
import { CreateUserReqDto } from './dtos/UserDtos';
import { Node } from '@/models/Node';
import { GatewayUsersResDto } from './dtos/GatewayUsersResDto';

function getUsers() {
  return axiosService.get<User[]>(ApiRoutes.USERS);
}

function getUser(username: User['username']) {
  return axiosService.get<User>(`${ApiRoutes.USERS}/${encodeURIComponent(username)}`);
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

function createUserGroup(userGroupName: UserGroup) {
  return axiosService.post<void>(`${ApiRoutes.USER_GROUPS}/${encodeURIComponent(userGroupName)}`);
}

function getUserGroups(): Promise<UserGroup[]> {
  return axiosService
    .get<Record<UserGroup, never>>(`${ApiRoutes.USER_GROUPS}`)
    .then((userGroups) => Object.keys(userGroups.data));
}

function deleteUserGroup(userGroupName: UserGroup) {
  return axiosService.delete<void>(`${ApiRoutes.USER_GROUPS}/${encodeURIComponent(userGroupName)}`);
}

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
  return axiosService.post<void>(`${ApiRoutes.PENDING_USERS}/user/${username}`);
}

function denyPendingUser(username: string) {
  return axiosService.delete<void>(`${ApiRoutes.PENDING_USERS}/user/${username}`);
}

function denyAllPendingUsers() {
  return axiosService.delete<void>(`${ApiRoutes.PENDING_USERS}`);
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
  createUserGroup,
  getUserGroups,
  deleteUserGroup,
  attachUserToIngress,
  removeUserFromIngress,
  transferSuperAdminRights,
  getIngressUsers,
  getPendingUsers,
  approvePendingUser,
  denyPendingUser,
  denyAllPendingUsers,
};
