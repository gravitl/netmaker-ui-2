import { ApiRoutes } from '@/constants/ApiRoutes';
import { axiosService } from './BaseService';
import { LoginDto } from './dtos/LoginDto';
import { LoginResDto } from './dtos/LoginResDto';

function login(payload: LoginDto) {
  return axiosService.post<LoginResDto>(ApiRoutes.LOGIN, payload);
}

export const AuthService = {
  login,
};
