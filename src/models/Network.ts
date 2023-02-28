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
  // accesskeys: Array<AccessKey>;
  externalclients: Array<ExternalClient>;
  islocal: boolean;
  isipv4: boolean;
  isipv6: boolean;
  localrange: string;
  defaultudpholepunch: boolean;
  defaultnatenabled: boolean;
  defaultextclientdns: string;
  defaultmtu: number;
  defaultacl: boolean;
  prosettings: ProSettings | undefined;
}
