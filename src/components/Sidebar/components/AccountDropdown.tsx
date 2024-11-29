import { useStore } from '@/store/store';
import MenuRow from './MenuRow';
import { Cog6ToothIcon, MoonIcon, ArrowRightStartOnRectangleIcon } from '@heroicons/react/20/solid';
import { AppRoutes } from '@/routes';
import { getAmuiProfileUrl, resolveAppRoute } from '@/utils/RouteUtils';
import { useNavigate } from 'react-router-dom';
import { isSaasBuild } from '@/services/BaseService';
import { Switch } from 'antd';
import { useRef, useEffect } from 'react';

interface AccountDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  isSidebarCollapsed?: boolean;
}

export default function AccountDropdown({ isOpen, onClose, isSidebarCollapsed }: AccountDropdownProps) {
  const storeLogout = useStore((state) => state.logout);
  const currentTheme = useStore((state) => state.currentTheme);
  const setCurrentTheme = useStore((state) => state.setCurrentTheme);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className={`absolute  bottom-0 w-56 overflow-hidden rounded-lg shadow-2xl ${
        isSidebarCollapsed ? 'left-20' : 'left-52'
      } bg-bg-contrastDefault`}
    >
      <div className="flex flex-col gap-1 p-2">
        <MenuRow
          title="Manage Account"
          icon={<Cog6ToothIcon className="size-5" />}
          onClick={() => {
            if (isSaasBuild) {
              window.location = getAmuiProfileUrl() as any;
              return;
            }
            navigate(resolveAppRoute(AppRoutes.PROFILE_ROUTE));
            onClose();
          }}
        />

        <MenuRow
          title="Dark theme"
          icon={<MoonIcon className="size-5" />}
          onClick={() => {
            setCurrentTheme(currentTheme === 'dark' ? 'light' : 'dark');
          }}
        >
          <Switch
            checked={currentTheme === 'dark'}
            onClick={() => {
              setCurrentTheme(currentTheme === 'dark' ? 'light' : 'dark');
            }}
            size="small"
          />
        </MenuRow>

        <MenuRow
          title="Logout"
          icon={<ArrowRightStartOnRectangleIcon className="size-5" />}
          danger={true}
          onClick={() => {
            storeLogout();
            navigate(resolveAppRoute(AppRoutes.LOGIN_ROUTE));
            onClose();
          }}
        />
      </div>
    </div>
  );
}
