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
    description:
      'Networks are a collection of nodes that can communicate with each other. You can create a network for your office, home, or cloud VPC.',
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
    description:
      'Remote Access Gateways are hosts that allow you to access your network from anywhere. You can add a Remote Access Gateway by specifying its IP address or hostname.',
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
    question: 'What is the egress point for the network?',
    answers: [],
    type: 'select',
    descriptionTitle: 'What is an Egress in Netmaker?',
    description:
      'Egress is the point where traffic leaves the network. You can set up an egress point to allow traffic to leave the network.',
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
