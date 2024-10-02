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
  Bars3Icon,
  XMarkIcon,
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
} from '@heroicons/react/24/outline';

import LogoBlock from './components/LogoBlock';
import MenuRow from './components/MenuRow';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AppRoutes } from '@/routes';
import NetworkDropdown from './components/NetworkDropdown';
import AccountDropdown from './components/AccountDropdown';
import { useStore } from '@/store/store';
import AddNetworkModal from '../modals/add-network-modal/AddNetworkModal';
import { getAmuiTenantsUrl, getNetworkPageRoute, isNetworkPage, NetworkPage } from '@/utils/RouteUtils';

const Sidebar = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isTenantCollapsed, setIsTenantCollapsed] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState('');
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const [isNetworkDropdownOpen, setIsNetworkDropdownOpen] = useState(false);
  const [isAddNetworkModalOpen, setIsAddNetworkModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const autoFillButtonRef = useRef(null);
  const networkNameInputRef = useRef(null);
  const ipv4InputRef = useRef(null);
  const ipv6InputRef = useRef(null);
  const defaultAclInputRef = useRef(null);
  const submitButtonRef = useRef(null);
  const sidebarRef = useRef<HTMLDivElement | null>(null);

  const store = useStore();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  const menuItems = useMemo(
    () => [
      {
        key: 'dashboard',
        title: 'Dashboard',
        iconSolid: <Squares2X2IconSolid className="size-6" />,
        iconOutline: <Squares2X2IconOutline className="size-6" />,
        route: AppRoutes.DASHBOARD_ROUTE,
      },
      {
        key: 'devices',
        title: 'Devices',
        iconSolid: <DevicePhoneMobileIconSolid className="size-6" />,
        iconOutline: <DevicePhoneMobileIconOutline className="size-6" />,
        route: AppRoutes.HOSTS_ROUTE,
      },
      {
        key: 'users',
        title: 'Users',
        iconSolid: <UsersIconSolid className="size-6" />,
        iconOutline: <UsersIconOutline className="size-6" />,
        route: AppRoutes.USERS_ROUTE,
      },
      {
        key: 'keys',
        title: 'Keys',
        iconSolid: <KeyIconSolid className="size-6" />,
        iconOutline: <KeyIconOutline className="size-6" />,
        route: AppRoutes.ENROLLMENT_KEYS_ROUTE,
      },
    ],
    [],
  );

  const networkMenuItems = useMemo(
    () => [
      {
        key: 'networks',
        title: 'Networks',
        iconSolid: <GlobeAltIconSolid className="size-6" />,
        iconOutline: <GlobeAltIconOutline className="size-6" />,
        route: AppRoutes.NETWORKS_ROUTE,
        rightIcon: 'ellipsis',
      },
      {
        key: 'nodes',
        title: 'Nodes',
        iconSolid: <ComputerDesktopIconSolid className="size-6" />,
        iconOutline: <ComputerDesktopIconOutline className="size-6" />,
        route: null,
      },
      {
        key: 'remote-access',
        title: 'Remote Access',
        iconSolid: <ViewfinderCircleIconSolid className="size-6" />,
        iconOutline: <ViewfinderCircleIconOutline className="size-6" />,
        route: null,
      },
      {
        key: 'relays',
        title: 'Relays',
        iconSolid: <ArrowPathIconSolid className="size-6" />,
        iconOutline: <ArrowPathIconOutline className="size-6" />,
        route: null,
      },
      {
        key: 'egress',
        title: 'Egress',
        iconSolid: <ArrowUpTrayIconSolid className="size-6" />,
        iconOutline: <ArrowUpTrayIconOutline className="size-6" />,
        route: null,
      },
      {
        key: 'internet-gateways',
        title: 'Gateways',
        iconSolid: <ArrowsRightLeftIconSolid className="size-6" />,
        iconOutline: <ArrowsRightLeftIconOutline className="size-6" />,
        route: null,
      },
      {
        key: 'acls',
        title: 'Access Control',
        iconSolid: <ShieldCheckIconSolid className="size-6" />,
        iconOutline: <ShieldCheckIconOutline className="size-6" />,
        route: null,
      },
      {
        key: 'tags',
        title: 'Device Tags',
        iconSolid: <ShieldCheckIconSolid className="size-6" />,
        iconOutline: <ShieldCheckIconOutline className="size-6" />,
        route: null,
      },
      {
        key: 'dns',
        title: 'DNS',
        iconSolid: <ChartBarSquareIconSolid className="size-6" />,
        iconOutline: <ChartBarSquareIconOutline className="size-6" />,
        route: null,
      },
      {
        key: 'metrics',
        title: 'Metrics',
        iconSolid: <ChartBarSquareIconSolid className="size-6" />,
        iconOutline: <ChartBarSquareIconOutline className="size-6" />,
        route: null,
      },
      {
        key: 'info',
        // title: 'Analytics', // TODO: bring back after merging info and metrics
        title: 'Info',
        iconSolid: <ChartBarSquareIconSolid className="size-6" />,
        iconOutline: <ChartBarSquareIconOutline className="size-6" />,
        route: null,
      },
    ],
    [],
  );

  useEffect(() => {
    const currentPath = location.pathname;
    const currentMenuItem = [...menuItems, ...networkMenuItems].find((item) => item.route === currentPath);
    if (currentMenuItem) {
      setSelectedMenu(currentMenuItem.title);
    }
  }, [location, menuItems, networkMenuItems]);

  const handleMenuClick = (key: string) => {
    setSelectedMenu(key);
    setIsMobileMenuOpen(false);

    // TODO: change to use route from array instead
    if (isNetworkPage(key)) {
      navigate(getNetworkPageRoute(key as NetworkPage, store.activeNetwork));
    }
  };

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        className="fixed z-50 p-2 rounded-lg top-4 right-4 bg-bg-contrastDefault md:hidden"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? (
          <XMarkIcon className="size-6 text-text-primary" />
        ) : (
          <Bars3Icon className="size-6 text-text-primary" />
        )}
      </button>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && <div className="fixed inset-0 z-30 bg-black bg-opacity-50 md:hidden" />}

      <div
        ref={sidebarRef}
        className={`fixed md:sticky top-0 left-0 z-40 flex flex-col justify-between h-screen pb-2 bg-bg-contrastDefault transition-all duration-300 
          ${isSidebarCollapsed ? 'w-20' : 'w-56'}
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        <div>
          <LogoBlock isSidebarCollapsed={isSidebarCollapsed} onToggleCollapse={toggleSidebarCollapse} />
          <div
            className="flex gap-4 py-3 pl-5 pr-4 cursor-pointer text-text-secondary hover:bg-bg-contrastHover"
            onClick={() => setIsTenantCollapsed(!isTenantCollapsed)}
          >
            <ChevronUpIcon className={`size-6 ${isTenantCollapsed ? 'transform rotate-180' : ''}`} />
            {!isSidebarCollapsed && (
              <div className="flex flex-col w-full py-0.5 gap-1">
                <span className="text-text-primary text-sm-semibold">Tenant</span>
                <span className="text-sm">Starter</span>
              </div>
            )}
            {!isSidebarCollapsed && <ArrowTopRightOnSquareIcon className="size-6 hover:text-text-primary" />}
          </div>
          {!isTenantCollapsed && (
            <div>
              {menuItems.map(({ key, title, iconSolid, iconOutline, route }) => (
                <Link to={route} key={title}>
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
          <div className="mt-4">
            {networkMenuItems.map(({ key, title, iconSolid, iconOutline, route, rightIcon }) => {
              if (title === 'Networks') {
                return (
                  <div key={title} className="relative">
                    <MenuRow
                      title={title}
                      subtitle={store.activeNetwork || ''}
                      icon={selectedMenu === key ? iconSolid : iconOutline}
                      selected={selectedMenu === key}
                      onClick={() => {
                        handleMenuClick(key);
                        setIsNetworkDropdownOpen(!isNetworkDropdownOpen);
                      }}
                      rightIcon="ellipsis"
                      isSidebarCollapsed={isSidebarCollapsed}
                    />
                    <NetworkDropdown
                      isOpen={isNetworkDropdownOpen}
                      onClose={() => setIsNetworkDropdownOpen(false)}
                      setIsAddNetworkModalOpen={setIsAddNetworkModalOpen}
                      isSidebarCollapsed={isSidebarCollapsed}
                    />
                  </div>
                );
              }

              return route ? (
                <Link to={route} key={title}>
                  <MenuRow
                    title={title}
                    icon={selectedMenu === key ? iconSolid : iconOutline}
                    selected={selectedMenu === key}
                    onClick={() => handleMenuClick(key)}
                    rightIcon={rightIcon as 'ellipsis' | 'plus' | undefined}
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
                  rightIcon={rightIcon as 'ellipsis' | 'plus' | undefined}
                  isSidebarCollapsed={isSidebarCollapsed}
                />
              );
            })}
          </div>
        </div>
        <div className="relative">
          <MenuRow
            title={store.username as string}
            icon={<UserCircleIcon className="size-6" />}
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
      </div>
    </>
  );
};

export default Sidebar;
