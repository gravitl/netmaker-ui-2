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
  relaynodes: [],
  autoupdate: false,
};

const hostRegistry: Record<Host['id'], HostCommonDetails> = {
  'test-host': {
    endpointip: '1.2.3.4',
    interfaces: [],
    isstatic: false,
    listenport: 0,
    macaddress: '',
    mtu: 0,
    name: 'test-host',
    os: '',
    publickey: '',
    version: '',
  },
};

describe('NodeUtils', () => {
  it('determines the node health', () => {
    expect(getConnectivityStatus(testNode.lastcheckin - 400)).toEqual('warning');
    expect(getConnectivityStatus(testNode.lastcheckin - 8000)).toEqual('error');
    expect(getNodeConnectivityStatus({ ...testNode, lastcheckin: testNode.lastcheckin - 10 })).toEqual('healthy');
  });

  it("can deduce a node's associated host details", () => {
    expect(getExtendedNode(testNode, hostRegistry)).toStrictEqual({ ...testNode, ...hostRegistry[testNode.hostid] });
  });
});
