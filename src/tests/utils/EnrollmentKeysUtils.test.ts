import {
  EnrollmentKey,
  TimeBoundEnrollmentKey,
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
      relay: '',
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
      relay: '',
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
      relay: '',
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
      relay: '',
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
      relay: '',
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
      relay: '',
    };
    const validKeyDeprecated: Partial<EnrollmentKey> = {
      tags: ['test'],
      networks: [],
      expiration: 0,
      token: '',
      type: undefined,
      unlimited: false,
      uses_remaining: 1,
      value: '',
    };
    const invalidKeyDeprecated: Partial<EnrollmentKey> = {
      tags: ['test'],
      networks: [],
      expiration: 0,
      token: '',
      type: undefined,
      unlimited: false,
      uses_remaining: 0,
      value: '',
    };

    expect(isEnrollmentKeyValid(validKeyUnlimited)).toEqual(true);
    expect(isEnrollmentKeyValid(validKeyTime)).toEqual(true);
    expect(isEnrollmentKeyValid(validKeyUses)).toEqual(true);
    expect(isEnrollmentKeyValid(validKeyDeprecated as any)).toEqual(true);
    expect(isEnrollmentKeyValid(invalidKeyUnlimited)).toEqual(true);
    expect(isEnrollmentKeyValid(invalidKeyTime)).toEqual(false);
    expect(isEnrollmentKeyValid(invalidKeyUses)).toEqual(false);
    expect(isEnrollmentKeyValid(invalidKeyDeprecated as any)).toEqual(false);
  });

  it('correctly renders an enrollment key type', () => {
    expect(renderEnrollmentKeyType(0)).toEqual('Undefined');
    expect(renderEnrollmentKeyType(1)).toEqual('Time-bound');
    expect(renderEnrollmentKeyType(2)).toEqual('Uses-based');
    expect(renderEnrollmentKeyType(3)).toEqual('Unlimited');
  });
});
