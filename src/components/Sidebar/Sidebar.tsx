import {
  ArrowTopRightOnSquareIcon,
  ChevronUpIcon,
  DevicePhoneMobileIcon as DevicePhoneMobileIconSolid,
  KeyIcon as KeyIconSolid,
  Squares2X2Icon as Squares2X2IconSolid,
  UserCircleIcon,
  UsersIcon as UsersIconSolid,
  GlobeAltIcon as GlobeAltIconSolid,
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
  GlobeAltIcon as GlobeAltIconOutline,
  ComputerDesktopIcon as ComputerDesktopIconOutline,
  ViewfinderCircleIcon as ViewfinderCircleIconOutline,
  ArrowPathIcon as ArrowPathIconOutline,
  ArrowUpTrayIcon as ArrowUpTrayIconOutline,
  ArrowsRightLeftIcon as ArrowsRightLeftIconOutline,
  ShieldCheckIcon as ShieldCheckIconOutline,
  ChartBarSquareIcon as ChartBarSquareIconOutline,
  HashtagIcon as HashtagIconOutline,
  InboxStackIcon as InboxStackIconOutline,
} from '@heroicons/react/24/outline';

import LogoBlock from './components/LogoBlock';
import MenuRow from './components/MenuRow';
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AppRoutes } from '@/routes';
import NetworkDropdown from './components/NetworkDropdown';
import AccountDropdown from './components/AccountDropdown';
import { useStore } from '@/store/store';
import AddNetworkModal from '../modals/add-network-modal/AddNetworkModal';
import { getAmuiUrl, getNetworkPageRoute, isNetworkPage, NetworkPage } from '@/utils/RouteUtils';
import { useServerLicense } from '@/utils/Utils';
import UpgradeModal from '../modals/upgrade-modal/UpgradeModal';
import NetworkSelector from './components/NetworkSelector';

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
  const [isNetworkDropdownOpen, setIsNetworkDropdownOpen] = useState(false);
  const [isAddNetworkModalOpen, setIsAddNetworkModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  const autoFillButtonRef = useRef(null);
  const networkNameInputRef = useRef(null);
  const ipv4InputRef = useRef(null);
  const ipv6InputRef = useRef(null);
  const defaultAclInputRef = useRef(null);
  const submitButtonRef = useRef(null);

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
      // Handle network-specific pages
      const networkPageMatch = path.match(/\/networks\/([^/]+)\/([^/]+)/);
      if (networkPageMatch) {
        // networkPageMatch[2] will be the page name (nodes, hosts, etc.)
        const pageName = networkPageMatch[2];
        // Check if this is a subpage and map it to its parent menu item
        return subpageToMenuMap[pageName] || pageName;
      }

      // Handle specific host page
      const hostPageMatch = path.match(/\/networks\/([^/]+)\/hosts\/([^/]+)/);
      if (hostPageMatch) {
        return 'nodes'; // Map to nodes menu
      }

      // Handle root level pages
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
        title: 'Gateways',
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
      className={`sticky top-0 flex flex-col justify-between  pb-2 bg-bg-contrastDefault h-full transition-all duration-300 
         ${isSidebarCollapsed ? 'w-20' : 'w-56'}`}
    >
      <div>
        <LogoBlock isSidebarCollapsed={isSidebarCollapsed} onToggleCollapse={toggleSidebarCollapse} />
        <div
          className={`flex justify-center gap-2 py-3 pl-2 ${isSidebarCollapsed ? 'pr-2' : 'pr-4'} cursor-pointer hover:bg-bg-contrastHover`}
          onClick={() => setIsTenantCollapsed(!isTenantCollapsed)}
        >
          <ChevronUpIcon className={`size-5 ${isTenantCollapsed ? 'transform rotate-180 text-center' : ''}`} />
          {!isSidebarCollapsed && (
            <div className="flex flex-col w-full py-0.5 gap-1">
              <div className="flex gap-2 text-text-primary">
                <span className=" text-sm-semibold">Tenant</span>
                {!isSidebarCollapsed && (
                  <ArrowTopRightOnSquareIcon
                    onClick={(ev) => {
                      ev.stopPropagation();
                      if (!window) return;
                      window.location = getAmuiUrl() as any;
                    }}
                    className="size-4 "
                    title="Manage Tenant"
                  />
                )}
              </div>
              <span className="text-sm text-text-tertiary">{licenseType}</span>
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
        <div className="flex flex-col mt-4 ">
          <NetworkSelector
            isSidebarCollapsed={isSidebarCollapsed}
            onAddNetwork={() => setIsAddNetworkModalOpen(true)}
          />
          <div className={` ${isSidebarCollapsed ? 'px-2' : 'pl-4 pr-2 '}`}>
            <div
              className={`flex flex-col gap-2 pt-2  ${isSidebarCollapsed ? '' : 'border-stroke-default border-l pl-2'}`}
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
      </div>
      <div className="relative px-2">
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
      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onCancel={() => setIsUpgradeModalOpen(false)}
        onUpgrade={() => {
          setIsUpgradeModalOpen(false);
        }}
      />
    </div>
  );
};

export default Sidebar;
