// in this file we set network use cases and minimums for each use case

import { router } from '@/routes';
import { NetworkUsecaseString } from '@/store/networkusecase';
import { Typography } from 'antd';
import { ReactNode } from 'react';

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
  | 'ranges'
  | 'connect_to_site'
  | 'internet_gateway'
  | 'router'
  | 'netclient'
  | 'review'
  | 'gateway_users'
  | 'remote_access_gateways_with_ext_client';
export interface UsecaseQuestions {
  key: UsecaseQuestionKey;
  question: string;
  question2?: string;
  answers: string[];
  answers2?: string[];
  selectedAnswer?: string | string[];
  selectedAnswer2?: string | string[];
  type?: string;
  descriptionTitle?: string;
  description?: string | ReactNode;
  answer1Placeholder?: string;
  answer2Placeholder?: string;
  selectMode?: 'multiple' | 'tags';
  secondSelectMode?: 'multiple' | 'tags';
  subDescription?: string[] | ReactNode[];
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
    answers: ['remote_access', 'internet_gateway', 'connect_to_site'],
    // selectedAnswer: 'Remote Access',
    type: 'radio',
    descriptionTitle: 'Welcome to Guided Setup',
    description: `This opinionated setup process will help get your use case configured in as few steps as possible. 
      Use this to set up remote access to specific resources, sites, or the internet. 
      Estimated time to completion is 10 minutes.`,
    subDescription: [
      'Remote Access scenarios typically involve configuring access to resources at a remote site (office, cloud, data center)',
      'Internet Gateway scenarios typically involve configuring access to the internet from a private network',
      'Connect a Site scenarios typically involve configuring access to a specific network or subnet',
    ],
  },
  {
    key: 'usecase',
    question: 'What are you accessing?',
    answers: ['specific_machines', 'networks_lan_or_vpc'],
    type: 'radio',
    descriptionTitle: 'Remote Access',
    description: `Remote Access scenarios typically involve configuring access to resources at a remote site (office, cloud, data center). 
    This guide will have you set up a remote access gateway, which grants access to the resources, and endpoints at the remote destination.
    `,
    subDescription: [
      'Specific Machines scenarios typically involve configuring access to specific machines or endpoints',
      'Networks (LAN, VPC, Internet) scenarios typically involve configuring access to a network or subnet',
    ],
  },
];

export const UsecaseQuestionsAll: UsecaseQuestions[] = [
  ...PrimaryUsecaseQuestions,
  {
    key: 'networks',
    question: 'What network would you like to use?',
    answers: [], // networks
    type: 'select',
    descriptionTitle: 'Networks in Netmaker',
    description: `Networks enable your machines to communicate securely. 
      Every machine added to a network gets a private IP address inside of the defined subnet. 
      This can be alternatively referred to as a "virtual private network", "VPN", or "virtual subnet". 
      All machines added to Netmaker must be added to a network to enable communication with other devices
    `,
  },
  {
    key: 'remote_access_gateways',
    question: 'Select a host to use as your gateway',
    answers: [], // hosts
    type: 'select',
    descriptionTitle: 'Remote Access Gateways',
    description: `
      Remote Access Gateways act as a bridge to your virtual network. 
      They enable secure access to network resources from devices like laptops, phones, and routers.
    `,
  },
  {
    key: 'users',
    question: 'How would you like to grant access to the network?',
    answers: ['our_rac', 'vpn_client'],
    type: 'radio',
    descriptionTitle: 'Remote Access Client and WireGuard Client',
    description: (
      <>
        Gateway access can be granted via two channels:
        <ol style={{ marginTop: '1rem' }}>
          <li>
            Users can be granted access to the gateway, and then connect by downloading and logging into the Remote
            Access Client. This is the recommended method for granting access to your users from their laptops and
            phones.
          </li>
          <li>
            WireGuard config files can be generated for the gateway and applied to any device that supports WireGuard.
            This is the recommended approach method for granting access from Routers, IoT devices, and for special use
            cases that require advanced configuration on the machine.
          </li>
        </ol>
      </>
    ),
  },
  {
    key: 'egress',
    question: 'Select a host to act as your egress gateway',
    answers: [],
    type: 'select',
    descriptionTitle: 'Egress Gateway',
    description: (
      <>
        <Typography.Paragraph className="guided-tour-text">
          Egress Gateways act as a bridge to target networks, external to the VPN. Other machines in your network, and
          those using the remote access gateway, will reach the target network via the egress gateway. A target network
          could be an office LAN, a home ntework, a subnet in a data center, or a cloud VPC.
        </Typography.Paragraph>
        <Typography.Paragraph className="guided-tour-text">
          Linux-based hosts added to your network can act as egress gateways to local environments in which they are
          deployed. For example, a VM running in your data center can be set as a host in Netmaker, and then configured
          as an egress gateway to a data center subnet.
        </Typography.Paragraph>
      </>
    ),
  },
  {
    key: 'ranges',
    question: 'Add the IP ranges you want to access',
    answers: [],
    type: 'ranges',
    descriptionTitle: 'Egress Ranges',
    description: `An egress gateway can be configured to access one or more egress range. An egress range is simply an IP subnet range. 
      Ranges must be accessible from the device, and should not conflict with the VPN subnet range.`,
  },
  {
    key: 'hosts',
    question: 'Add target machines(hosts) to your network',
    answers: [], // hosts
    type: 'host_select',
    descriptionTitle: 'What are hosts in Netmaker?',
    description: (
      <>
        <Typography.Paragraph className="guided-tour-text">
          {` Hosts can acts as gateways and endpoints in your network. For the remote access use case, you will need at least one host,
        deployed in a public environment, to act as the gateway. If deploying on-prem, you can use the existing "server" host.
        If deploying from our SaaS, you can use your managed endpoint. Otherwise, please deploy at least one additional endpoint in a public environment
        (e.g. cloud) with a public IP."
  `}
        </Typography.Paragraph>
        <Typography.Paragraph className="guided-tour-text">
          {`
            At least one host should also be deployed in the target environment for remote access, e.g. the office, data center, or edge environment.
            If accessing specific endpoints, deploy one host per endpoint. If you would like to access a LAN or other subnet (or the internet),
            you can deploy just one host which has access to the target range, and later, we will set it as a gateway to the target network.
        `}
        </Typography.Paragraph>
      </>
    ),
  },
  {
    key: 'gateway_users',
    question: 'Add users to the gateway',
    answers: [],
    type: 'select',
    selectMode: 'multiple',
    descriptionTitle: 'Add Users to the Gateway',
    description: `Users can be added to the gateway to grant them access to the network. `,
    selectedAnswer: undefined,
  },
  {
    key: 'connect_to_site',
    question: 'Connect via router or route through Netclient',
    answers: ['router', 'route_via_netclient'],
    type: 'radio',
    descriptionTitle: 'Connect to a Site',
    description: '',
    subDescription: [
      'Connect via router: If you have a router that supports WireGuard, you can add the configuration here. This will allow all devices on your network to connect to the VPN.',
      'Route via Netclient: If you have a device that supports WireGuard, you can setup netclient on the device. This will allow the device to connect to the VPN.',
    ],
  },
  {
    key: 'internet_gateway',
    question: 'Select a host to act as your internet gateway',
    question2: 'Select a hosts to route traffic through the internet gateway',
    answers: [],
    answers2: [],
    type: 'double_select',
    descriptionTitle: 'Internet Gateway',
    description: `Internet Gateways allow Netmaker to work like a normal VPN. A gateway forwards traffic from the connected hosts to the internet and vice versa. Internet gateways can help you hide your true IP address and bypass geo-restrictions.`,
    answer1Placeholder: 'Select a host to act as your internet gateway',
    answer2Placeholder: 'Select a host to route traffic through the internet gateway',
    secondSelectMode: 'multiple',
  },
  {
    key: 'router',
    question: 'Router Configuration',
    answers: [],
    type: 'double_select',
    descriptionTitle: 'Gateway Host',
    description: `If you have a router that supports WireGuard, you can add the configuration here. 
      This will allow all devices on your network to connect to the VPN.`,
    question2: 'Add additional addresses to route through the router',
    answer1Placeholder: 'Select a host to act as the gateway to the network for the router',
    answer2Placeholder: 'Specify the local LAN address behind the router',
    secondSelectMode: 'tags',
  },
  {
    key: 'netclient',
    question: 'Netclient Configuration',
    answers: [],
    type: 'select',
    descriptionTitle: 'Netclient Configuration',
    description: `If you have a device that supports WireGuard, you can setup netclient on the device. 
      This will allow the device to connect to the VPN.`,
  },
  {
    key: 'review',
    descriptionTitle: 'Review',
    description: `Once you've reviewed your configuration, click "Finish" to proceed with the tour and see your newly created setup.`,
    question: 'Check what was created',
    answers: ['Review'],
    type: 'review',
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
  networks_lan_or_vpc: 'Networks (LAN, VPC, Internet)',
  our_rac: 'Our Remote Access Client',
  vpn_client: 'Wireguard VPN Config Files',
  remote_access: 'Remote Access',
  internet_gateway: 'Internet Gateway',
  connect_to_site: 'Connect a Site (e.g. VPC, Office Network)',
  router: 'Connect via router',
  route_via_netclient: 'Route via Netclient',
};

export const UsecaseKeyStringToTextMapForAnswers: UsecaseKeyStringToTextMap = {
  networks: 'network',
  hosts: 'host',
  remote_access_gateways: 'remote access gateway',
  egress: 'egress gateway',
  internet_gateway: 'internet gateway',
  router: 'host',
  gateway_users: 'user',
};

export const UsecaseKeyStringToTextMapForReview: UsecaseKeyStringToTextMap = {
  primary_usecase: 'Your primary usecase?',
  usecase: 'Your remote access usecase?',
  networks: 'Selected Network',
  remote_access_gateways: 'Your remote access gateway?',
  users: 'The primary way your users will connect?',
  egress: 'Your egress gateway?',
  ranges: 'Your egress ranges?',
  connect_to_site: 'Your connection method?',
  router: 'Your remote access gateway?',
  router_2: 'Your local LAN addresses behind the router',
  netclient: 'Your selected device',
  hosts: 'Hosts added to the network',
  internet_gateway: 'Your internet gateway?',
  internet_gateway_2: 'Your internet clients?',
  gateway_users: 'Users added to the gateway',
};
