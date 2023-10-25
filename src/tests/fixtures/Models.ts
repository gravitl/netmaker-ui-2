import { NodeAcl, NodeAclContainer } from '@/models/Acl';
import { Host } from '@/models/Host';
import { Network } from '@/models/Network';
import { Node } from '@/models/Node';
import { User } from '@/models/User';

export const stubHost1: Host = {
  id: 'host-1',
  verbosity: 0,
  firewallinuse: '',
  version: '',
  name: 'host 1',
  os: 'linux',
  debug: false,
  isstatic: false,
  listenport: 0,
  localrange: '',
  mtu: 0,
  interfaces: [],
  defaultinterface: '',
  endpointip: '',
  publickey: '',
  macaddress: '',
  nodes: [],
  isdefault: false,
  nat_type: 'public',
  persistentkeepalive: 0,
  autoupdate: false,
};

export const stubHost2: Host = {
  id: 'host-2',
  verbosity: 0,
  firewallinuse: '',
  version: 'darwin',
  name: 'host 2',
  os: '',
  debug: false,
  isstatic: false,
  listenport: 0,
  localrange: '',
  mtu: 0,
  interfaces: [],
  defaultinterface: '',
  endpointip: '',
  publickey: '',
  macaddress: '',
  nodes: [],
  isdefault: false,
  nat_type: 'asymmetric',
  persistentkeepalive: 0,
  autoupdate: false,
};

export const stubHosts: Host[] = [stubHost1, stubHost2];

export const stubNetwork1: Network = {
  addressrange: '',
  addressrange6: '',
  netid: 'net-1',
  nodeslastmodified: 0,
  networklastmodified: 0,
  defaultinterface: '',
  defaultlistenport: 0,
  nodelimit: 0,
  defaultpostup: '',
  defaultpostdown: '',
  defaultkeepalive: 0,
  isipv4: false,
  isipv6: false,
  localrange: '',
  defaultudpholepunch: false,
  defaultnatenabled: false,
  defaultextclientdns: '',
  defaultmtu: 0,
  defaultacl: 'yes',
  prosettings: undefined,
};

export const stubNetwork2: Network = {
  addressrange: '',
  addressrange6: '',
  netid: 'net-2',
  nodeslastmodified: 0,
  networklastmodified: 0,
  defaultinterface: '',
  defaultlistenport: 0,
  nodelimit: 0,
  defaultpostup: '',
  defaultpostdown: '',
  defaultkeepalive: 0,
  isipv4: false,
  isipv6: false,
  localrange: '',
  defaultudpholepunch: false,
  defaultnatenabled: false,
  defaultextclientdns: '',
  defaultmtu: 0,
  defaultacl: 'yes',
  prosettings: undefined,
};

export const stubNetworks: Network[] = [stubNetwork1, stubNetwork2];

export const stubNode1: Node = {
  id: 'node-1',
  hostid: 'host-1',
  address: '',
  address6: '',
  localaddress: '',
  interface: '',
  macaddress: '',
  lastmodified: 0,
  expdatetime: 0,
  lastcheckin: 0,
  lastpeerupdate: 0,
  network: 'net-1',
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
  internetgateway: '',
  defaultacl: '',
  connected: false,
  failover: false,
  relayedby: '',
  autoupdate: false,
};

export const stubNode2: Node = {
  id: 'node-2',
  hostid: 'host-2',
  address: '',
  address6: '',
  localaddress: '',
  interface: '',
  macaddress: '',
  lastmodified: 0,
  expdatetime: 0,
  lastcheckin: 0,
  lastpeerupdate: 0,
  network: 'net-1',
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
  internetgateway: '',
  defaultacl: '',
  connected: false,
  failover: false,
  relayedby: '',
  autoupdate: false,
};

export const stubNodes: Node[] = [stubNode1, stubNode2];

export const stubUser1: User = {
  username: 'user-1',
  isadmin: true,
  issuperadmin: false,
  remote_gw_ids: null,
};

export const stubUser2: User = {
  username: 'user-2',
  isadmin: false,
  issuperadmin: false,
  remote_gw_ids: null,
};

export const stubUsers: User[] = [stubUser1, stubUser2];

export const stubAclData: NodeAclContainer = {};
for (let i = 1; i <= 50; i++) {
  const nodeAcl: NodeAcl = {};
  for (let j = 1; j <= 50; j++) {
    nodeAcl[`node-${j}`] = 2;
  }
  stubAclData[`node-${i}`] = nodeAcl;
}
