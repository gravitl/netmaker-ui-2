export interface AccessKey {
  accessstring: string;
  expiration?: Date | string;
  name: string;
  uses: number;
  value: string;
}
