export interface EnrollmentKey {
  value: string; // ID
  tags: string[]; // names
  token: string;
  networks: string[];
  expiration: number;
  uses_remaining: number;
  unlimited: boolean;
  type: 'Undefined' | 'TimeExpiration' | 'Uses' | 'Unlimited';
}
