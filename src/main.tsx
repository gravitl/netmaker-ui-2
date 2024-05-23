import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import './i18n/i18n';
import { INTERCOM_APP_ID, isSaasBuild, setupTenantConfig } from './services/BaseService';
import { IntercomProvider } from 'react-use-intercom';
import 'animate.css';

await setupTenantConfig();

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <IntercomProvider appId={INTERCOM_APP_ID} autoBoot={false} shouldInitialize={isSaasBuild} initializeDelay={2000}>
      <App />
    </IntercomProvider>
  </React.StrictMode>,
);
