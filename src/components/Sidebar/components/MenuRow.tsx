import { EllipsisVerticalIcon, PlusIcon } from '@heroicons/react/20/solid';
import React, { useState } from 'react';

type MenuRowProps = {
  title: string;
  icon: React.ReactNode;
  selected?: boolean;
  rightIcon?: 'plus' | 'ellipsis';
  isSidebarCollapsed?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
  danger?: boolean;
};

const MenuRow: React.FC<MenuRowProps> = ({
  title,
  icon,
  selected,
  rightIcon,
  isSidebarCollapsed,
  onClick,
  children,
  danger,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative">
      <div
        className={`flex items-center w-full gap-4 px-5 py-3 cursor-pointer 
          ${selected ? 'bg-bg-default text-text-primary' : 'text-text-secondary hover:bg-bg-contrastHover hover:text-text-primary'} 
          ${isSidebarCollapsed ? 'justify-center' : ''} ${danger ? 'text-red-500 hover:text-red-500' : ''}`}
        onClick={onClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {icon}
        {!isSidebarCollapsed && (
          <>
            <p className="flex-grow text-sm truncate">{title}</p>
            {rightIcon === 'plus' && (
              <div className="ml-auto">
                <PlusIcon className="size-6" />
              </div>
            )}
            {rightIcon === 'ellipsis' && (
              <div className="ml-auto">
                <EllipsisVerticalIcon className="size-6" />
              </div>
            )}
            {children}
          </>
        )}
      </div>

      {isSidebarCollapsed && showTooltip && (
        <div className="absolute z-50 -translate-y-1/2 left-20 top-1/2">
          <div className="relative">
            {/* Arrow */}
            <div className="absolute w-2 h-2 rotate-45 -translate-y-1/2 top-1/2 -left-1 bg-bg-hover" />
            {/* Tooltip content */}
            <div className="px-3 py-2 text-sm rounded bg-bg-hover text-text-primary whitespace-nowrap">{title}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuRow;
