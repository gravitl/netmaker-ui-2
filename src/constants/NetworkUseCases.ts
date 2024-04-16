// in this file we set network use cases and minimums for each use case

import { NetworkUsecaseString } from '@/store/networkusecase';

export interface NetworkUsage {
  nodes?: number;
  remoteAccessGateways?: number;
  vpnClients?: number;
  egressGateways?: number;
  externalRanges?: number;
  users?: number;
  relays?: number;
  relayedHosts?: number;
}

export interface UsecaseAnswer {
  [key: string]: UsecaseQuestions[];
}

export type UsecaseQuestionKey =
  | 'primary_usecase'
  | 'usecase'
  | 'networks'
  | 'remote_access_gateways'
  | 'users'
  | 'hosts'
  | 'egress'
  | 'ranges';
export interface UsecaseQuestions {
  key: UsecaseQuestionKey;
  question: string;
  answers: string[];
  selectedAnswer?: string;
  type?: string;
  descriptionTitle?: string;
  description?: string;
}

interface UsecaseKeyStringToTextMap {
  [key: string]: string;
}

type NetworkUsecaseMap = {
  [key in NetworkUsecaseString]: NetworkUsage;
};

const remoteAccessMultipleUsers: NetworkUsage = {
  nodes: 1,
  remoteAccessGateways: 1,
  vpnClients: 1,
  // users: 2,
};

const egressToCloudVPC: NetworkUsage = {
  nodes: 1,
  egressGateways: 1,
  externalRanges: 1,
  // users: 0,
};

export const networkUsecaseMap: NetworkUsecaseMap = {
  remote_access_multiple_users: remoteAccessMultipleUsers,
  egress_to_cloud_vpc: egressToCloudVPC,
  // egress_to_office_lan_ips: egressToCloudVPC,
};

export const PrimaryUsecaseQuestions: UsecaseQuestions[] = [
  {
    key: 'primary_usecase',
    question: 'What are you trying to do?',
    answers: ['Remote Access'],
    selectedAnswer: 'Remote Access',
    type: 'radio',
    descriptionTitle: 'Welcome to Guided Tours',
    description:
      'We will guide you through the process of setting up your network. You can always skip this and set up your network manually.',
  },
  {
    key: 'usecase',
    question: 'What are you accessing?',
    answers: ['specific_machines', 'networks_lan_or_vpc'],
    type: 'radio',
    descriptionTitle: 'What are you trying to do?',
    description:
      'We will guide you through the process of setting up your network. You can always skip this and set up your network manually.',
  },
];

export const UsecaseQuestionsAll: UsecaseQuestions[] = [
  ...PrimaryUsecaseQuestions,
  {
    key: 'networks',
    question: 'What network will you like to use?',
    answers: [], // networks
    type: 'select',
    descriptionTitle: 'What are networks in Netmaker?',
    description: `A network is how your hosts and clients communicate. Each machine gets a private IP address within the
                  defined subnet and communicates securely with all the other devices in the network. The network is
                  your base layer.`,
  },
  {
    key: 'hosts',
    question: 'What host will you like to access?',
    answers: [], // hosts
    type: 'select',
    descriptionTitle: 'What are hosts in Netmaker?',
    description:
      'Hosts are devices that can be accessed on the network. You can add a host by specifying its IP address or hostname.',
  },
  {
    key: 'remote_access_gateways',
    question: 'What host will you like to use as the gateway?',
    answers: [], // hosts
    type: 'select',
    descriptionTitle: 'What are Remote Access Gateways?',
    description: `
        Remote Access Gateways enable secure access to your network via Clients. The Gateway forwards traffic
        from the clients into the network, and from the network back to the clients. Clients are simple
        WireGuard config files, supported on most devices. To use Clients, you must configure a Remote Access
        Gateway, which is typically deployed in a public cloud environment, e.g. on a server with a public IP,
        so that it is easily reachable from the Clients.
      `,
  },
  {
    key: 'users',
    question: 'Whats the primary way the users will be accessing the network?',
    answers: ['our_rac', 'vpn_client'],
    type: 'radio',
    descriptionTitle: 'Whats the primary way the users will be accessing the network?',
    description:
      'Our Remote Access Client (RAC) is a simple way for users to access the network. You can also use a VPN client',
  },
  {
    key: 'egress',
    question: 'What host will you like to use for the egress gateway?',
    answers: [],
    type: 'select',
    descriptionTitle: 'What is an Egress gateway in Netmaker?',
    description: `
      Enable devices in your network to communicate with other devices outside the network via egress
                gateways. An office network, home network, data center, or cloud region all become easily accessible via
                the Egress Gateway.
    `,
  },
  {
    key: 'ranges',
    question: 'Add the LAN, VPC or IP ranges you want to access',
    answers: [],
    type: 'ranges',
    descriptionTitle: 'What are the egress ranges in Netmaker?',
    description:
      'Egress ranges are the IP ranges that are allowed to leave the network. You can add an egress range to allow traffic to leave the network.',
  },
];

export const UsecaseKeyStringToTextMap: UsecaseKeyStringToTextMap = {
  primary_usecase: 'Primary Usecase',
  usecase: 'Usecase',
  networks: 'Networks',
  remote_access_gateways: 'Remote Access Gateways',
  users: 'Users',
  egress: 'Egress',
  specific_machines: 'Specific Machines',
  networks_lan_or_vpc: 'Networks (LAN or VPC)',
  our_rac: 'Our Remote Access Client',
  vpn_client: 'Wireguard VPN Config Files',
};
