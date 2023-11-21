import { Host } from '@/models/Host';
import { MetricCategories, UptimeNodeMetrics } from '@/models/Metrics';
import { Node } from '@/models/Node';
import { isHostNatted } from '@/utils/NodeUtils';
import {
  getFormattedData,
  getFormattedTime,
  getHostHealth,
  getTimeMinHrs,
  renderMetricValue,
  renderNodeHealth,
} from '@/utils/Utils';
import { cleanup, render, screen } from '@testing-library/react';

const testNode1: Node = {
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
  isrelay: false,
  isrelayed: false,
};

const testNode2 = { ...testNode1, lastcheckin: testNode1.lastcheckin - 400 };

const testHost1: Host = {
  id: '',
  verbosity: 0,
  firewallinuse: '',
  version: '',
  name: '',
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
  nat_type: '',
  persistentkeepalive: 0,
  autoupdate: false,
};

const testHost2: Host = { ...testHost1, nat_type: 'public' };

const testHost3: Host = { ...testHost1, nat_type: 'asymmetric' };

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

  it('breaks down a duration in secs to hours and minutes', () => {
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

  it("deduces a host's NAT status", () => {
    expect(isHostNatted(testHost1)).toEqual(false);
    expect(isHostNatted(testHost2)).toEqual(false);
    expect(isHostNatted(testHost3)).toEqual(true);
  });

  it('gets formatted data', () => {
    const kb1 = 1000;
    const mb1 = 1000 * kb1;
    const gb1 = 1000 * mb1;
    const gb2 = 2 * gb1;

    expect(getFormattedData(kb1)).toEqual('1000.00 (B)');
    expect(getFormattedData(mb1)).toEqual('1000.00 (KiB)');
    expect(getFormattedData(gb1)).toEqual('1000.00 (MiB)');
    expect(getFormattedData(gb2)).toEqual('2.00 (GiB)');
  });

  it('gets formatted time', () => {
    const sec0 = 0;
    const sec1 = 1_000_000_000;
    const min1 = 60 * sec1;
    const hour1 = 60 * min1;
    const day1 = 24 * hour1;

    expect(getFormattedTime(sec0)).toEqual('0h0m');
    expect(getFormattedTime(sec1)).toEqual('0h1m');
    expect(getFormattedTime(min1)).toEqual('0h1m');
    expect(getFormattedTime(hour1)).toEqual('1h0m');
    expect(getFormattedTime(day1)).toEqual('24h0m');
  });

  describe('renderMetricValue', () => {
    it('should show latency metric', () => {
      const metricType: MetricCategories = 'latency';
      const value = 50;
      const result = renderMetricValue(metricType, value);
      const screen = render(<>{result}</>);
      expect(screen.queryByTestId(`latency-metric-${value}`)).toBeInTheDocument();
    });

    it('should show connectivity metric', () => {
      const metricType: MetricCategories = 'connectivity-status';
      const value = true;
      const result = renderMetricValue(metricType, value);
      const screen = render(<>{result}</>);
      expect(screen.queryByTestId(`connectivity-metric-${value}`)).toBeInTheDocument();
    });

    it('should show data tx metric', () => {
      let metricType: MetricCategories = 'bytes-received';
      let value = 50;
      let result = renderMetricValue(metricType, value);
      let screen = render(<>{result}</>);
      expect(screen.queryByTestId(`bytes-received-metric-${value}`)).toBeInTheDocument();
      cleanup();

      metricType = 'bytes-sent';
      value = 200;
      result = renderMetricValue(metricType, value);
      screen = render(<>{result}</>);
      expect(screen.queryByTestId(`bytes-sent-metric-${value}`)).toBeInTheDocument();
      cleanup();
    });

    it('should show uptime metric', () => {
      const metricType: MetricCategories = 'uptime';
      const value: UptimeNodeMetrics = {
        fractionalUptime: 0,
        uptime: 0,
        totalFractionalUptime: 0,
        uptimePercent: 0,
      };
      const result = renderMetricValue(metricType, value);
      const screen = render(<>{result}</>);
      expect(screen.queryByTestId(`uptime-metric-${JSON.stringify(value)}`)).toBeInTheDocument();
    });
  });
});
