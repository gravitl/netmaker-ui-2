import { AccessKey } from './AccessKey';
import { ExternalClient } from './ExternalClient';
import { ProSettings } from './ProSettings';

export interface Network {
  addressrange: string;
  addressrange6: string;
  netid: string;
  nodeslastmodified: number;
  networklastmodified: number;
  defaultinterface: string;
  defaultlistenport: number;
  nodelimit: number;
  defaultpostup: string;
  defaultpostdown: string;
  defaultkeepalive: number;
  accesskeys: AccessKey[];
  externalclients: Array<ExternalClient>;
  islocal: 'yes' | 'no';
  isipv4: 'yes' | 'no';
  isipv6: 'yes' | 'no';
  localrange: string;
  defaultudpholepunch: 'yes' | 'no';
  defaultnatenabled: boolean;
  defaultextclientdns: string;
  defaultmtu: number;
  defaultacl: 'yes' | 'no';
  prosettings: ProSettings | undefined;
}
