import {
  ArrowTopRightOnSquareIcon,
  ChevronUpIcon,
  DevicePhoneMobileIcon as DevicePhoneMobileIconSolid,
  KeyIcon as KeyIconSolid,
  Squares2X2Icon as Squares2X2IconSolid,
  UserCircleIcon,
  UsersIcon as UsersIconSolid,
  ComputerDesktopIcon as ComputerDesktopIconSolid,
  ViewfinderCircleIcon as ViewfinderCircleIconSolid,
  ArrowPathIcon as ArrowPathIconSolid,
  ArrowUpTrayIcon as ArrowUpTrayIconSolid,
  ArrowsRightLeftIcon as ArrowsRightLeftIconSolid,
  ShieldCheckIcon as ShieldCheckIconSolid,
  ChartBarSquareIcon as ChartBarSquareIconSolid,
  HashtagIcon as HashtagIconSolid,
  InboxStackIcon as InboxStackIconSolid,
} from '@heroicons/react/20/solid';

import {
  DevicePhoneMobileIcon as DevicePhoneMobileIconOutline,
  KeyIcon as KeyIconOutline,
  Squares2X2Icon as Squares2X2IconOutline,
  UsersIcon as UsersIconOutline,
  ComputerDesktopIcon as ComputerDesktopIconOutline,
  ViewfinderCircleIcon as ViewfinderCircleIconOutline,
  ArrowPathIcon as ArrowPathIconOutline,
  ArrowUpTrayIcon as ArrowUpTrayIconOutline,
  ArrowsRightLeftIcon as ArrowsRightLeftIconOutline,
  ShieldCheckIcon as ShieldCheckIconOutline,
  ChartBarSquareIcon as ChartBarSquareIconOutline,
  HashtagIcon as HashtagIconOutline,
  InboxStackIcon as InboxStackIconOutline,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';

import LogoBlock from './components/LogoBlock';
import MenuRow from './components/MenuRow';
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AppRoutes } from '@/routes';
import AccountDropdown from './components/AccountDropdown';
import { useStore } from '@/store/store';
import AddNetworkModal from '../modals/add-network-modal/AddNetworkModal';
import { getAmuiUrl, getNetworkPageRoute, isNetworkPage, NetworkPage } from '@/utils/RouteUtils';
import { useServerLicense } from '@/utils/Utils';
import UpgradeModal from '../modals/upgrade-modal/UpgradeModal';
import NetworkSelector from './components/NetworkSelector';
import RacModal from '../modals/rac-modal/RacModal';

const Sidebar = ({
  isSidebarCollapsed,
  setIsSidebarCollapsed,
}: {
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (isCollapsed: boolean) => void;
}) => {
  const { isServerEE } = useServerLicense();
  const [isTenantCollapsed, setIsTenantCollapsed] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState('');
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isRacModalOpen, setIsRacModalOpen] = useState(false);

  const store = useStore();
  const location = useLocation();
  const navigate = useNavigate();

  type SubpageMap = {
    [key: string]: string;
  };

  const subpageToMenuMap: SubpageMap = useMemo(
    () => ({
      hosts: 'nodes',
      host: 'nodes',
      'remote-access': 'remote-access',
      egress: 'egress',
      gateways: 'internet-gateways',
      'access-control': 'acls',
      'tag-manager': 'tags',
      analytics: 'analytics',
    }),
    [],
  );

  const getMenuKeyFromPath = useCallback(
    (path: string) => {
      const networkPageMatch = path.match(/\/networks\/([^/]+)\/([^/]+)/);
      if (networkPageMatch) {
        const pageName = networkPageMatch[2];
        return subpageToMenuMap[pageName] || pageName;
      }

      const hostPageMatch = path.match(/\/networks\/([^/]+)\/hosts\/([^/]+)/);
      if (hostPageMatch) {
        return 'nodes';
      }

      if (path === AppRoutes.DASHBOARD_ROUTE) return 'dashboard';
      if (path === AppRoutes.HOSTS_ROUTE) return 'devices';
      if (path === AppRoutes.USERS_ROUTE) return 'users';
      if (path === AppRoutes.ENROLLMENT_KEYS_ROUTE) return 'keys';
      if (path === AppRoutes.NETWORKS_ROUTE) return 'networks';

      return '';
    },
    [subpageToMenuMap],
  );

  const menuItems = useMemo(
    () => [
      {
        key: 'dashboard',
        title: 'Dashboard',
        iconSolid: <Squares2X2IconSolid className="size-5" />,
        iconOutline: <Squares2X2IconOutline className="size-5" />,
        route: AppRoutes.DASHBOARD_ROUTE,
      },
      {
        key: 'devices',
        title: 'Devices',
        iconSolid: <DevicePhoneMobileIconSolid className="size-5" />,
        iconOutline: <DevicePhoneMobileIconOutline className="size-5" />,
        route: AppRoutes.HOSTS_ROUTE,
      },
      {
        key: 'users',
        title: 'Users',
        iconSolid: <UsersIconSolid className="size-5" />,
        iconOutline: <UsersIconOutline className="size-5" />,
        route: AppRoutes.USERS_ROUTE,
      },
      {
        key: 'keys',
        title: 'Keys',
        iconSolid: <KeyIconSolid className="size-5" />,
        iconOutline: <KeyIconOutline className="size-5" />,
        route: AppRoutes.ENROLLMENT_KEYS_ROUTE,
      },
    ],
    [],
  );

  const networkMenuItems = useMemo(
    () => [
      {
        key: 'nodes',
        title: 'Nodes',
        iconSolid: <ComputerDesktopIconSolid className="size-5" />,
        iconOutline: <ComputerDesktopIconOutline className="size-5" />,
        route: null,
      },
      {
        key: 'remote-access',
        title: 'Remote Access',
        iconSolid: <ViewfinderCircleIconSolid className="size-5" />,
        iconOutline: <ViewfinderCircleIconOutline className="size-5" />,
        route: null,
      },
      {
        key: 'relays',
        title: 'Relays',
        iconSolid: <ArrowPathIconSolid className="size-5" />,
        iconOutline: <ArrowPathIconOutline className="size-5" />,
        route: null,
      },
      {
        key: 'egress',
        title: 'Egress',
        iconSolid: <ArrowUpTrayIconSolid className="size-5" />,
        iconOutline: <ArrowUpTrayIconOutline className="size-5" />,
        route: null,
      },
      {
        key: 'internet-gateways',
        title: 'Internet Gateways',
        iconSolid: <ArrowsRightLeftIconSolid className="size-5" />,
        iconOutline: <ArrowsRightLeftIconOutline className="size-5" />,
        route: null,
      },
      {
        key: 'acls',
        title: 'Access Control',
        iconSolid: <ShieldCheckIconSolid className="size-5" />,
        iconOutline: <ShieldCheckIconOutline className="size-5" />,
        route: null,
      },
      {
        key: 'tags',
        title: 'Tag Manager',
        iconSolid: <HashtagIconSolid className="size-5" />,
        iconOutline: <HashtagIconOutline className="size-5" />,
        route: null,
      },
      {
        key: 'dns',
        title: 'DNS',
        iconSolid: <InboxStackIconSolid className="size-5" />,
        iconOutline: <InboxStackIconOutline className="size-5" />,
        route: null,
      },
      {
        key: 'analytics',
        title: 'Analytics',
        iconSolid: <ChartBarSquareIconSolid className="size-5" />,
        iconOutline: <ChartBarSquareIconOutline className="size-5" />,
        route: null,
      },
    ],
    [],
  );

  const licenseType = useMemo(() => {
    if (!isServerEE)
      return (
        <span title="Click to upgrade" className="underline" onClick={() => setIsUpgradeModalOpen(true)}>
          CE License
        </span>
      );
    return 'Pro License';
  }, [isServerEE]);

  useEffect(() => {
    const currentPath = location.pathname;
    const menuKey = getMenuKeyFromPath(currentPath);

    const menuItem = [...menuItems, ...networkMenuItems].find((item) => item.key === menuKey);
    if (menuItem) {
      setSelectedMenu(menuItem.key);
    }
  }, [location.pathname, menuItems, networkMenuItems, getMenuKeyFromPath]);

  const handleMenuClick = (key: string) => {
    setSelectedMenu(key);
    if (isNetworkPage(key)) {
      navigate(getNetworkPageRoute(key as NetworkPage, store.activeNetwork));
    }
  };

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div
      className={`sticky top-0 flex flex-col h-screen bg-bg-contrastDefault transition-all duration-300 
         ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}
    >
      {/* Top fixed section */}
      <div>
        <LogoBlock isSidebarCollapsed={isSidebarCollapsed} onToggleCollapse={toggleSidebarCollapse} />
        <div
          className={`flex justify-center gap-2 py-3 pl-2 ${
            isSidebarCollapsed ? 'pr-2' : 'pr-4'
          } cursor-pointer hover:bg-bg-contrastHover`}
          onClick={() => setIsTenantCollapsed(!isTenantCollapsed)}
        >
          <ChevronUpIcon className={`size-5 ${isTenantCollapsed ? 'transform rotate-180 text-center' : ''}`} />
          {!isSidebarCollapsed && (
            <div className="flex flex-col w-full py-0.5 gap-1">
              <div className="flex gap-2 text-text-primary">
                <span className="text-sm-semibold">Tenant</span>
                {!isSidebarCollapsed && (
                  <ArrowTopRightOnSquareIcon
                    onClick={(ev) => {
                      ev.stopPropagation();
                      if (!window) return;
                      window.location = getAmuiUrl() as any;
                    }}
                    className="size-4"
                    title="Manage Tenant"
                  />
                )}
              </div>
              <span className="text-sm text-text-secondary">{licenseType}</span>
            </div>
          )}
        </div>
        {!isTenantCollapsed && (
          <div className={`flex flex-col gap-2 ${isSidebarCollapsed ? 'px-2 items-center' : 'px-2'}`}>
            {menuItems.map(({ key, title, iconSolid, iconOutline, route }) => (
              <Link className="w-full" to={route} key={title}>
                <MenuRow
                  title={title}
                  icon={selectedMenu === key ? iconSolid : iconOutline}
                  selected={selectedMenu === key}
                  onClick={() => handleMenuClick(key)}
                  isSidebarCollapsed={isSidebarCollapsed}
                />
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Middle scrollable section */}
      <div className="flex flex-col flex-1 min-h-0 mt-4">
        <div className="px-2">
          <NetworkSelector isSidebarCollapsed={isSidebarCollapsed} />
        </div>
        <div className={`flex-1 overflow-y-auto ${isSidebarCollapsed ? 'px-2' : 'pl-4 pr-2'}`}>
          <div
            className={`flex flex-col gap-2 pt-2 ${isSidebarCollapsed ? '' : 'border-stroke-default border-l pl-2'}`}
          >
            {networkMenuItems.map(({ key, title, iconSolid, iconOutline, route }) => {
              return route ? (
                <Link to={route} key={title}>
                  <MenuRow
                    key={key}
                    title={title}
                    icon={selectedMenu === key ? iconSolid : iconOutline}
                    selected={selectedMenu === key}
                    onClick={() => handleMenuClick(key)}
                    isSidebarCollapsed={isSidebarCollapsed}
                  />
                </Link>
              ) : (
                <MenuRow
                  key={key}
                  title={title}
                  icon={selectedMenu === key ? iconSolid : iconOutline}
                  selected={selectedMenu === key}
                  onClick={() => handleMenuClick(key)}
                  isSidebarCollapsed={isSidebarCollapsed}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom fixed section */}
      <div className="relative flex flex-col gap-2 px-2 py-2 mt-auto border-t shadow-lg border-stroke-default">
        <MenuRow
          title="Download RAC"
          icon={<ArrowDownTrayIcon className="size-5" />}
          isSidebarCollapsed={isSidebarCollapsed}
          onClick={() => setIsRacModalOpen(true)}
        />

        <MenuRow
          title={store.username as string}
          icon={<UserCircleIcon className="size-5" />}
          rightIcon="ellipsis"
          isSidebarCollapsed={isSidebarCollapsed}
          onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
        />

        <AccountDropdown
          isOpen={isAccountDropdownOpen}
          onClose={() => setIsAccountDropdownOpen(false)}
          isSidebarCollapsed={isSidebarCollapsed}
        />
      </div>

      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onCancel={() => setIsUpgradeModalOpen(false)}
        onUpgrade={() => {
          setIsUpgradeModalOpen(false);
        }}
      />
      <RacModal isOpen={isRacModalOpen} onClose={() => setIsRacModalOpen(false)} />
    </div>
  );
};

export default Sidebar;
