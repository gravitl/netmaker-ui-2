import React, { useRef, useEffect, useState } from 'react';
import { useStore } from '@/store/store';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import { GlobeAltIcon } from '@heroicons/react/24/outline';
import { CheckIcon, PlusIcon } from '@heroicons/react/24/solid';
import { getNetworkPageRoute } from '@/utils/RouteUtils';
import { AppRoutes } from '@/routes';
import MenuRow from './MenuRow';
import { ExternalLinks } from '@/constants/LinkAndImageConstants';
import AddNetworkModal from '@/components/modals/add-network-modal/AddNetworkModal';

interface NetworkSelectorProps {
  isSidebarCollapsed?: boolean;
}

const NetworkSelector: React.FC<NetworkSelectorProps> = ({ isSidebarCollapsed = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAddNetworkModalOpen, setIsAddNetworkModalOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const store = useStore();

  const networks = store.networks;
  const activeNetwork = store.networks.find((network) => network.netid === store.activeNetwork)?.name;

  const autoFillButtonRef = useRef(null);
  const networkNameInputRef = useRef(null);
  const ipv4InputRef = useRef(null);
  const ipv6InputRef = useRef(null);
  const defaultAclInputRef = useRef(null);
  const submitButtonRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleNetworkSelect = (networkId: string) => {
    store.setActiveNetwork(networkId);

    // Check if current route is a network route
    const networkRouteMatch = location.pathname.match(/\/networks\/[^/]+/);

    if (networkRouteMatch) {
      // If we're already in a network route, just replace the network ID
      const newPath = location.pathname.replace(/\/networks\/[^/]+/, `/networks/${networkId}`);
      navigate(newPath);
    } else {
      // If we're not in a network route, go to the nodes page
      navigate(getNetworkPageRoute('nodes', networkId));
    }

    setIsOpen(false);
  };

  return (
    <div ref={menuRef} className="relative max-w-full ">
      {/* Network Selection Button */}
      <div
        className={`flex max-w-full items-center cursor-pointer transition-colors duration-150
          ${
            isSidebarCollapsed
              ? 'justify-center p-2  rounded-md'
              : 'gap-2 px-3 py-2 w-fit rounded-lg bg-bg-contrastActive'
          }`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <GlobeAltIcon className="size-5 shrink-0" />
        {!isSidebarCollapsed && (
          <>
            <div className="truncate text-sm-semibold">{activeNetwork}</div>
            <ChevronDownIcon
              className={`size-5 transition-transform duration-200 shrink-0
                ${isOpen ? 'rotate-180' : ''}`}
            />
          </>
        )}
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute mt-2 min-w-80 w-full left-0 rounded-lg shadow-xl z-50 bg-bg-contrastDefault border border-stroke-default
            ${
              isSidebarCollapsed
                ? 'left-16 w-48' // When collapsed, position to the right of the button
                : 'left-2 right-2' // When expanded, stretch within padding
            }`}
        >
          {/* Arrow for collapsed state */}
          {isSidebarCollapsed && (
            <div className="absolute w-2 h-2 rotate-45 -translate-y-1/2 -left-1 top-[1.75rem] bg-bg-default" />
          )}

          <div className="flex flex-col gap-2 ">
            {/* Optional heading for collapsed state */}
            <div className="px-4 pt-4 text-sm-semibold text-text-secondary">Select a network</div>
            <div className="flex flex-col gap-2 p-2 overflow-auto border-b max-h-32 border-stroke-default">
              {networks?.map((network) => (
                <div
                  key={network.netid}
                  className={`flex rounded-md items-center gap-2 px-3 py-2 text-sm-semibold cursor-pointer text-sm
                  ${activeNetwork === network.netid ? 'bg-bg-contrastActive text-text-primary' : 'hover:bg-bg-contrastHover text-text-secondary'}
                  transition-colors duration-150`}
                  onClick={() => handleNetworkSelect(network.netid)}
                >
                  {activeNetwork === network.netid ? (
                    <CheckIcon className="size-4 shrink-0" />
                  ) : (
                    <div className="size-4 shrink-0" />
                  )}
                  <span className="truncate">{network.name}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2 px-2 pb-2">
              <MenuRow title="All Networks" onClick={() => navigate(AppRoutes.NETWORKS_ROUTE)} />
              <div
                className="flex items-center gap-2 px-3 py-2 text-sm transition-colors duration-150 border-t rounded-md cursor-pointer text-sm-semibold text-button-primary-text-default bg-button-primary-fill-default border-stroke-hover"
                onClick={() => setIsAddNetworkModalOpen(true)}
              >
                <PlusIcon className="size-5" />
                <span className="">New Network</span>
              </div>
            </div>
          </div>
        </div>
      )}
      <AddNetworkModal
        isOpen={isAddNetworkModalOpen}
        onCreateNetwork={() => {
          setIsAddNetworkModalOpen(false);
        }}
        onCancel={() => setIsAddNetworkModalOpen(false)}
        autoFillButtonRef={autoFillButtonRef}
        networkNameInputRef={networkNameInputRef}
        ipv4InputRef={ipv4InputRef}
        ipv6InputRef={ipv6InputRef}
        defaultAclInputRef={defaultAclInputRef}
        submitButtonRef={submitButtonRef}
      />
    </div>
  );
};

export default NetworkSelector;
