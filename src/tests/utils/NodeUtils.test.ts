import { Host, HostCommonDetails } from '@/models/Host';
import { Node } from '@/models/Node';
import { getConnectivityStatus, getExtendedNode, getNodeConnectivityStatus } from '@/utils/NodeUtils';

const testNode: Node = {
  id: 'test-node',
  hostid: 'test-host',
  address: '',
  address6: '',
  localaddress: '',
  interface: '',
  macaddress: '',
  lastmodified: 0,
  expdatetime: 0,
  lastcheckin: Date.now() / 1000,
  lastpeerupdate: 0,
  network: '',
  networkrange: '',
  networkrange6: '',
  pendingdelete: false,
  isegressgateway: false,
  isingressgateway: false,
  ingressdns: '',
  ingressmtu: 0,
  ingresspersistentkeepalive: 0,
  metadata: '',
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
    inet_node_client_ids: [],
  },
  additional_rag_ips: [],
  is_static: false,
  is_user_node: false,
  static_node: {
    clientid: '',
    description: '',
    privatekey: '',
    publickey: '',
    network: '',
    address: '',
    address6: '',
    ingressgatewayid: '',
    ingressgatewayendpoint: '',
    lastmodified: 0,
    enabled: false,
    ownerid: '',
    internal_ip_addr: '',
    internal_ip_addr6: '',
    dns: '',
    extraallowedips: [],
    tags: {},
    status: 'offline',
  },
  tags: {},
  status: 'offline',
  listenport: 0,
};

const hostRegistry: Record<Host['id'], HostCommonDetails> = {
  'test-host': {
    endpointip: '1.2.3.4',
    endpointipv6: 'fd00::2.3.4',
    interfaces: [],
    isstaticendpoint: false,
    isstaticport: false,
    listenport: 0,
    macaddress: '',
    mtu: 0,
    name: 'test-host',
    os: '',
    publickey: '',
    version: '',
    firewallinuse: '',
  },
};

describe('NodeUtils', () => {
  it('determines the node health', () => {
    expect(getConnectivityStatus(testNode.lastcheckin - 400)).toEqual('warning');
    expect(getConnectivityStatus(testNode.lastcheckin - 8000)).toEqual('error');
    expect(getNodeConnectivityStatus({ ...testNode })).toEqual('offline');
  });

  it("can deduce a node's associated host details", () => {
    expect(getExtendedNode(testNode, hostRegistry)).toStrictEqual({ ...testNode, ...hostRegistry[testNode.hostid] });
  });
});
