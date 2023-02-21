export interface User {
  name: string;
  isAdmin: boolean;
  exp: number;
  networks: null | Array<string>;
  groups: null | Array<string>;
}
