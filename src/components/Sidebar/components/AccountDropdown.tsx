import { useStore } from '@/store/store';
import MenuRow from './MenuRow';
import { Cog6ToothIcon, MoonIcon, ArrowRightStartOnRectangleIcon } from '@heroicons/react/20/solid';
import { AppRoutes } from '@/routes';
import { getAmuiProfileUrl, resolveAppRoute } from '@/utils/RouteUtils';
import { useNavigate } from 'react-router-dom';
import { isSaasBuild } from '@/services/BaseService';
import { Switch } from 'antd';

interface AccountDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  isSidebarCollapsed?: boolean;
}

export default function AccountDropdown({ isOpen, onClose, isSidebarCollapsed }: AccountDropdownProps) {
  const storeLogout = useStore((state) => state.logout);
  const currentTheme = useStore((state) => state.currentTheme);
  const setCurrentTheme = useStore((state) => state.setCurrentTheme);

  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <div
      className={`absolute bottom-0 w-56 overflow-hidden rounded-lg shadow-2xl ${isSidebarCollapsed ? 'left-20' : 'left-52'} bg-bg-contrastDefault`}
    >
      <div className="py-1">
        <MenuRow
          title="Manage Account"
          icon={<Cog6ToothIcon className="size-6" />}
          onClick={() => {
            if (isSaasBuild) {
              window.location = getAmuiProfileUrl() as any;
              return;
            }
            navigate(resolveAppRoute(AppRoutes.PROFILE_ROUTE));
            onClose();
          }}
        />

        <MenuRow title="Dark theme" icon={<MoonIcon className="size-6" />} onClick={() => {}}>
          <Switch
            checked={currentTheme === 'dark'}
            onClick={() => {
              setCurrentTheme(currentTheme === 'dark' ? 'light' : 'dark');
            }}
          />
        </MenuRow>

        <MenuRow
          title="Logout"
          icon={<ArrowRightStartOnRectangleIcon className="size-6" />}
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
