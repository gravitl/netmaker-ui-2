import { Network } from './Network';
import type { UserGroup } from './UserGroup';

export interface User {
  username: string;
  isadmin: boolean;
  networks: null | Array<Network['netid']>;
  groups: null | Array<UserGroup>;
}
