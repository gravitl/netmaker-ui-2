import { useStore } from '@/store/store';
import MenuRow from './MenuRow';
import { PlusIcon } from '@heroicons/react/20/solid';
import { getNetworkPageRoute, getNetworkRoute, resolveAppRoute } from '@/utils/RouteUtils';
import { AppRoutes } from '@/routes';
import { useNavigate } from 'react-router-dom';

interface NetworkDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  setIsAddNetworkModalOpen: (open: boolean) => void;
  isSidebarCollapsed?: boolean;
}

export default function NetworkDropdown({
  isOpen,
  onClose,
  setIsAddNetworkModalOpen,
  isSidebarCollapsed,
}: NetworkDropdownProps) {
  const store = useStore();
  const networks = store.networks;
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <div
      className={`absolute top-0 w-56 overflow-hidden rounded-lg shadow-2xl ${isSidebarCollapsed ? 'left-20' : 'left-52'} bg-bg-contrastDefault`}
    >
      <div className="py-1">
        {networks?.map((network) => (
          <MenuRow
            key={network.netid}
            title={network.name || network.netid}
            icon={
              <div className="size-6" /> // Empty div for spacing
            }
            // selected={currentNetwork?.id === network.id}
            selected={false}
            onClick={() => {
              store.setActiveNetwork(network.netid);
              navigate(getNetworkPageRoute('nodes', network.netid));
              // navigate(getNetworkRoute(network));
              onClose();
            }}
          />
        ))}

        <MenuRow
          title="Create network"
          icon={<PlusIcon className="size-6" />}
          onClick={() => {
            setIsAddNetworkModalOpen(true);
            onClose();
          }}
        />
      </div>
    </div>
  );
}
