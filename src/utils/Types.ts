export type MutableRequired<T> = { -readonly [P in keyof T]-?: T[P] };

export type RequiredField<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type NetworkDetailTourStep =
  | 'overview'
  | 'hosts'
  | 'relays'
  | 'remote-access'
  | 'vpn-clients'
  | 'users'
  | 'egress'
  | 'acls'
  | 'dns'
  | 'graph'
  | 'metrics';
