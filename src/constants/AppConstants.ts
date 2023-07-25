import { BrandingConfig } from '@/models/BrandingConfig';

export const DATE_TIME_FORMAT = 'Do MMMM YYYY @ HH:mm';

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
  'UI Bug Report'
)}&body=:body`;
