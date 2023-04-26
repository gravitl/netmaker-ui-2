import { ApiRoutes } from '@/constants/ApiRoutes';
import { EnrollmentKey } from '@/models/EnrollmentKey';
import { baseService } from './BaseService';
import { CreateEnrollmentKeyReqDto } from './dtos/CreateEnrollmentKeyReqDto';

function getEnrollmentKeys() {
  return baseService.get<EnrollmentKey[]>(ApiRoutes.ENROLLMENT_KEYS);
}

function createEnrollmentKey(payload: CreateEnrollmentKeyReqDto) {
  return baseService.post<EnrollmentKey>(ApiRoutes.ENROLLMENT_KEYS, payload);
}

function deleteEnrollmentKey(id: EnrollmentKey['value']) {
  return baseService.delete<void>(`${ApiRoutes.ENROLLMENT_KEYS}/${id}`);
}

export const EnrollmentKeysService = {
  getEnrollmentKeys,
  createEnrollmentKey,
  deleteEnrollmentKey,
};
