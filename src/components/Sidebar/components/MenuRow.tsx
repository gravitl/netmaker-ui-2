import { EllipsisVerticalIcon, PlusIcon } from '@heroicons/react/20/solid';
import React, { useState, useRef, useEffect } from 'react';

type MenuRowProps = {
  title: string;
  subtitle?: string;
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
  subtitle,
  icon,
  selected,
  rightIcon,
  isSidebarCollapsed,
  onClick,
  children,
  danger,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showTooltip && menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      setTooltipPosition({
        top: rect.top + rect.height / 2,
        left: rect.right,
      });
    }
  }, [showTooltip]);

  return (
    <div className="relative w-full">
      <div
        ref={menuRef}
        className={`flex items-center w-full gap-2 rounded-md px-3 py-2 cursor-pointer 
          ${selected && !danger ? 'bg-bg-contrastActive text-text-primary ' : ' text-text-secondary hover:bg-bg-contrastHover '} 
          ${isSidebarCollapsed ? 'justify-center' : ''} ${danger ? 'text-text-critical hover:text-text-critical ' : ''}`}
        onClick={onClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {icon}
        {!isSidebarCollapsed && (
          <>
            <p className="flex-grow truncate text-sm-semibold">
              {title}
              <br />
              <span className="text-sm-semibold">{subtitle || ''}</span>
            </p>
            {rightIcon === 'plus' && (
              <div className="ml-auto">
                <PlusIcon className="size-5" />
              </div>
            )}
            {rightIcon === 'ellipsis' && (
              <div className="ml-auto">
                <EllipsisVerticalIcon className="size-5" />
              </div>
            )}
            {children}
          </>
        )}
      </div>

      {isSidebarCollapsed && showTooltip && (
        <div
          className="fixed z-50"
          style={{
            top: tooltipPosition.top,
            left: tooltipPosition.left,
          }}
        >
          <div className="relative -translate-y-1/2">
            <div className="absolute w-2 h-2 rotate-45 -translate-y-1/2 top-1/2 -left-1 bg-bg-hover" />
            <div className="px-3 py-2 text-sm rounded bg-bg-hover text-text-primary whitespace-nowrap">
              {title}
              <br />
              <span className="text-sm">{subtitle || ''}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuRow;
