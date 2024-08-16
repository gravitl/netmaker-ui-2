import { ConfigProvider, theme } from 'antd';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { BrowserStore, useStore } from './store/store';
import './App.scss';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AxiosError } from 'axios';
import { ServerConfigService, getUiVersion } from './services/ServerConfigService';
import ServerMalfunctionModal from './components/modals/server-malfunction-modal/ServerMalfunctionModal';
import { useBranding, useServerLicense } from './utils/Utils';
import { isSaasBuild } from './services/BaseService';
import { APP_UPDATE_POLL_INTERVAL } from './constants/AppConstants';
import { useIntercom } from 'react-use-intercom';
import { reloadNmuiWithVersion } from './utils/RouteUtils';
import { usePostHog } from 'posthog-js/react';

function App() {
  const store = useStore();
  const {
    boot: intercomBoot,
    shutdown: intercomShutdown,
    // startTour: intercomStartTour
  } = useIntercom();
  const posthog = usePostHog();

  const branding = useBranding();
  const { isServerEE } = useServerLicense();
  const storeFetchServerConfig = store.fetchServerConfig;
  const storeSetServerStatus = store.setServerStatus;
  const storeFetchNodes = store.fetchNodes;
  const storeFetchHosts = store.fetchHosts;
  const storeIsLoggedIn = store.isLoggedIn;

  const [hasFetchedServerConfig, setHasFetchedServerConfig] = useState(false);
  const [isAppReady, setIsAppReady] = useState(false);
  const [showServerMalfunctionModal, setShowServerMalfunctionModal] = useState(false);

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
            is_pro: store.serverStatus?.status?.is_pro ?? false,
            trial_end_date: store.serverStatus?.status?.trial_end_date ?? '',
            is_on_trial_license: store.serverStatus?.status?.is_on_trial_license ?? false,
          });
        } else if (err.request) {
          // request was made but no response was received
          storeSetServerStatus({
            db_connected: store.serverStatus?.status?.db_connected || false,
            broker_connected: store.serverStatus?.status?.broker_connected || false,
            license_error: store.serverStatus?.status?.license_error || '',
            healthyNetwork: false,
            is_pro: store.serverStatus?.status?.is_pro ?? false,
            trial_end_date: store.serverStatus?.status?.trial_end_date ?? '',
            is_on_trial_license: store.serverStatus?.status?.is_on_trial_license ?? false,
          });
        } else {
          // something bad happened when the request was being made
          storeSetServerStatus({
            db_connected: store.serverStatus?.status?.db_connected || false,
            broker_connected: store.serverStatus?.status?.broker_connected || false,
            license_error: store.serverStatus?.status?.license_error || '',
            healthyNetwork: false,
            is_pro: store.serverStatus?.status?.is_pro ?? false,
            trial_end_date: store.serverStatus?.status?.trial_end_date ?? '',
            is_on_trial_license: store.serverStatus?.status?.is_on_trial_license ?? false,
          });
        }
      } else {
        storeSetServerStatus({
          db_connected: false,
          broker_connected: false,
          license_error: '',
          healthyNetwork: false,
          is_pro: store.serverStatus?.status?.is_pro ?? false,
          trial_end_date: store.serverStatus?.status?.trial_end_date ?? '',
          is_on_trial_license: store.serverStatus?.status?.is_on_trial_license ?? false,
        });
      }
    }
  }, [
    store.serverStatus?.status?.broker_connected,
    store.serverStatus?.status?.db_connected,
    store.serverStatus?.status?.license_error,
    store.serverStatus?.status?.is_pro,
    store.serverStatus?.status?.trial_end_date,
    store.serverStatus?.status?.is_on_trial_license,
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
        const [hasFetched, serverConfig] = await storeFetchServerConfig();
        if (hasFetched) {
          setHasFetchedServerConfig(true);

          if (isSaasBuild && !BrowserStore.hasNmuiVersionSynced()) {
            BrowserStore.syncNmuiVersion();
            if (serverConfig?.Version.toLocaleLowerCase() !== getUiVersion()) {
              reloadNmuiWithVersion(serverConfig?.Version ?? '');
            }
          }
        }
      }
    }, APP_UPDATE_POLL_INTERVAL);

    // give some time so server status.isEE can load and branding can be determined
    const tId = setTimeout(() => {
      setIsAppReady(true);
    }, 1000);

    return () => {
      clearInterval(id);
      clearTimeout(tId);
    };
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
  }, [intercomBoot, intercomShutdown, isIntercomReady, isServerEE, store.amuiUserId, store.tenantId, store.username]);

  useEffect(() => {
    if (isSaasBuild && store.isLoggedIn()) {
      posthog.identify(store.amuiUserId, { email: store.username });
    }
  }, [posthog, store]);

  useEffect(
    () => {
      // set server status to healthy initially
      storeSetServerStatus({
        db_connected: true,
        broker_connected: true,
        license_error: '',
        healthyNetwork: true,
        is_pro: store.serverStatus?.status?.is_pro ?? false,
        trial_end_date: store.serverStatus?.status?.trial_end_date ?? '',
        is_on_trial_license: store.serverStatus?.status?.is_on_trial_license ?? false,
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    // one-time effect to load favicon
    let favicon = branding.favicon;
    if (favicon) {
      if (isSaasBuild) {
        favicon = `/${ServerConfigService.getUiVersion()}${favicon}`;
      }
      (document.getElementById('favicon') as HTMLLinkElement)?.setAttribute('href', favicon);
    }
  }, [branding]);

  // stop loading animation when the app is ready
  useEffect(() => {
    const loader = document.getElementById('nmui-loading');
    if (isAppReady && loader) {
      loader.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200 }).onfinish = () => {
        loader.remove();
      };
    }
  }, [isAppReady]);

  useEffect(() => {
    let timerId: NodeJS.Timeout;
    if (!store.serverStatus.isHealthy) {
      timerId = setTimeout(() => {
        setShowServerMalfunctionModal(true);
      }, 5000); // 5000 milliseconds = 5 seconds
    } else {
      setShowServerMalfunctionModal(false);
    }

    return () => {
      if (timerId) {
        clearTimeout(timerId); // Clear the timeout if the component is unmounted before the timeout finishes
      }
    };
  }, [store.serverStatus.isHealthy]);

  return (
    <div className="App">
      <ConfigProvider
        theme={{
          algorithm: store.currentTheme === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
          token: {
            colorPrimary: branding.primaryColor,
            colorLink: branding.primaryColor,
            fontFamily: 'Inter, SFPro, system-ui, Avenir, Helvetica, Arial, sans-serif',
            fontSize: 16,
            // colorBgContainer: 'black',
          },
        }}
      >
        <RouterProvider router={router} />
      </ConfigProvider>

      <ServerMalfunctionModal isOpen={showServerMalfunctionModal} />
    </div>
  );
}

export default App;
