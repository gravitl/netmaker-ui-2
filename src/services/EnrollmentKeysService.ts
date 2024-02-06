import { ApiRoutes } from '@/constants/ApiRoutes';
import { EnrollmentKey } from '@/models/EnrollmentKey';
import { axiosService } from './BaseService';
import { CreateEnrollmentKeyReqDto } from './dtos/CreateEnrollmentKeyReqDto';

function getEnrollmentKeys() {
  return axiosService.get<EnrollmentKey[]>(ApiRoutes.ENROLLMENT_KEYS);
}

function createEnrollmentKey(payload: CreateEnrollmentKeyReqDto) {
  return axiosService.post<EnrollmentKey>(ApiRoutes.ENROLLMENT_KEYS, payload);
}

function deleteEnrollmentKey(id: EnrollmentKey['value']) {
  return axiosService.delete<void>(`${ApiRoutes.ENROLLMENT_KEYS}/${encodeURIComponent(id)}`);
}

function updateEnrollmentKey(id: EnrollmentKey['value'], payload: CreateEnrollmentKeyReqDto) {
  return axiosService.put<EnrollmentKey>(`${ApiRoutes.ENROLLMENT_KEYS}/${encodeURIComponent(id)}`, payload);
}

export const EnrollmentKeysService = {
  getEnrollmentKeys,
  createEnrollmentKey,
  deleteEnrollmentKey,
  updateEnrollmentKey,
};
