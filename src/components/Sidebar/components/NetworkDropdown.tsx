import { useStore } from '@/store/store';
import MenuRow from './MenuRow';
import { PlusIcon } from '@heroicons/react/20/solid';
import { getNetworkRoute, resolveAppRoute } from '@/utils/RouteUtils';
import { AppRoutes } from '@/routes';
import { useNavigate } from 'react-router-dom';
import { CheckBadgeIcon, CheckIcon } from '@heroicons/react/24/solid';

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

  const { selectedNetwork } = useStore((state) => ({
    selectedNetwork: state.selectedNetwork,
  }));
  const networkId = selectedNetwork;

  if (!isOpen) return null;

  return (
    <div
      className={`absolute top-0 w-56 overflow-hidden rounded-lg shadow-2xl ${isSidebarCollapsed ? 'left-20' : 'left-52'} bg-bg-contrastDefault`}
    >
      <div className="py-1">
        {networks?.map((network) => (
          <MenuRow
            key={network.netid}
            title={network.netid}
            icon={networkId === network.netid ? <CheckIcon className="w-4" /> : <div className="size-4" />}
            selected={networkId === network.netid} // Update selected prop to compare with current networkId
            onClick={() => {
              store.setSelectedNetwork(network.netid); // Set the selected network
              onClose();
            }}
          />
        ))}

        <MenuRow
          title="Create network"
          icon={<PlusIcon className="size-4" />}
          onClick={() => {
            setIsAddNetworkModalOpen(true);
            onClose();
          }}
        />
      </div>
    </div>
  );
}
