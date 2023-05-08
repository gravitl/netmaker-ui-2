import { EnrollmentKey } from '../models/EnrollmentKey';

export function isEnrollmentKeyValid(key: EnrollmentKey): boolean {
  switch (key.type) {
    case 'Undefined':
      return false;
    case 'TimeExpiration':
      return new Date(key.expiration).getTime() > Date.now();
    case 'Uses':
      return key.uses_remaining > 0;
    case 'Unlimited':
      return key.unlimited;
    // default:
    //   return false;
  }

  // fallback logic for old keys w/o type
  if (key === undefined || key === null) {
    return false;
  }
  if (key.uses_remaining > 0) {
    return true;
  }
  if (new Date(key.expiration).getTime() > Date.now()) {
    return true;
  }

  return key.unlimited;
}
