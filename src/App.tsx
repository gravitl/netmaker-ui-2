import { ConfigProvider, notification, theme } from 'antd';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { useStore } from './store/store';
import './App.scss';
import { useCallback, useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import { ServerConfigService } from './services/ServerConfigService';
import ServerMalfunctionModal from './components/modals/server-malfunction-modal/ServerMalfunctionModal';

const POLL_INTERVAL = 10_000;

function App() {
  const store = useStore();
  const storeSetServerStatus = store.setServerStatus;
  const [notify, notifyCtx] = notification.useNotification();
  const [serverMalfunctionCount, setServerMalfunctionCount] = useState(0);

  const getUpdates = useCallback(async () => {
    try {
      const { data: serverStatus } = await ServerConfigService.getServerStatus();
      if (serverStatus.db_connected === false || serverStatus.broker_connected === false) {
        setServerMalfunctionCount((prev) => (prev === -1 ? -1 : 1));
      }
      storeSetServerStatus(serverStatus);
    } catch (err) {
      if (err instanceof AxiosError) {
        notify.error({ message: 'Failed to connect to your server', description: (err as AxiosError).message });
      }
    }
  }, [notify, storeSetServerStatus]);

  useEffect(() => {
    const id = setInterval(getUpdates, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [getUpdates]);

  return (
    <div className="App">
      <ConfigProvider
        theme={{
          algorithm: store.currentTheme === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
        }}
      >
        <RouterProvider router={router} />
      </ConfigProvider>

      {/* misc */}
      {notifyCtx}
      <ServerMalfunctionModal
        isOpen={![-1, 0].includes(serverMalfunctionCount)}
        onCancel={() => setServerMalfunctionCount(-1)}
      />
    </div>
  );
}

export default App;
