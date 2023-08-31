import { ConfigProvider, theme } from 'antd';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { useStore } from './store/store';
import './App.scss';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AxiosError } from 'axios';
import { ServerConfigService } from './services/ServerConfigService';
import ServerMalfunctionModal from './components/modals/server-malfunction-modal/ServerMalfunctionModal';
import { getBrandingConfig } from './services/BaseService';
import { APP_UPDATE_POLL_INTERVAL } from './constants/AppConstants';
import { useIntercom } from 'react-use-intercom';
import { IntercomTiers } from './models/ServerConfig';

function App() {
  const store = useStore();
  const {
    boot: intercomBoot,
    shutdown: intercomShutdown,
    // startTour: intercomStartTour
  } = useIntercom();

  const isServerEE = store.serverConfig?.IsEE === 'yes';
  const storeFetchServerConfig = store.fetchServerConfig;
  const storeSetServerStatus = store.setServerStatus;
  const storeFetchNodes = store.fetchNodes;
  const storeFetchHosts = store.fetchHosts;
  const storeIsLoggedIn = store.isLoggedIn;
  const [hasFetchedServerConfig, setHasFetchedServerConfig] = useState(false);

  const isIntercomReady = useMemo(() => {
    // TODO: add other params like tenant/server and user data loaded
    return storeIsLoggedIn();
  }, [storeIsLoggedIn]);

  const getUpdates = useCallback(async () => {
    try {
      const { data: serverStatus } = await ServerConfigService.getServerStatus();
      storeSetServerStatus({ ...serverStatus, healthyNetwork: true });
      if (storeIsLoggedIn()) {
        storeFetchHosts();
        storeFetchNodes();
      }
    } catch (err) {
      if (err instanceof AxiosError) {
        if (err.response) {
          // non-2xx res
          storeSetServerStatus({
            db_connected: store.serverStatus?.status?.db_connected || false,
            broker_connected: store.serverStatus?.status?.broker_connected || false,
            license_error: store.serverStatus?.status?.license_error || '',
            healthyNetwork: true,
          });
        } else if (err.request) {
          // requst was made but no response was received
          storeSetServerStatus({
            db_connected: store.serverStatus?.status?.db_connected || false,
            broker_connected: store.serverStatus?.status?.broker_connected || false,
            license_error: store.serverStatus?.status?.license_error || '',
            healthyNetwork: false,
          });
        } else {
          // something bad happened when th request was being made
          storeSetServerStatus({
            db_connected: store.serverStatus?.status?.db_connected || false,
            broker_connected: store.serverStatus?.status?.broker_connected || false,
            license_error: store.serverStatus?.status?.license_error || '',
            healthyNetwork: false,
          });
        }
      } else {
        storeSetServerStatus({
          db_connected: false,
          broker_connected: false,
          license_error: '',
          healthyNetwork: false,
        });
      }
    }
  }, [
    store.serverStatus?.status?.broker_connected,
    store.serverStatus?.status?.db_connected,
    store.serverStatus?.status?.license_error,
    storeFetchHosts,
    storeFetchNodes,
    storeIsLoggedIn,
    storeSetServerStatus,
  ]);

  useEffect(() => {
    getUpdates();
    const id = setInterval(async () => {
      getUpdates();
      if (storeIsLoggedIn() && !hasFetchedServerConfig) {
        const hasFetched = await storeFetchServerConfig();
        if (hasFetched) {
          setHasFetchedServerConfig(true);
        }
      }
    }, APP_UPDATE_POLL_INTERVAL);
    return () => clearInterval(id);
  }, [getUpdates, hasFetchedServerConfig, storeFetchServerConfig, storeIsLoggedIn]);

  useEffect(() => {
    if (isIntercomReady) {
      intercomBoot({
        userId: `${store.amuiUserId}_${store.tenantId}`,
      });
    }
    return () => {
      intercomShutdown();
    };
  }, [intercomBoot, intercomShutdown, isIntercomReady, isServerEE, store.tenantId, store.username]);

  useEffect(
    () => {
      // set server status to healthy initially
      storeSetServerStatus({
        db_connected: true,
        broker_connected: true,
        license_error: '',
        healthyNetwork: true,
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
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

      <ServerMalfunctionModal isOpen={!store.serverStatus.isHealthy} />
    </div>
  );
}

export default App;
