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
  return axiosService.get<User>(`${ApiRoutes.USERS}/${username}`);
}

function serverHasAdmin() {
  return axiosService.get<boolean>(`${ApiRoutes.USERS_ADMIN}/hassuperadmin`);
}

function createAdminUser(payload: CreateUserReqDto) {
  return axiosService.post<User>(`${ApiRoutes.USERS_ADMIN}/createsuperadmin`, payload);
}

function createUser(payload: User) {
  return axiosService.post<User>(`${ApiRoutes.USERS}/${payload.username}`, payload);
}

function updateUser(username: User['username'], payload: UpdateUserReqDto) {
  return axiosService.put<User>(`${ApiRoutes.USERS}/${username}`, payload);
}

function updateUserDetails(username: User['username'], payload: User) {
  return axiosService.put<User>(`${ApiRoutes.USERS}/networks/${username}`, payload);
}

function updateAdminUser(username: User['username'], payload: User) {
  return axiosService.put<User>(`${ApiRoutes.USERS}/${username}/adm`, payload);
}

function deleteUser(username: User['username']) {
  return axiosService.delete<void>(`${ApiRoutes.USERS}/${username}`);
}

function createUserGroup(userGroupName: UserGroup) {
  return axiosService.post<void>(`${ApiRoutes.USER_GROUPS}/${userGroupName}`);
}

function getUserGroups(): Promise<UserGroup[]> {
  return axiosService
    .get<Record<UserGroup, never>>(`${ApiRoutes.USER_GROUPS}`)
    .then((userGroups) => Object.keys(userGroups.data));
}

function deleteUserGroup(userGroupName: UserGroup) {
  return axiosService.delete<void>(`${ApiRoutes.USER_GROUPS}/${userGroupName}`);
}

function attachUserToIngress(username: User['username'], ingressId: Node['id']) {
  return axiosService.post<void>(`${ApiRoutes.USERS}/${username}/remote_access_gw/${ingressId}`);
}

function removeUserFromIngress(username: User['username'], ingressId: Node['id']) {
  return axiosService.delete<void>(`${ApiRoutes.USERS}/${username}/remote_access_gw/${ingressId}`);
}

function transferSuperAdminRights(username: User['username']) {
  return axiosService.post<void>(`${ApiRoutes.USERS_ADMIN}/transfersuperadmin/${username}`);
}

function getIngressUsers(nodeId: Node['id']) {
  return axiosService.get<GatewayUsersResDto>(`${ApiRoutes.USERS}/ingress/${nodeId}`);
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
};
