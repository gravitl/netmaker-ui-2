import { ApiRoutes } from '@/constants/ApiRoutes';
import { baseService } from './BaseService';
import { User } from '@/models/User';
import { UpdateUserReqDto } from './dtos/UserDtos';

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

function updateUserNetworks(username: User['username'], payload: User) {
  return baseService.put<User>(`${ApiRoutes.USERS}/networks/${username}`, payload);
}

function updateAdminUser(username: User['username'], payload: UpdateUserReqDto) {
  return baseService.put<User>(`${ApiRoutes.USERS}/${username}/adm`, payload);
}

function deleteUser(username: User['username']) {
  return baseService.delete<void>(`${ApiRoutes.USERS}/${username}`);
}

export const UsersService = {
  getUsers,
  getUser,
  serverHasAdmin,
  createAdminUser,
  createUser,
  updateUser,
  updateUserNetworks,
  updateAdminUser,
  deleteUser,
};
