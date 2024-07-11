import { User } from '@/models/User';

export interface GatewayUsersResDto {
  node_id: string;
  network: string;
  users: User[] | null;
}
