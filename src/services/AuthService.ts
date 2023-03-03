import { ApiRoutes } from '@/constants/ApiRoutes';
import { baseService } from './BaseService';
import { LoginDto } from './dtos/LoginDto';
import { LoginResDto } from './dtos/LoginResDto';

function login(payload: LoginDto) {
  return baseService.post<LoginResDto>(ApiRoutes.LOGIN, payload);
}

export const AuthService = {
  login,
};
