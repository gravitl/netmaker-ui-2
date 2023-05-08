import { ConfigProvider, notification, theme } from 'antd';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { useStore } from './store/store';
import './App.scss';
import { useCallback, useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import { ServerConfigService } from './services/ServerConfigService';
import ServerMalfunctionModal from './components/modals/server-malfunction-modal/ServerMalfunctionModal';
import { THEME_PRIMARY_COLOR } from './utils/ThemeUtils';

const POLL_INTERVAL = 10_000;

function App() {
  const store = useStore();

  const storeFetchServerConfig = store.fetchServerConfig;
  const storeSetServerStatus = store.setServerStatus;
  const storeFetchNodes = store.fetchNodes;
  const storeFetchHosts = store.fetchHosts;
  const storeIsLoggedIn = store.isLoggedIn;
  const [notify, notifyCtx] = notification.useNotification();
  const [serverMalfunctionCount, setServerMalfunctionCount] = useState(0);
  const [hasFetchedServerConfig, setHasFetchedServerConfig] = useState(false);

  const getUpdates = useCallback(async () => {
    try {
      const { data: serverStatus } = await ServerConfigService.getServerStatus();
      const isUnhealthy = serverStatus.db_connected === false || serverStatus.broker_connected === false;
      if (isUnhealthy) {
        // -1 means the modal is closed by user, 0 means the modal is open, 1 means the modal is open and the user has not acknowledged the error
        setServerMalfunctionCount((prev) => (prev === -1 ? -1 : 1));
      }
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
          const res = await storeFetchServerConfig();
          if (res) {
            () => setHasFetchedServerConfig(true);
          }
        }
      }
    }, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [getUpdates, hasFetchedServerConfig, storeFetchServerConfig, storeIsLoggedIn]);

  return (
    <div className="App">
      <ConfigProvider
        theme={{
          algorithm: store.currentTheme === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
          token: {
            colorPrimary: THEME_PRIMARY_COLOR,
            colorLink: THEME_PRIMARY_COLOR,
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
      <ServerMalfunctionModal isOpen={serverMalfunctionCount === 1} onCancel={() => setServerMalfunctionCount(-1)} />
    </div>
  );
}

export default App;
