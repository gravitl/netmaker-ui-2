import { Node } from '@/models/Node';
import { getHostHealth, getTimeMinHrs, renderNodeHealth } from '@/utils/Utils';
import { cleanup, render, screen } from '@testing-library/react';

const testNode1: Node = {
  id: 'test-node',
  hostid: 'test-host',
  address: '',
  address6: '',
  localaddress: '',
  persistentkeepalive: 0,
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
};

const testNode2 = { ...testNode1, lastcheckin: testNode1.lastcheckin - 400 };

describe('Utils', () => {
  it('renders node health', () => {
    render(renderNodeHealth('unknown'));
    expect(screen.getByText('Unknown')).toBeInTheDocument();
    cleanup();

    render(renderNodeHealth('error'));
    expect(screen.getByText('Error')).toBeInTheDocument();
    cleanup();

    render(renderNodeHealth('warning'));
    expect(screen.getByText('Warning')).toBeInTheDocument();
    cleanup();

    render(renderNodeHealth('healthy'));
    expect(screen.getByText('Healthy')).toBeInTheDocument();
    cleanup();
  });

  it('breaksdown a duration in secs to hours and minutes', () => {
    const SEC_1 = 1_000_000_000;
    const MIN_2 = 120_000_000_000;
    const HOUR_1 = 3600_000_000_000;
    const HOUR_2_MIN_1 = 7260_000_000_000;

    expect(getTimeMinHrs(SEC_1)).toStrictEqual({ hours: 0, min: 1 });
    expect(getTimeMinHrs(MIN_2)).toStrictEqual({ hours: 0, min: 2 });
    expect(getTimeMinHrs(HOUR_1)).toStrictEqual({ hours: 1, min: 0 });
    expect(getTimeMinHrs(HOUR_2_MIN_1)).toStrictEqual({ hours: 2, min: 1 });
  });

  it("deduces a host's health", () => {
    expect(getHostHealth(testNode1.hostid, [testNode1, testNode2], false)).toEqual('warning');

    render(getHostHealth(testNode1.hostid, [testNode1, testNode2], true) as JSX.Element);
    expect(screen.getByText('Warning')).toBeInTheDocument();
    cleanup();
  });
});
