import MockAdapter from 'axios-mock-adapter';
import { ApiRoutes } from '@/constants/ApiRoutes';
import { HostsService } from '@/services/HostsService';
import { baseService } from '@/services/BaseService';
import { Host } from '@/models/Host';
import { stubHost1, stubHosts } from '../fixtures/Models';

describe('HostsService', () => {
  const mock = new MockAdapter(baseService);

  afterEach(() => {
    mock.reset();
  });

  it('should get all hosts successfully and throw if error', async () => {
    const testRoute = ApiRoutes.HOSTS;

    const mockRes: Host[] = stubHosts;
    mock.onGet(testRoute).replyOnce(200, mockRes);

    const res = (await HostsService.getHosts()).data;

    expect(res).toEqual(mockRes);

    mock.onGet(testRoute).replyOnce(500);
    await expect(HostsService.getHosts()).rejects.toThrow();

    mock.onGet(testRoute).networkError();
    await expect(HostsService.getHosts()).rejects.toThrow();
  });

  it('should delete host successfully and throw if error', async () => {
    const testRoute = `${ApiRoutes.HOSTS}/${stubHost1.id}`;

    mock.onDelete(testRoute).replyOnce(200, stubHost1);

    const res = (await HostsService.deleteHost(stubHost1.id)).data;

    expect(res).toEqual(stubHost1);

    mock.onDelete(testRoute).replyOnce(500);
    await expect(HostsService.deleteHost(stubHost1.id)).rejects.toThrow();

    mock.onDelete(testRoute).networkError();
    await expect(HostsService.deleteHost(stubHost1.id)).rejects.toThrow();
  });

  it('should update host successfully and throw if error', async () => {
    const testRoute = `${ApiRoutes.HOSTS}/${stubHost1.id}`;

    const mockRes: Host = {
      ...stubHost1,
      name: 'new name',
    };
    mock.onPut(testRoute).replyOnce(200, mockRes);

    const res = (await HostsService.updateHost(stubHost1.id, mockRes)).data;

    expect(res).toEqual(mockRes);

    mock.onGet(testRoute).replyOnce(500);
    await expect(HostsService.updateHost(stubHost1.id, mockRes)).rejects.toThrow();

    mock.onGet(testRoute).networkError();
    await expect(HostsService.updateHost(stubHost1.id, mockRes)).rejects.toThrow();
  });

  it('should refresh all host keys successfully and throw if error', async () => {
    const testRoute = `${ApiRoutes.HOSTS}/keys`;

    mock.onPut(testRoute).replyOnce(200);

    await expect(HostsService.refreshAllHostsKeys()).resolves.toBeTruthy();

    mock.onGet(testRoute).replyOnce(500);
    await expect(HostsService.refreshAllHostsKeys()).rejects.toThrow();

    mock.onGet(testRoute).networkError();
    await expect(HostsService.refreshAllHostsKeys()).rejects.toThrow();
  });

  it('should refresh all host keys successfully and throw if error', async () => {
    const testRoute = `${ApiRoutes.HOSTS}/${stubHost1.id}/keys`;

    mock.onPut(testRoute).replyOnce(200);

    await expect(HostsService.refreshHostKeys(stubHost1.id)).resolves.toBeTruthy();

    mock.onGet(testRoute).replyOnce(500);
    await expect(HostsService.refreshHostKeys(stubHost1.id)).rejects.toThrow();

    mock.onGet(testRoute).networkError();
    await expect(HostsService.refreshHostKeys(stubHost1.id)).rejects.toThrow();
  });
});
