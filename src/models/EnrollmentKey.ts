export const UndefinedEnrollmentKey = 0;
export const TimeBoundEnrollmentKey = 1;
export const UsesBasedEnrollmentKey = 2;
export const UnlimitedEnrollmentKey = 3;

export interface EnrollmentKey {
  value: string; // ID
  tags: string[]; // names
  token: string;
  networks: string[];
  expiration: number;
  uses_remaining: number;
  unlimited: boolean;
  type: 0 | 1 | 2 | 3; // 0 = undefined, 1 = time expiration, 2 = uses, 3 = unlimited
  relay: string;
}
