import { ConfigProvider, notification, theme } from 'antd';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { useStore } from './store/store';
import './App.scss';
import { useCallback, useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import { ServerConfigService } from './services/ServerConfigService';
import ServerMalfunctionModal from './components/modals/server-malfunction-modal/ServerMalfunctionModal';
import { getBrandingConfig } from './services/BaseService';

const POLL_INTERVAL = 10_000;

function App() {
  const store = useStore();

  const storeFetchServerConfig = store.fetchServerConfig;
  const storeSetServerStatus = store.setServerStatus;
  const storeFetchNodes = store.fetchNodes;
  const storeFetchHosts = store.fetchHosts;
  const storeIsLoggedIn = store.isLoggedIn;
  const [notify, notifyCtx] = notification.useNotification();
  const [hasFetchedServerConfig, setHasFetchedServerConfig] = useState(false);

  const getUpdates = useCallback(async () => {
    try {
      const { data: serverStatus } = await ServerConfigService.getServerStatus();
      storeSetServerStatus({ ...serverStatus, healthyNetwork: true });
      storeFetchHosts();
      storeFetchNodes();
    } catch (err) {
      if (err instanceof AxiosError) {
        // notify.error({ message: 'Failed to connect to your server', description: (err as AxiosError).message });
        storeSetServerStatus({ db_connected: false, broker_connected: false, healthyNetwork: true });
      } else {
        storeSetServerStatus({ db_connected: false, broker_connected: false, healthyNetwork: false });
      }
    }
  }, [storeFetchHosts, storeFetchNodes, storeSetServerStatus]);

  useEffect(() => {
    const id = setInterval(async () => {
      if (storeIsLoggedIn()) {
        getUpdates();

        if (!hasFetchedServerConfig) {
          const hasFetched = await storeFetchServerConfig();
          if (hasFetched) {
            setHasFetchedServerConfig(true);
          }
        }
      }
    }, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [getUpdates, hasFetchedServerConfig, storeFetchServerConfig, storeIsLoggedIn]);

  useEffect(
    () => {
      // set server status to healthy initially
      storeSetServerStatus({ db_connected: true, broker_connected: true, healthyNetwork: true });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    // one-time effect to load favicon
    const favicon = getBrandingConfig().favicon;
    if (favicon) {
      (document.getElementById('favicon') as HTMLLinkElement)?.setAttribute('href', favicon);
    }
  }, []);

  return (
    <div className="App">
      <ConfigProvider
        theme={{
          algorithm: store.currentTheme === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
          token: {
            colorPrimary: getBrandingConfig().primaryColor,
            colorLink: getBrandingConfig().primaryColor,
            fontFamily: 'SFPro, Inter, system-ui, Avenir, Helvetica, Arial, sans-serif',
            fontSize: 16,
            // colorBgContainer: 'black',
          },
        }}
      >
        <RouterProvider router={router} />
      </ConfigProvider>

      {/* misc */}
      {notifyCtx}
      <ServerMalfunctionModal isOpen={!store.serverStatus.isHealthy} />
    </div>
  );
}

export default App;
