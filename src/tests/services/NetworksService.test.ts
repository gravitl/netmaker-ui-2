import { ApiRoutes } from '@/constants/ApiRoutes';
import { Network } from '@/models/Network';
import { axiosService } from '@/services/BaseService';
import MockAdapter from 'axios-mock-adapter';
import { stubNetwork1, stubNetworks } from '../fixtures/Models';
import { NetworksService } from '@/services/NetworksService';
import { convertUiNetworkToNetworkPayload } from '@/utils/NetworkUtils';

describe('NetworksService', () => {
  const mock = new MockAdapter(axiosService);

  afterEach(() => {
    mock.reset();
  });

  it('should get all networks successfully and throw if error', async () => {
    const testRoute = ApiRoutes.NETWORKS;

    const mockRes: Network[] = stubNetworks;
    mock.onGet(testRoute).replyOnce(200, mockRes);

    const res = (await NetworksService.getNetworks()).data;

    expect(res).toEqual(mockRes);

    mock.onGet(testRoute).replyOnce(500);
    await expect(NetworksService.getNetworks()).rejects.toThrow();

    mock.onGet(testRoute).networkError();
    await expect(NetworksService.getNetworks()).rejects.toThrow();
  });

  it('should create a network successfully and throw if error', async () => {
    const testRoute = ApiRoutes.NETWORKS;

    const mockRes: Network = stubNetwork1;
    mock.onPost(testRoute).replyOnce(200, mockRes);

    const res = (await NetworksService.createNetwork(convertUiNetworkToNetworkPayload(stubNetwork1))).data;

    expect(res).toEqual(mockRes);

    mock.onGet(testRoute).replyOnce(500);
    await expect(NetworksService.createNetwork(convertUiNetworkToNetworkPayload(stubNetwork1))).rejects.toThrow();

    mock.onGet(testRoute).networkError();
    await expect(NetworksService.createNetwork(convertUiNetworkToNetworkPayload(stubNetwork1))).rejects.toThrow();
  });

  it('should delete a network successfully and throw if error', async () => {
    const testRoute = `${ApiRoutes.NETWORKS}/${stubNetwork1.netid}`;

    mock.onDelete(testRoute).replyOnce(200);

    await expect(NetworksService.deleteNetwork(stubNetwork1.netid)).resolves.toBeTruthy();

    mock.onDelete(testRoute).replyOnce(500);
    await expect(NetworksService.deleteNetwork(stubNetwork1.netid)).rejects.toThrow();

    mock.onDelete(testRoute).networkError();
    await expect(NetworksService.deleteNetwork(stubNetwork1.netid)).rejects.toThrow();
  });

  // it('should update host successfully and throw if error', async () => {
  //   const testRoute = `${ApiRoutes.HOSTS}/${stubHost1.id}`;

  //   const mockRes: Host = {
  //     ...stubHost1,
  //     name: 'new name',
  //   };
  //   mock.onPut(testRoute).replyOnce(200, mockRes);

  //   const res = (await HostsService.updateHost(stubHost1.id, mockRes)).data;

  //   expect(res).toEqual(mockRes);

  //   mock.onGet(testRoute).replyOnce(500);
  //   await expect(HostsService.updateHost(stubHost1.id, mockRes)).rejects.toThrow();

  //   mock.onGet(testRoute).networkError();
  //   await expect(HostsService.updateHost(stubHost1.id, mockRes)).rejects.toThrow();
  // });
});
