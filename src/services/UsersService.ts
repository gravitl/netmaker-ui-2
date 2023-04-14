import { ApiRoutes } from '@/constants/ApiRoutes';
import { baseService } from './BaseService';
import { User } from '@/models/User';
import { UpdateUserReqDto } from './dtos/UserDtos';
import { UserGroup } from '@/models/UserGroup';

function getUsers() {
  return baseService.get<User[]>(ApiRoutes.USERS);
}

function getUser(username: User['username']) {
  return baseService.get<User>(`${ApiRoutes.USERS}/${username}`);
}

function serverHasAdmin() {
  return baseService.get<boolean>(`${ApiRoutes.USERS_ADMIN}/hasadmin`);
}

function createAdminUser(payload: User) {
  return baseService.post<User>(`${ApiRoutes.USERS_ADMIN}/createadmin`, payload);
}

function createUser(payload: User) {
  return baseService.post<User>(`${ApiRoutes.USERS}/${payload.username}`, payload);
}

function updateUser(username: User['username'], payload: UpdateUserReqDto) {
  return baseService.put<User>(`${ApiRoutes.USERS}/${username}`, payload);
}

function updateUserDetails(username: User['username'], payload: User) {
  return baseService.put<User>(`${ApiRoutes.USERS}/networks/${username}`, payload);
}

function updateAdminUser(username: User['username'], payload: UpdateUserReqDto) {
  return baseService.put<User>(`${ApiRoutes.USERS}/${username}/adm`, payload);
}

function deleteUser(username: User['username']) {
  return baseService.delete<void>(`${ApiRoutes.USERS}/${username}`);
}

function createUserGroup(userGroupName: UserGroup) {
  return baseService.post<void>(`${ApiRoutes.USER_GROUPS}/${userGroupName}`);
}

function getUserGroups(): Promise<UserGroup[]> {
  return baseService
    .get<Record<UserGroup, never>>(`${ApiRoutes.USER_GROUPS}`)
    .then((userGroups) => Object.keys(userGroups.data));
}

function deleteUserGroup(userGroupName: UserGroup) {
  return baseService.delete<void>(`${ApiRoutes.USER_GROUPS}/${userGroupName}`);
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
};
