import { Network } from '@/models/Network';
import {
  convertNetworkPayloadToUiNetwork,
  convertUiNetworkToNetworkPayload,
  isValidIp,
  isValidIpCidr,
  truncateIpFromCidr,
} from '@/utils/NetworkUtils';

const network: Network = {
  netid: 'test',
  addressrange: '1.2.3.4/24',
  addressrange6: 'a123:09ef::/8',
  defaultacl: 'no',
  defaultextclientdns: '',
  defaultinterface: '',
  defaultkeepalive: 1234,
  defaultlistenport: 1234,
  defaultmtu: 1234,
  defaultnatenabled: true,
  defaultpostdown: '',
  defaultpostup: '',
  defaultudpholepunch: true,
  isipv4: true,
  isipv6: true,
  localrange: '1.2.3.4/24',
  networklastmodified: 0,
  nodelimit: 1,
  nodeslastmodified: 0,
  prosettings: undefined,
};

describe('NetworkUtils', () => {
  it('converts ui network model to network payload and vice-versa', () => {
    const testPayload = convertUiNetworkToNetworkPayload(network);
    expect(testPayload).toStrictEqual({
      ...network,
      defaultmtu: Number(network.defaultmtu),
      defaultlistenport: Number(network.defaultlistenport),
      defaultkeepalive: Number(network.defaultkeepalive),
      isipv4: network.isipv4 ? 'yes' : 'no',
      isipv6: network.isipv6 ? 'yes' : 'no',
      defaultudpholepunch: network.defaultudpholepunch ? 'yes' : 'no',
      prosettings: undefined,
    });

    const testNetwork = convertNetworkPayloadToUiNetwork(testPayload);
    expect(testNetwork).toStrictEqual({
      ...testPayload,
      defaultmtu: Number(testPayload.defaultmtu),
      defaultlistenport: Number(testPayload.defaultlistenport),
      defaultkeepalive: Number(testPayload.defaultkeepalive),
      isipv4: testPayload.isipv4 === 'yes',
      isipv6: testPayload.isipv6 === 'yes',
      defaultudpholepunch: testPayload.defaultudpholepunch === 'yes',
      prosettings: undefined,
    });
  });

  it('truncates IP from CIDR', () => {
    const cidr4 = '1.2.3.4/24';
    const cidr6 = 'a123:012d::/24';

    expect(truncateIpFromCidr(cidr4)).toEqual('1.2.3.4');
    expect(truncateIpFromCidr(cidr6)).toEqual('a123:012d::');
  });

  it('correctly verifies an ip address and cidr', () => {
    const invalidIpv4 = '256.0.0.0';
    const invalidIpv4Cidr = '910.0.0.0/8';
    const validIpv4Cidr = '10.0.0.0/8';
    const validIpv4 = '10.0.0.0';
    const invalidIpv6 = 'z123:a2bf::';
    const invalidIpv6Cidr = 'z123:12bf::/16';
    const validIpv6Cidr = 'a123:12bf::/16';
    const validIpv6 = 'a123:12bf::';

    expect(isValidIp(invalidIpv4)).toEqual(false);
    expect(isValidIp(invalidIpv4Cidr)).toEqual(false);
    expect(isValidIp(validIpv4)).toEqual(true);
    // TODO: fix test cases
    // expect(isValidIp(invalidIpv6)).toEqual(false);
    // expect(isValidIp(invalidIpv6Cidr)).toEqual(false);
    expect(isValidIp(validIpv6)).toEqual(true);
    expect(isValidIpCidr(invalidIpv4Cidr)).toEqual(false);
    expect(isValidIpCidr(invalidIpv6Cidr)).toEqual(false);
    expect(isValidIpCidr(validIpv4Cidr)).toEqual(true);
    expect(isValidIpCidr(validIpv6Cidr)).toEqual(true);
  });
});
