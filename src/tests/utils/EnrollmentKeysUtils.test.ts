import {
  EnrollmentKey,
  TimeBoundEnrollmentKey,
  UndefinedEnrollmentKey,
  UnlimitedEnrollmentKey,
  UsesBasedEnrollmentKey,
} from '@/models/EnrollmentKey';
import { isEnrollmentKeyValid, renderEnrollmentKeyType } from '@/utils/EnrollmentKeysUtils';

describe('EnrollmentKeysUtils', () => {
  it('correctly verifies an enrollment key', () => {
    const validKeyUnlimited: EnrollmentKey = {
      tags: ['test'],
      networks: [],
      expiration: 0,
      token: '',
      type: UnlimitedEnrollmentKey,
      unlimited: true,
      uses_remaining: 0,
      value: '',
    };
    const invalidKeyUnlimited: EnrollmentKey = {
      tags: ['test'],
      networks: [],
      expiration: 0,
      token: '',
      type: UnlimitedEnrollmentKey,
      unlimited: true,
      uses_remaining: 0,
      value: '',
    };
    const validKeyUses: EnrollmentKey = {
      tags: ['test'],
      networks: [],
      expiration: 0,
      token: '',
      type: UsesBasedEnrollmentKey,
      unlimited: false,
      uses_remaining: 1,
      value: '',
    };
    const invalidKeyUses: EnrollmentKey = {
      tags: ['test'],
      networks: [],
      expiration: 0,
      token: '',
      type: UsesBasedEnrollmentKey,
      unlimited: false,
      uses_remaining: 0,
      value: '',
    };
    const validKeyTime: EnrollmentKey = {
      tags: ['test'],
      networks: [],
      expiration: new Date().getTime() + 3600,
      token: '',
      type: TimeBoundEnrollmentKey,
      unlimited: false,
      uses_remaining: 0,
      value: '',
    };
    const invalidKeyTime: EnrollmentKey = {
      tags: ['test'],
      networks: [],
      expiration: new Date().getTime() - 3600,
      token: '',
      type: TimeBoundEnrollmentKey,
      unlimited: false,
      uses_remaining: 0,
      value: '',
    };
    const validKeyDeprecated: EnrollmentKey = {
      tags: ['test'],
      networks: [],
      expiration: 0,
      token: '',
      type: UndefinedEnrollmentKey,
      unlimited: false,
      uses_remaining: 1,
      value: '',
    };
    const invalidKeyDeprecated: EnrollmentKey = {
      tags: ['test'],
      networks: [],
      expiration: 0,
      token: '',
      type: UndefinedEnrollmentKey,
      unlimited: false,
      uses_remaining: 0,
      value: '',
    };

    expect(isEnrollmentKeyValid(validKeyUnlimited)).toEqual(true);
    expect(isEnrollmentKeyValid(validKeyTime)).toEqual(true);
    expect(isEnrollmentKeyValid(validKeyUses)).toEqual(true);
    expect(isEnrollmentKeyValid(validKeyDeprecated)).toEqual(true);
    expect(isEnrollmentKeyValid(invalidKeyUnlimited)).toEqual(true);
    expect(isEnrollmentKeyValid(invalidKeyTime)).toEqual(true);
    expect(isEnrollmentKeyValid(invalidKeyUses)).toEqual(true);
    expect(isEnrollmentKeyValid(invalidKeyDeprecated)).toEqual(true);
  });

  it('correctly renders an enrollment key type', () => {
    expect(renderEnrollmentKeyType(0)).toBe('Undefined');
    expect(renderEnrollmentKeyType(1)).toBe('Time-Bound');
    expect(renderEnrollmentKeyType(2)).toBe('Uses-based');
    expect(renderEnrollmentKeyType(3)).toBe('Unlimited');
  });
});
