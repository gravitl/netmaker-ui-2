import MockAdapter from 'axios-mock-adapter';
import { ApiRoutes } from '@/constants/ApiRoutes';
import { baseService } from '@/services/BaseService';
import { stubNodes } from '../fixtures/Models';
import { Node } from '@/models/Node';
import { NodesService } from '@/services/NodesService';

describe('NodesService', () => {
  const mock = new MockAdapter(baseService);

  afterEach(() => {
    mock.reset();
  });

  it('should get all nodes successfully and throw if error', async () => {
    const testRoute = ApiRoutes.NODES;

    const mockRes: Node[] = stubNodes;
    mock.onGet(testRoute).replyOnce(200, mockRes);

    const res = (await NodesService.getNodes()).data;

    expect(res).toEqual(mockRes);

    mock.onGet(testRoute).replyOnce(500);
    await expect(NodesService.getNodes()).rejects.toThrow();

    mock.onGet(testRoute).networkError();
    await expect(NodesService.getNodes()).rejects.toThrow();
  });
});
