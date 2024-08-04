import { Host } from '@/models/Host';
import { Node } from '@/models/Node';
import { ProSettings } from '@/models/ProSettings';
import { User } from '@/models/User';

export const NULL_HOST: Host = {
  id: '',
  verbosity: 0,
  firewallinuse: '',
  version: '',
  name: '',
  os: '',
  debug: false,
  isstatic: false,
  isstaticport: false,
  listenport: 0,
  localrange: '',
  mtu: 0,
  interfaces: [],
  defaultinterface: '',
  endpointip: '',
  endpointipv6: '',
  publickey: '',
  macaddress: '',
  nodes: [],
  isdefault: false,
  nat_type: 'public',
  persistentkeepalive: 0,
  autoupdate: false,
};

export const NULL_NODE: Node = {
  id: '',
  hostid: '',
  address: '',
  address6: '',
  localaddress: '',
  interface: '',
  macaddress: '',
  lastmodified: 0,
  expdatetime: 0,
  lastcheckin: 0,
  lastpeerupdate: 0,
  network: '',
  networkrange: '',
  networkrange6: '',
  pendingdelete: false,
  isegressgateway: false,
  isingressgateway: false,
  ingressdns: '',
  egressgatewayranges: [],
  egressgatewaynatenabled: false,
  failovernode: '',
  dnson: false,
  islocal: false,
  server: '',
  defaultacl: '',
  connected: false,
  failover: false,
  relayedby: '',
  relaynodes: [],
  autoupdate: false,
  isrelay: false,
  isrelayed: false,
  isinternetgateway: false,
  is_fail_over: false,
  failed_over_by: '',
  fail_over_peers: [],
  internetgw_node_id: '',
  inet_node_req: {
    inet_node_client_ids: undefined,
  },
  additional_rag_ips: [],
};

export const NULL_NETWORK_PROSETTINGS: ProSettings = {
  defaultaccesslevel: 0,
  defaultusernodelimit: 0,
  defaultuserclientlimit: 0,
  allowedusers: [],
  allowedgroups: [],
};

export const NULL_NODE_ID = '00000000-0000-0000-0000-000000000000';

export const mockNewUserWithGroup: User = {
  username: 'mock-user',
  user_group_ids: { all: {} },
  platform_role_id: 'mock-role',
  network_roles: { mockNetworkId: { mockRoleId: {} } },
  isadmin: false,
  issuperadmin: false,
  remote_gw_ids: null,
  auth_type: 'basic_auth',
};

export const mockNewUserWithoutGroup: User = {
  username: 'mock-user',
  user_group_ids: {},
  platform_role_id: 'mock-role',
  network_roles: { mockNetworkId: { mockRoleId: {} } },
  isadmin: false,
  issuperadmin: false,
  remote_gw_ids: null,
  auth_type: 'oauth',
};
