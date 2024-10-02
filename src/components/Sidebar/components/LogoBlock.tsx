import React from 'react';
import NetmakerLogo from '../../../../public/NetmakerLogo.png';
import { ChevronDoubleLeftIcon, ChevronDoubleRightIcon } from '@heroicons/react/20/solid';

interface LogoBlockProps {
  isSidebarCollapsed: boolean;
  onToggleCollapse: () => void;
}

const LogoBlock: React.FC<LogoBlockProps> = ({ isSidebarCollapsed, onToggleCollapse }) => {
  return (
    <div className="flex items-center justify-between w-full py-4 pl-5 pr-4">
      {!isSidebarCollapsed && <img src={NetmakerLogo} alt="Logo" className="h-6" />}
      <div className="p-2 cursor-pointer" onClick={onToggleCollapse}>
        {isSidebarCollapsed ? (
          <ChevronDoubleRightIcon className="size-4 text-button-outline-text-default" />
        ) : (
          <ChevronDoubleLeftIcon className="size-4 text-button-outline-text-default" />
        )}
      </div>
    </div>
  );
};

export default LogoBlock;
