import { ApiRoutes } from '@/constants/ApiRoutes';
import { axiosService } from './BaseService';
import { LoginDto } from './dtos/LoginDto';
import { LoginResDto } from './dtos/LoginResDto';

function login(payload: LoginDto) {
  const headers = {
    'From-Ui': true,
  };

  return axiosService.post<LoginResDto>(ApiRoutes.LOGIN, payload, { headers });
}

export const AuthService = {
  login,
};
