import { Host } from '@/models/Host';
import { Network } from '@/models/Network';
import {
  deriveUrlWithoutQueryParams,
  getAmuiUrl,
  getHostRoute,
  getNetclientDownloadLink,
  getNetworkHostRoute,
  getNetworkRoute,
} from '@/utils/RouteUtils';

const testHost: Host = {
  id: 'test-host',
  verbosity: 0,
  firewallinuse: '',
  version: '',
  name: '',
  os: '',
  debug: false,
  isstatic: false,
  listenport: 0,
  localrange: '',
  locallistenport: 0,
  proxy_listen_port: 0,
  mtu: 0,
  interfaces: [],
  defaultinterface: '',
  endpointip: '',
  publickey: '',
  macaddress: '',
  internetgateway: '',
  nodes: [],
  proxy_enabled: false,
  isdefault: false,
  nat_type: '',
};

const testNetwork: Network = {
  netid: 'test-network',
  addressrange: '',
  addressrange6: '',
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

describe('RouteUtils', () => {
  it('determines the correct host route', () => {
    expect(getHostRoute(testHost)).toEqual('/hosts/test-host');
    expect(getHostRoute(testHost.id)).toEqual('/hosts/test-host');
    expect(getHostRoute(testHost.id, { edit: 'true' })).toEqual('/hosts/test-host?edit=true');
    expect(getHostRoute(testHost.id, { edit: 'true' }, { open: 'true' })).toEqual(
      '/hosts/test-host?edit=true&open=true'
    );
  });

  it('determines the correct network route', () => {
    expect(getNetworkRoute(testNetwork)).toEqual('/networks/test-network');
    expect(getNetworkRoute(testNetwork.netid)).toEqual('/networks/test-network');
  });

  it('determines the correct node route', () => {
    expect(getNetworkHostRoute(testHost, testNetwork)).toEqual('/networks/test-network/hosts/test-host');
    expect(getNetworkHostRoute(testHost, testNetwork.netid)).toEqual('/networks/test-network/hosts/test-host');
    expect(getNetworkHostRoute(testHost.id, testNetwork)).toEqual('/networks/test-network/hosts/test-host');
    expect(getNetworkHostRoute(testHost.id, testNetwork.netid)).toEqual('/networks/test-network/hosts/test-host');
  });

  it('determines AMUI URL', () => {
    // TODO: mock env vars

    let expected = '/dashboard?tenantId=&sToken=&action=';
    expect(getAmuiUrl()).toEqual(expected);

    expected = '/dashboard?tenantId=&sToken=&action=upgrade';
    expect(getAmuiUrl('upgrade')).toEqual(expected);
  });

  it('determines netclient download links', () => {
    // TODO: mock env vars
    expect(getNetclientDownloadLink('docker', 'amd64')).toEqual(['about:blank', '']);
  });

  it('returns url withour query params', () => {
    const testUrl = 'http://example.com';
    expect(deriveUrlWithoutQueryParams(testUrl)).toEqual(testUrl);
    expect(deriveUrlWithoutQueryParams(`${testUrl}?hello=world`)).toEqual(testUrl);
    expect(deriveUrlWithoutQueryParams(`${testUrl}?hello=world&foo=bar`)).toEqual(testUrl);
  });
});
