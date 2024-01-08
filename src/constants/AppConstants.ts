import { BrandingConfig } from '@/models/BrandingConfig';

export const DATE_TIME_FORMAT = 'Do MMMM YYYY @ HH:mm';

export const NODE_EXP_TIME_FORMAT = 'YYYY-MM-DD HH:mm';

export const DEFAULT_BRANDING_CONFIG: BrandingConfig = {
  productName: 'Netmaker',
  logoDarkUrl: '/logo-dark.png',
  logoLightUrl: '/logo-light.png',
  logoDarkSmallUrl: '/logo-small-dark.png',
  logoLightSmallUrl: '/logo-small-light.png',
  logoAltText: 'Netmaker logo',
  favicon: '/favicon.ico',
  primaryColor: '#624AF4',
};

export const BUG_REPORT_URL = `https://github.com/gravitl/netmaker-ui-2/issues/new?title=${encodeURIComponent(
  'UI Bug Report',
)}&body=:body`;

export const NETWORK_GRAPH_SIGMA_CONTAINER_ID = 'network-graph-sigma-contaner';

export const METRIC_LATENCY_DANGER_THRESHOLD = 500;
export const METRIC_LATENCY_WARNING_THRESHOLD = 300;

export const APP_UPDATE_POLL_INTERVAL = 10_000;

export const INTERNET_RANGE_IPV4 = '0.0.0.0/0';
export const INTERNET_RANGE_IPV6 = '::/0';

export const PUBLIC_DNS_RESOLVERS = [
  { label: 'Google DNS (8.8.8.8)', value: '8.8.8.8' },
  { label: 'Cloudflare DNS (1.1.1.1)', value: '1.1.1.1' },
  { label: 'Quad9 DNS (9.9.9.9)', value: '9.9.9.9' },
];
