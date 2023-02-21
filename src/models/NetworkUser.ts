export interface NetworkUser {
  accesslevel: number;
  clientlimit: number;
  nodelimit: number;
  id: string;
  clients: Array<string>;
  nodes: Array<string>;
}
