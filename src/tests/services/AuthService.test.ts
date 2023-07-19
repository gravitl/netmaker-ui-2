import { ApiRoutes } from '@/constants/ApiRoutes';
import { AuthService } from '@/services/AuthService';
import { axiosService } from '@/services/BaseService';
import { LoginResDto } from '@/services/dtos/LoginResDto';
import MockAdapter from 'axios-mock-adapter';

describe('AuthService', () => {
  const mock = new MockAdapter(axiosService);

  afterEach(() => {
    mock.reset();
  });

  it('should login successfully', async () => {
    const data = { username: 'testuser', password: 'testpassword' };
    const mockRes: LoginResDto = {
      Code: 0,
      Message: '',
      Response: {
        UserName: 'testuser',
        AuthToken: 'testtoken',
      },
    };
    mock.onPost(ApiRoutes.LOGIN, data).reply(200, mockRes);

    const res = (await AuthService.login(data)).data;

    expect(res.Response.AuthToken).toEqual(mockRes.Response.AuthToken);
  });

  it('should throw an error when login fails', async () => {
    const data = { username: 'testuser', password: 'testpassword' };
    mock.onPost(ApiRoutes.LOGIN, data).reply(401);

    await expect(AuthService.login(data)).rejects.toThrow();
  });
});
