// in this file we set network use cases and minimums for each use case

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
  | 'ranges';
export interface UsecaseQuestions {
  key: UsecaseQuestionKey;
  question: string;
  answers: string[];
  selectedAnswer?: string;
  type?: string;
  descriptionTitle?: string;
  description?: string | ReactNode;
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
    descriptionTitle: 'Welcome to Guided Setup',
    description: `This opinionated setup process will help get your use case configured in as few steps as possible. 
      Currently, only remote access is offered. Use this to set up remote access to specific resources, sites, or the internet. 
      Estimated time to completion is 10 minutes.`,
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
      This can be alternativels referred to as a "virtual private network", "VPN", or "virtual subnet". 
      All machines added to Netmaker must be added to a network to enable communication with other devices
    `,
  },
  {
    key: 'hosts',
    question: 'Add hosts to your network',
    answers: [], // hosts
    type: 'select',
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
    key: 'remote_access_gateways',
    question: 'Select a host to use as your gateway',
    answers: [], // hosts
    type: 'select',
    descriptionTitle: 'Remote Access Gateways?',
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
          deployeed. For example, a VM running in your data center can be set as a host in Netmakre, and then configured
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
    descriptionTitle: 'Egress Ranges?',
    description: `An egress gateway can be configured to access one or more egress range. An egress range is simply an IP subnet range. 
      Ranges must be accessible from the device, and should not conflict with the VPN subnet range.`,
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
};

export const UsecaseKeyStringToTextMapForAnswers: UsecaseKeyStringToTextMap = {
  networks: 'network',
  hosts: 'host',
  remote_access_gateways: 'remote access gateway',
  egress: 'egress gateway',
};
