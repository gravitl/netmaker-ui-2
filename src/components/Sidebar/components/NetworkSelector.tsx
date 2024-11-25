import React, { useRef, useEffect, useState } from 'react';
import { useStore } from '@/store/store';
import { useNavigate } from 'react-router-dom';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import { GlobeAltIcon } from '@heroicons/react/24/outline';
import { getNetworkPageRoute } from '@/utils/RouteUtils';
import { CheckBadgeIcon, CheckCircleIcon, CheckIcon, PlusIcon } from '@heroicons/react/24/solid';

interface NetworkSelectorProps {
  isSidebarCollapsed?: boolean;
  onAddNetwork: () => void;
}

const NetworkSelector: React.FC<NetworkSelectorProps> = ({ isSidebarCollapsed = false, onAddNetwork }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const store = useStore();

  const networks = store.networks;
  const activeNetwork = store.activeNetwork;

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
    navigate(getNetworkPageRoute('nodes', networkId));
    setIsOpen(false);
  };

  return (
    <div ref={menuRef} className="relative px-2">
      {/* Network Selection Button */}
      <div
        className={`flex items-center cursor-pointer transition-colors duration-150
          ${
            isSidebarCollapsed
              ? 'justify-center p-2 hover:bg-bg-contrastHover rounded-md'
              : 'gap-2 px-3 py-2 w-fit rounded-lg bg-bg-contrastHover'
          }`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <GlobeAltIcon className="size-5" />
        {!isSidebarCollapsed && (
          <>
            <div className="text-sm-semibold">{activeNetwork}</div>
            <ChevronDownIcon
              className={`size-5 transition-transform duration-200
                ${isOpen ? 'rotate-180' : ''}`}
            />
          </>
        )}
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute mt-2 overflow-hidden rounded-lg shadow-xl z-50 bg-bg-contrastDefault
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

          <div className="flex flex-col gap-2 p-2">
            {/* Optional heading for collapsed state */}
            <div className="px-4 mb-1 text-sm text-text-tertiary">Networks</div>

            {networks?.map((network) => (
              <div
                key={network.netid}
                className={`flex rounded-md items-center gap-2 px-3 py-2 text-sm-semibold cursor-pointer text-sm
                  ${activeNetwork === network.netid ? 'bg-button-plain-fill-default text-button-plain-text-default' : 'hover:bg-bg-contrastHover'}
                  transition-colors duration-150`}
                onClick={() => handleNetworkSelect(network.netid)}
              >
                {activeNetwork === network.netid ? <CheckIcon className="size-5" /> : <div className="size-5" />}
                <span>{network.netid}</span>
              </div>
            ))}

            <div
              className="flex items-center gap-2 px-3 py-2 text-sm transition-colors duration-150 border-t rounded-md cursor-pointer text-sm-semibold text-button-primary-text-default bg-button-primary-fill-default border-stroke-hover"
              onClick={onAddNetwork}
            >
              <PlusIcon className="size-5" />
              <span className="">Create Network</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NetworkSelector;
