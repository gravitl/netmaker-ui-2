import { EnrollmentKey } from '@/models/EnrollmentKey';

export type CreateEnrollmentKeyReqDto = Omit<EnrollmentKey, 'token' | 'value'>;
