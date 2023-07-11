import MockAdapter from 'axios-mock-adapter';
import { ApiRoutes } from '@/constants/ApiRoutes';
import { EnrollmentKey, TimeBoundEnrollmentKey, UnlimitedEnrollmentKey } from '@/models/EnrollmentKey';
import { EnrollmentKeysService } from '@/services/EnrollmentKeysService';
import { CreateEnrollmentKeyReqDto } from '@/services/dtos/CreateEnrollmentKeyReqDto';
import { axiosService } from '@/services/BaseService';

describe('EnrollmentKeysService', () => {
  const mock = new MockAdapter(axiosService);

  afterEach(() => {
    mock.reset();
  });

  describe('getEnrollmentKeys', () => {
    it('should return the enrollment keys', async () => {
      const expectedResponse: EnrollmentKey[] = [
        {
          value: 'key1',
          expiration: 0,
          networks: [],
          tags: [],
          token: 'key1',
          type: UnlimitedEnrollmentKey,
          unlimited: true,
          uses_remaining: 0,
        },
        {
          value: 'key2',
          expiration: Date.now() + 3600,
          networks: [],
          tags: [],
          token: 'key2',
          type: TimeBoundEnrollmentKey,
          unlimited: false,
          uses_remaining: 0,
        },
      ];
      mock.onGet(ApiRoutes.ENROLLMENT_KEYS).reply(200, expectedResponse);

      const response = (await EnrollmentKeysService.getEnrollmentKeys()).data;

      expect(response).toEqual(expectedResponse);
    });
  });

  describe('createEnrollmentKey', () => {
    it('should create a new enrollment key', async () => {
      const expectedPayload: CreateEnrollmentKeyReqDto = {
        expiration: 0,
        networks: [],
        tags: [],
        type: UnlimitedEnrollmentKey,
        unlimited: true,
        uses_remaining: 0,
      };
      const expectedResponse: EnrollmentKey = {
        expiration: 0,
        networks: [],
        tags: [],
        type: UnlimitedEnrollmentKey,
        unlimited: true,
        uses_remaining: 0,
        value: 'new-key',
        token: 'new-key',
      };
      mock.onPost(ApiRoutes.ENROLLMENT_KEYS, expectedPayload).reply(201, expectedResponse);

      const response = (await EnrollmentKeysService.createEnrollmentKey(expectedPayload)).data;

      expect(response).toEqual(expectedResponse);
    });
  });

  describe('deleteEnrollmentKey', () => {
    it('should delete an enrollment key', async () => {
      const expectedId = 'key1';
      mock.onDelete(`${ApiRoutes.ENROLLMENT_KEYS}/${expectedId}`).reply(204);

      await EnrollmentKeysService.deleteEnrollmentKey(expectedId);

      expect(mock.history.delete.length).toBe(1);
    });
  });
});
