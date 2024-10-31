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
  },
  tags: {},
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
    expect(screen.getByText(/Warning/)).toBeInTheDocument();
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
    const min0 = 0;
    const min1 = 1;
    const hour1 = 60 * min1;
    const hour1min30 = 60 * min1 + 30 * min1;
    const day1 = 24 * hour1;

    expect(getFormattedTime(min0)).toEqual('0 hrs 0 mins');
    expect(getFormattedTime(min1)).toEqual('0 hrs 1 mins');
    expect(getFormattedTime(hour1)).toEqual('1 hrs 0 mins');
    expect(getFormattedTime(hour1min30)).toEqual('1 hrs 30 mins');
    expect(getFormattedTime(day1)).toEqual('24 hrs 0 mins');
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
        totaltime: 0,
      };
      const result = renderMetricValue(metricType, value);
      const screen = render(<>{result}</>);
      expect(screen.queryByTestId(`uptime-metric-${JSON.stringify(value)}`)).toBeInTheDocument();
    });
  });
});
