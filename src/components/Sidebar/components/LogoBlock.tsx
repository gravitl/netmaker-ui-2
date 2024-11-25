import React from 'react';
import NetmakerLogo from '@/assets/NetmakerLogo.svg';
import NetmakerLogoSm from '@/assets/NetmakerLogoSm.svg';
import { ChevronDoubleLeftIcon, ChevronDoubleRightIcon } from '@heroicons/react/20/solid';
import { ArrowLeftCircleIcon, ArrowRightCircleIcon } from '@heroicons/react/24/solid';

interface LogoBlockProps {
  isSidebarCollapsed: boolean;
  onToggleCollapse: () => void;
}

const LogoBlock: React.FC<LogoBlockProps> = ({ isSidebarCollapsed, onToggleCollapse }) => {
  return (
    <div className={`relative flex items-center ${isSidebarCollapsed && 'justify-center'} w-full py-4 pl-5 pr-4`}>
      {!isSidebarCollapsed ? (
        <img src={NetmakerLogo} alt="Logo" className="h-7" />
      ) : (
        <img src={NetmakerLogoSm} alt="Logo" className="h-7" />
      )}
      {isSidebarCollapsed ? (
        <div className="absolute p-2 cursor-pointer -right-4" onClick={onToggleCollapse}>
          {' '}
          <ArrowRightCircleIcon className="shadow-xl size-5 text-button-outline-text-default" />
        </div>
      ) : (
        <div className="absolute p-2 cursor-pointer -right-4" onClick={onToggleCollapse}>
          <ArrowLeftCircleIcon className="shadow-xl size-5 text-button-outline-text-default" />
        </div>
      )}
    </div>
  );
};

export default LogoBlock;
