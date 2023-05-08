import {
  EnrollmentKey,
  TimeBoundEnrollmentKey,
  UndefinedEnrollmentKey,
  UnlimitedEnrollmentKey,
  UsesBasedEnrollmentKey,
} from '../models/EnrollmentKey';

export function isEnrollmentKeyValid(key: EnrollmentKey): boolean {
  switch (key.type) {
    case UndefinedEnrollmentKey:
      return false;
    case TimeBoundEnrollmentKey:
      return new Date(key.expiration).getTime() > Date.now();
    case UsesBasedEnrollmentKey:
      return key.uses_remaining > 0;
    case UnlimitedEnrollmentKey:
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

export function renderEnrollmentKeyType(keyType: EnrollmentKey['type']): string {
  switch (keyType) {
    case 0:
      return 'Undefined';
    case 1:
      return 'Time-bound';
    case 2:
      return 'Uses-based';
    case 3:
      return 'Unlimited';
    default:
      return 'Undefined';
  }
}
