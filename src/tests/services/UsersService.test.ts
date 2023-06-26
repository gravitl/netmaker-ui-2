import MockAdapter from 'axios-mock-adapter';
import { ApiRoutes } from '@/constants/ApiRoutes';
import { baseService } from '@/services/BaseService';
import { stubUsers } from '../fixtures/Models';
import { User } from '@/models/User';
import { UsersService } from '@/services/UsersService';

describe('UsersService', () => {
  const mock = new MockAdapter(baseService);

  afterEach(() => {
    mock.reset();
  });

  it('should get all users successfully and throw if error', async () => {
    const testRoute = ApiRoutes.USERS;

    const mockRes: User[] = stubUsers;
    mock.onGet(testRoute).replyOnce(200, mockRes);

    const res = (await UsersService.getUsers()).data;

    expect(res).toEqual(mockRes);

    mock.onGet(testRoute).replyOnce(500);
    await expect(UsersService.getUsers()).rejects.toThrow();

    mock.onGet(testRoute).networkError();
    await expect(UsersService.getUsers()).rejects.toThrow();
  });
});
