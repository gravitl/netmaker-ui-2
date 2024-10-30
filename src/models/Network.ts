import { Modify } from '@/types/react-app-env';
import { ProSettings } from './ProSettings';

export interface Network {
  addressrange: string;
  addressrange6: string;
  netid: string;
  displayName: string;
  nodeslastmodified: number;
  networklastmodified: number;
  defaultinterface: string;
  defaultlistenport: number;
  nodelimit: number;
  defaultpostup: string;
  defaultpostdown: string;
  defaultkeepalive: number;
  isipv4: boolean;
  isipv6: boolean;
  localrange: string;
  defaultudpholepunch: boolean;
  defaultnatenabled: boolean;
  defaultextclientdns: string;
  defaultmtu: number;
  defaultacl: 'yes' | 'no';
  prosettings: ProSettings | undefined;
}

export type NetworkPayload = Modify<
  Network,
  {
    isipv4: 'no' | 'yes';
    isipv6: 'no' | 'yes';
    defaultudpholepunch: 'no' | 'yes';
  }
>;

export type NetworkStat = Network & { hosts: number };

export type NetworkStatPayload = NetworkPayload & { hosts: number };
