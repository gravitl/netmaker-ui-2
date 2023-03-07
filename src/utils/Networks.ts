import { Network } from '@/models/Network';

export function isNetworkIpv4(network: Network): boolean {
  return network.isipv4 === 'yes';
}

export function isNetworkIpv6(network: Network): boolean {
  return network.isipv6 === 'yes';
}

export function convertUiNetworkToNetworkModel(network: Network): Network {
  return {
    ...network,
    isipv4: isNetworkIpv4(network) ? 'yes' : 'no',
    isipv6: isNetworkIpv6(network) ? 'yes' : 'no',
  };
}
