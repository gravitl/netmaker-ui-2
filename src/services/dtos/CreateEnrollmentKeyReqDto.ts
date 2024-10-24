import { EnrollmentKey } from '@/models/EnrollmentKey';
import { Tag } from '@/models/Tags';

export type CreateEnrollmentKeyReqDto = Omit<EnrollmentKey, 'token' | 'value'> & { groups?: Tag['id'][] };
