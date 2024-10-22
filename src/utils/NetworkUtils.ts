import { Network, NetworkPayload } from '@/models/Network';

const convertStringToArray = (commaSeparatedData: string) => {
  const data = commaSeparatedData.split(',');
  for (let i = 0; i < data.length; i++) {
    data[i] = data[i].trim();
  }
  return data;
};

export function convertUiNetworkToNetworkPayload(network: Network): NetworkPayload {
  if (network.prosettings) {
    if (typeof network.prosettings.allowedgroups === 'string') {
      network.prosettings.allowedgroups = convertStringToArray(network.prosettings.allowedgroups);
    }
    if (typeof network.prosettings.allowedusers === 'string') {
      network.prosettings.allowedusers = convertStringToArray(network.prosettings.allowedusers);
    }
  }
  return {
    ...network,
    defaultmtu: Number(network.defaultmtu),
    defaultlistenport: Number(network.defaultlistenport),
    defaultkeepalive: Number(network.defaultkeepalive),
    isipv4: network.isipv4 ? 'yes' : 'no',
    isipv6: network.isipv6 ? 'yes' : 'no',
    defaultudpholepunch: network.defaultudpholepunch ? 'yes' : 'no',
    prosettings: network.prosettings
      ? {
          defaultaccesslevel: Number(network.prosettings.defaultaccesslevel),
          defaultuserclientlimit: Number(network.prosettings.defaultuserclientlimit),
          defaultusernodelimit: Number(network.prosettings.defaultusernodelimit),
          allowedgroups: network.prosettings.allowedgroups,
          allowedusers: network.prosettings.allowedusers,
        }
      : undefined,
  };
}

export function convertNetworkPayloadToUiNetwork(network: NetworkPayload): Network {
  return {
    ...network,
    displayName: network.netid.replace(/-+/g, ' '),
    defaultmtu: Number(network.defaultmtu),
    defaultlistenport: Number(network.defaultlistenport),
    defaultkeepalive: Number(network.defaultkeepalive),
    isipv4: network.isipv4 === 'yes',
    isipv6: network.isipv6 === 'yes',
    defaultudpholepunch: network.defaultudpholepunch === 'yes',
    prosettings: network.prosettings
      ? {
          defaultaccesslevel: Number(network.prosettings.defaultaccesslevel),
          defaultuserclientlimit: Number(network.prosettings.defaultuserclientlimit),
          defaultusernodelimit: Number(network.prosettings.defaultusernodelimit),
          allowedgroups: network.prosettings.allowedgroups,
          allowedusers: network.prosettings.allowedusers,
        }
      : undefined,
  };
}

export function truncateIpFromCidr(ip: string): string {
  return ip.split('/')[0];
}

export function isValidIpv4(addr: string): boolean {
  const ipv4AddressRegex = new RegExp(
    /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/i,
  );
  return ipv4AddressRegex.test(addr);
}

export function isValidIpv4Cidr(cidr: string): boolean {
  const ipv4CidrRegex = new RegExp(
    /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\/\d{1,2}$/i,
  );
  return ipv4CidrRegex.test(cidr);
}

export function isValidIpv6(addr: string): boolean {
  const ipv6AddressRegex = new RegExp(
    /(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))/,
  );
  return ipv6AddressRegex.test(addr);
}

export function isValidIpv6Cidr(cidr: string): boolean {
  const correctIpv6CidrRegex = new RegExp(
    /^s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]d|1dd|[1-9]?d)(.(25[0-5]|2[0-4]d|1dd|[1-9]?d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]d|1dd|[1-9]?d)(.(25[0-5]|2[0-4]d|1dd|[1-9]?d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]d|1dd|[1-9]?d)(.(25[0-5]|2[0-4]d|1dd|[1-9]?d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]d|1dd|[1-9]?d)(.(25[0-5]|2[0-4]d|1dd|[1-9]?d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]d|1dd|[1-9]?d)(.(25[0-5]|2[0-4]d|1dd|[1-9]?d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]d|1dd|[1-9]?d)(.(25[0-5]|2[0-4]d|1dd|[1-9]?d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]d|1dd|[1-9]?d)(.(25[0-5]|2[0-4]d|1dd|[1-9]?d)){3}))|:)))(%.+)?s*(\/([0-9]|[1-9][0-9]|1[0-1][0-9]|12[0-8]))$/i,
  );
  return correctIpv6CidrRegex.test(cidr);
}

export function isValidIp(addr: string): boolean {
  return isValidIpv4(addr) || isValidIpv6(addr);
}

export function isValidIpCidr(cidr: string): boolean {
  return isValidIpv4Cidr(cidr) || isValidIpv6Cidr(cidr);
}

export function isValidIpv4OrCidr(addr: string): boolean {
  return isValidIpv4(addr) || isValidIpv4Cidr(addr);
}

export function isValidIpv6OrCidr(addr: string): boolean {
  return isValidIpv6(addr) || isValidIpv6Cidr(addr);
}

export function generateRandomNumber(size: number, inclusive: boolean) {
  if (inclusive) {
    return Math.floor(Math.random() * size + 1);
  }
  return Math.floor(Math.random() * size);
}

function generateRandomHex(size: number) {
  const result = [];
  const hexRef = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'];

  for (let n = 0; n < size; n++) {
    result.push(hexRef[Math.floor(Math.random() * 16)]);
  }
  return result.join('');
}

export function generateCgnatCIDR() {
  return `100.64.${generateRandomNumber(254, true)}.0/24`;
}

export function generateCgnatCIDR6() {
  return `fd3c:${generateRandomHex(4)}:${generateRandomHex(4)}:${generateRandomHex(4)}::/64`;
}

export function generateCIDR() {
  return `10.${generateRandomNumber(254, true)}.${generateRandomNumber(254, true)}.0/24`;
}

export const generateCIDR6 = () => `fc00:${generateRandomHex(4)}:${generateRandomHex(4)}:${generateRandomHex(4)}::/64`;

export function generateNetworkName() {
  const validNetworkNames = [
    'network',
    'netty',
    'dev',
    'dev-net',
    'office',
    'office-vpn',
    'netmaker-vpn',
    'securoserv',
    'quick',
    'long',
    'lite',
    'inet',
    'vnet',
    'mesh',
    'site',
    'lan-party',
    'skynet',
    'short',
    'private',
    'my-net',
    'it-dept',
    'test-net',
    'kube-net',
    'mynet',
    'wg-net',
    'wireguard-1',
    'mesh-vpn',
    'mesh-virt',
    'virt-net',
    'wg-vnet',
  ];
  return validNetworkNames[generateRandomNumber(validNetworkNames.length, false)];
}

/**
 * Checks if the given IP range is a private or not, based on the RFC 1918 standard (Classful Private Address Space).
 *
 * @param ipCidr IP Address CIDR to check
 * @returns whether the IP is a private IP or not
 */
export function isPrivateIpCidr(ipCidr: string): boolean {
  const ip = truncateIpFromCidr(ipCidr).toLowerCase();
  if (isValidIpv4(ip)) {
    const parts = ip.split('.');
    return (
      parts[0] === '10' ||
      (parts[0] === '172' && parseInt(parts[1], 10) >= 16 && parseInt(parts[1], 10) <= 31) ||
      (parts[0] === '192' && parts[1] === '168')
    );
  } else if (isValidIpv6(ip)) {
    return ip.startsWith('fc00');
  }
  return false;
}
