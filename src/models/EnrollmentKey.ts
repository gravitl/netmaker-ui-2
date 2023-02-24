export interface EnrollmentKey {
  expiration: number;
  uses_remaining: number;
  networks: string[];
  unlimited: boolean;
  tags: string[];
}
