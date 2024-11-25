import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AppstoreOutlined,
  CloudSyncOutlined,
  DatabaseOutlined,
  GlobalOutlined,
  KeyOutlined,
  LaptopOutlined,
  LoadingOutlined,
  LogoutOutlined,
  UserOutlined,
  BookOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import { Alert, Col, Divider, MenuProps, Row, Select, Switch, Typography } from 'antd';
import { Layout, Menu, theme } from 'antd';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  getAmuiProfileUrl,
  getAmuiTenantsUrl,
  getAmuiUrl,
  getHostRoute,
  getNetworkRoute,
  resolveAppRoute,
} from '../utils/RouteUtils';
import { BrowserStore, useStore } from '../store/store';
import { AppRoutes } from '@/routes';
import { useTranslation } from 'react-i18next';
import { isSaasBuild } from '@/services/BaseService';
import { ServerConfigService, getUiVersion } from '@/services/ServerConfigService';
import { AppErrorBoundary } from '@/components/AppErrorBoundary';
import { isManagedHost, useBranding, useServerLicense } from '@/utils/Utils';
import VersionUpgradeModal from '@/components/modals/version-upgrade-modal/VersionUpgradeModal';
import { lt } from 'semver';
import { isAdminUserOrRole } from '@/utils/UserMgmtUtils';
import { ExternalLinks } from '@/constants/LinkAndImageConstants';
import RacModal from '@/components/modals/rac-modal/RacModal';
import Sidebar from '@/components/Sidebar/Sidebar';

const { Content, Sider } = Layout;

export const SIDE_NAV_EXPANDED_WIDTH = '200px';
export const SIDE_NAV_COLLAPSED_WIDTH = '80px';

// const SELECTED_COLOR = '#1668dc';

export default function MainLayout() {
  const { token: themeToken } = theme.useToken();
  const currentTheme = useStore((state) => state.currentTheme);
  const setCurrentTheme = useStore((state) => state.setCurrentTheme);
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const store = useStore();
  const storeFetchNetworks = useStore((state) => state.fetchNetworks);
  const storeLogout = useStore((state) => state.logout);
  const location = useLocation();
  const branding = useBranding();
  const { isServerEE } = useServerLicense();

  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [openSidebarMenus, setOpenSidebarMenus] = useState(['networks']);
  const [trialEndDate, setTrialEndDate] = useState<Date | null>(null);
  const [isVersionUpgradeModalOpen, setIsVersionUpgradeModalOpen] = useState(false);
  const [latestNetmakerVersion, setLatestNetmakerVersion] = useState('');
  const [canUpgrade, setCanUpgrade] = useState(false);
  const [isRacModalOpen, setIsRacModalOpen] = useState(false);

  const recentNetworks = useMemo(
    // TODO: implement most recent ranking
    () =>
      structuredClone(store.networks)
        .sort((a, b) => a.netid.localeCompare(b.netid))
        .slice(0, 10),
    [store.networks],
  );

  const userHasFullAccess = useMemo(() => isAdminUserOrRole(store.user!), [store.user]);

  const sidebarLogo = useMemo(() => {
    const { logoDarkUrl, logoLightUrl, logoDarkSmallUrl, logoLightSmallUrl } = branding;

    if (currentTheme === 'dark') {
      if (isSidebarCollapsed) {
        return isSaasBuild ? `/${ServerConfigService.getUiVersion()}${logoDarkSmallUrl}` : logoDarkSmallUrl;
      } else {
        return isSaasBuild ? `/${ServerConfigService.getUiVersion()}${logoDarkUrl}` : logoDarkUrl;
      }
    } else if (currentTheme === 'light') {
      if (isSidebarCollapsed) {
        return isSaasBuild ? `/${ServerConfigService.getUiVersion()}${logoLightSmallUrl}` : logoLightSmallUrl;
      } else {
        return isSaasBuild ? `/${ServerConfigService.getUiVersion()}${logoLightUrl}` : logoLightUrl;
      }
    }

    return '';
  }, [branding, currentTheme, isSidebarCollapsed]);

  const sideNavItems: MenuProps['items'] = useMemo(
    () =>
      [
        {
          key: 'dashboard',
          icon: DatabaseOutlined,
          label: 'Dashboard',
        },
        {
          key: 'networks',
          icon: GlobalOutlined,
          label: 'Networks',
          children: [
            ...recentNetworks.map((net) => ({
              key: `networks/${net.netid}`,
              label: net.displayName,
            })),
            {
              type: 'divider',
            },
            {
              key: 'all-networks',
              label: 'All Networks',
            },
          ],
        },
        userHasFullAccess
          ? {
              key: 'hosts',
              icon: LaptopOutlined,
              label: 'Devices',
            }
          : undefined!,
        userHasFullAccess
          ? {
              key: 'enrollment-keys',
              icon: KeyOutlined,
              label: 'Enrollment Keys',
            }
          : undefined!,
        {
          type: 'divider',
        },
      ]
        .concat(
          userHasFullAccess
            ? {
                key: 'users',
                icon: UserOutlined,
                label: 'User Management',
              }
            : [],
        )
        .concat(
          isSaasBuild
            ? [
                {
                  key: 'amuitenants',
                  icon: AppstoreOutlined,
                  label: 'Tenants',
                },
              ]
            : [],
        )
        .concat([
          {
            key: 'documentation',
            icon: BookOutlined,
            label: 'Documentation',
          },
        ])
        .map(
          (item) =>
            item && {
              key: item.key,
              type: item.type as any,
              style: {
                marginTop: item.type === 'divider' ? '1rem' : '',
                marginBottom: item.type === 'divider' ? '1rem' : '',
              },
              icon: item.icon && React.createElement(item.icon),
              label: item.label,
              children: item.children?.map((child) => ({
                key: (child as any)?.key,
                label: (child as any)?.label,
                type: (child as any)?.type,
              })),
            },
        ),
    [recentNetworks, userHasFullAccess],
  );

  const bottomMenuItems: MenuProps['items'] = useMemo(() => {
    const menuItems: MenuProps['items'] = [
      {
        type: 'divider' as const,
      },
      {
        key: 'download-rac',
        icon: React.createElement(DownloadOutlined),
        label: 'Download RAC',
        onClick: () => {
          setIsRacModalOpen(true);
        },
      },
      {
        type: 'divider' as const,
      },
      {
        key: 'user-menu',
        icon: React.createElement(UserOutlined),
        label: store.username,
        children: [
          {
            key: 'theme-switch',
            style: {
              paddingLeft: isSidebarCollapsed ? '.2rem' : '1rem',
              paddingRight: isSidebarCollapsed ? '.2rem' : '1rem',
              paddingTop: isSidebarCollapsed ? '.2rem' : '1rem',
              paddingBottom: isSidebarCollapsed ? '.2rem' : '1rem',
            },
            label: (
              <div
                style={{
                  display: 'flex',
                  flexFlow: 'row nowrap',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                Dark theme
                <Switch
                  checked={currentTheme === 'dark'}
                  onClick={() => {
                    setCurrentTheme(currentTheme === 'dark' ? 'light' : 'dark');
                  }}
                />
              </div>
            ),
          },
          {
            key: 'language-select',
            style: {
              paddingLeft: isSidebarCollapsed ? '.2rem' : '1rem',
              paddingRight: isSidebarCollapsed ? '.2rem' : '1rem',
              paddingTop: isSidebarCollapsed ? '.2rem' : '1rem',
              paddingBottom: isSidebarCollapsed ? '.2rem' : '1rem',
            },
            label: (
              <div
                style={{
                  display: 'flex',
                  flexFlow: 'row nowrap',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '1rem',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <GlobalOutlined />
                <Select
                  value={i18n.language}
                  className="w-full "
                  options={[
                    {
                      label: (
                        <span className="flex items-center gap-2">
                          <img
                            style={{ width: '20px', height: '12px' }}
                            src="https://img.freepik.com/free-vector/illustration-uk-flag_53876-18166.jpg?w=1800&t=st=1679225900~exp=1679226500~hmac=0cc9ee0d4d5196bb3c610ca92d669f3c0ebf95431423a2c4ff7196f81c10891e"
                            alt="english"
                            loading="eager"
                            referrerPolicy="no-referrer"
                          />{' '}
                          English
                        </span>
                      ),
                      value: 'en',
                    },
                    // { label: 'French', value: 'fr' },
                  ]}
                  onChange={(value) => {
                    i18n.changeLanguage(value);
                  }}
                />
              </div>
            ),
          },
          {
            key: 'profile',
            style: {
              paddingLeft: isSidebarCollapsed ? '.2rem' : '1rem',
              paddingRight: isSidebarCollapsed ? '.2rem' : '1rem',
              paddingTop: isSidebarCollapsed ? '.2rem' : '1rem',
              paddingBottom: isSidebarCollapsed ? '.2rem' : '1rem',
            },
            label: (
              <div
                style={{
                  display: 'flex',
                  flexFlow: 'row nowrap',
                  gap: '1rem',
                  alignItems: 'center',
                }}
                onClick={() => {
                  if (isSaasBuild) {
                    window.location = getAmuiProfileUrl() as any;
                    return;
                  }
                  navigate(resolveAppRoute(AppRoutes.PROFILE_ROUTE));
                }}
              >
                <UserOutlined /> {isSaasBuild ? 'Manage Account' : 'Profile'}
              </div>
            ),
          },
          {
            key: 'logout',
            style: {
              paddingLeft: isSidebarCollapsed ? '.2rem' : '1rem',
              paddingRight: isSidebarCollapsed ? '.2rem' : '1rem',
              paddingTop: isSidebarCollapsed ? '.2rem' : '1rem',
              paddingBottom: isSidebarCollapsed ? '.2rem' : '1rem',
            },
            label: (
              <div
                style={{
                  display: 'flex',
                  flexFlow: 'row nowrap',
                  gap: '1rem',
                  alignItems: 'center',
                }}
                onClick={() => {
                  storeLogout();
                  navigate(resolveAppRoute(AppRoutes.LOGIN_ROUTE));
                }}
              >
                <LogoutOutlined /> Logout
              </div>
            ),
          },
        ],
      },
    ];

    if (!isServerEE) {
      return menuItems.filter((item) => {
        if (!item) return false;
        const isDivider = 'type' in item && item.type === 'divider';
        if (isDivider) {
          const index = menuItems.indexOf(item);
          return index > 2;
        }
        const isDownloadRac = 'key' in item && item.key === 'download-rac';
        return !isDownloadRac;
      });
    }

    return menuItems;
  }, [store.username, isSidebarCollapsed, currentTheme, i18n, navigate, setCurrentTheme, storeLogout, isServerEE]);

  const getActiveSideNavKeys = useCallback(() => {
    if (location.pathname === resolveAppRoute(AppRoutes.NETWORKS_ROUTE)) {
      return ['networks', 'all-networks'];
    } else if (location.pathname === resolveAppRoute(AppRoutes.HOSTS_ROUTE)) {
      return ['hosts', 'all-hosts'];
    } else if (location.pathname === resolveAppRoute(AppRoutes.CLIENTS_ROUTE)) {
      return ['clients'];
    } else if (location.pathname === resolveAppRoute(AppRoutes.ENROLLMENT_KEYS_ROUTE)) {
      return ['enrollment-keys'];
    } else if (location.pathname === resolveAppRoute(AppRoutes.DASHBOARD_ROUTE)) {
      return ['dashboard'];
    } else if (location.pathname === resolveAppRoute(AppRoutes.USERS_ROUTE)) {
      return ['users'];
    }
  }, [location.pathname]);

  const checkLatestVersion = () => {
    if (isSaasBuild) return;
    try {
      const corsProxyUrl = 'https://cors-proxy.netmaker.io';
      const resourceUrl = 'https://github.com/gravitl/netmaker/releases';

      fetch(`${corsProxyUrl}/${resourceUrl}`)
        .then((res) => res.text())
        .then((data) => {
          const githubReleasesPage = new DOMParser().parseFromString(data, 'text/html');
          const latestVersion = githubReleasesPage.querySelectorAll('h2.sr-only')?.[1].textContent ?? '0.5';
          const uiVersion = getUiVersion();
          if (latestVersion && lt(uiVersion, latestVersion)) {
            if (isServerEE) setLatestNetmakerVersion(`${latestVersion}-ee`);
            else setLatestNetmakerVersion(latestVersion);
            setCanUpgrade(true);

            // animate version info to draw user attention
            const updateBtn = window.document.querySelector('.version-box .update-btn');
            updateBtn?.classList.add('animate__animated', 'animate__flash', 'animate__infinite');
            if (updateBtn) (updateBtn as HTMLElement).style.transform = 'scale(1.4)';
          }
        });
    } catch (err) {
      console.log(err);
    }
  };

  const openVersionUpgradeModal = () => {
    if (isSaasBuild) return;
    if (!canUpgrade) return;
    setIsVersionUpgradeModalOpen(true);

    // remove animations once user has go the update message
    const updateBtn = window.document.querySelector('.version-box .update-btn');
    updateBtn?.classList.remove('animate__animated', 'animate__flash', 'animate__infinite');
  };

  const contentMarginLeft = useMemo(() => {
    if (isSidebarCollapsed) {
      if (isSmallScreen) {
        return '0px';
      }
      return SIDE_NAV_COLLAPSED_WIDTH;
    }
    return SIDE_NAV_EXPANDED_WIDTH;
  }, [isSidebarCollapsed, isSmallScreen]);

  const hideContent = useMemo(() => {
    // get the current page size using window.innerWidth
    const width = window.innerWidth;
    return width < 576 && !isSidebarCollapsed;
  }, [isSidebarCollapsed, window.innerWidth]);

  const checkIfManagedHostIsLoading = useMemo(() => {
    // check if managed host is loading
    const isNewTenant = store.isNewTenant;
    const isManagedHostLoaded = store.hosts.some((host) => isManagedHost(host.name));
    return isSaasBuild && isNewTenant && !isManagedHostLoaded;
  }, [store.isNewTenant, store.hosts]);

  useEffect(() => {
    store.setSidebarWidth(contentMarginLeft);
  }, [contentMarginLeft]);

  useEffect(() => {
    if (store.serverStatus?.status?.trial_end_date) {
      const endDate = new Date(store.serverStatus.status.trial_end_date);
      setTrialEndDate(endDate);
    }
  }, [store.serverStatus]);

  const getTrialDaysRemainingText = useMemo(() => {
    let getTrialDaysRemaining = 0;
    if (trialEndDate) {
      const currentDate = new Date();
      const timeDifference = trialEndDate.getTime() - currentDate.getTime();
      getTrialDaysRemaining = Math.ceil(timeDifference / (1000 * 3600 * 24));
    }
    if (getTrialDaysRemaining === 1) {
      return `Your Pro trial ends on ${trialEndDate?.toDateString()} at ${trialEndDate?.toLocaleTimeString()}, you have less than a day left on your trial.`;
    } else if (getTrialDaysRemaining > 1) {
      return `Your Pro trial ends on ${trialEndDate?.toDateString()}, you have ${getTrialDaysRemaining} days left on your trial.`;
    } else {
      return `Your Pro trial ended on ${trialEndDate?.toDateString()} at ${trialEndDate?.toLocaleTimeString()}, please contact your administrator to renew your license.`;
    }
  }, [trialEndDate]);

  useEffect(() => {
    storeFetchNetworks();
    checkLatestVersion();
  }, [storeFetchNetworks]);

  const [isSidebarComponentCollapsed, setIsSidebarComponentCollapsed] = useState(false);

  return (
    <AppErrorBoundary key={location.pathname}>
      <Layout hasSider style={{ backgroundColor: 'transparent' }}>
        <Sider
          collapsible={false}
          collapsed={isSidebarCollapsed}
          onCollapse={(isCollapsed) => {
            setIsSidebarCollapsed(isCollapsed);
            store.setIsSidebarCollapsed(isCollapsed);
          }}
          collapsedWidth={isSmallScreen ? 0 : SIDE_NAV_COLLAPSED_WIDTH}
          theme="light"
          width={isSidebarComponentCollapsed ? '5rem' : '14rem'}
          style={{
            height: '100vh',
            position: isSmallScreen ? 'fixed' : 'sticky',
            left: 0,
            top: 0,
            bottom: 0,
            borderRight: `1px solid ${themeToken.colorBorder}`,
            zIndex: 1000,
          }}
          breakpoint="md"
          onBreakpoint={(broken: boolean) => {
            setIsSmallScreen(broken);
          }}
          zeroWidthTriggerStyle={{
            backgroundColor: 'transparent',
          }}
        >
          <Sidebar
            isSidebarCollapsed={isSidebarComponentCollapsed}
            setIsSidebarCollapsed={setIsSidebarComponentCollapsed}
          />
        </Sider>
        {/* main content */}
        <Layout
          className="site-layout"
          style={{
            transition: 'all 200ms',
            display: hideContent ? 'none' : 'block',
            position: 'relative',
            backgroundColor: 'transparent',
            height: '100%', // Changed to make layout take full height
          }}
        >
          <Content style={{ overflow: 'initial', minHeight: '100vh' }}>
            {/* managed host is loading */}
            {checkIfManagedHostIsLoading && (
              <Alert
                message="Managed host creation in progress (estimated completion time: 5 - 10 minutes)."
                type="info"
                showIcon
                icon={<LoadingOutlined />}
                style={{ marginBottom: '1rem' }}
              />
            )}

            {/* license status indicator */}
            {store.serverStatus?.status?.is_on_trial_license && (
              <Row>
                <Col xs={24}>
                  <Alert
                    type="warning"
                    showIcon
                    style={{ border: 'none', height: '3rem', fontSize: '1rem', color: '#D4B106' }}
                    message={
                      <span>
                        {getTrialDaysRemainingText}{' '}
                        <a href={ExternalLinks.PRO_UPGRADE_DOCS_LINK} target="_blank" rel="noreferrer">
                          Click here for info on how to setup pro license.
                        </a>
                      </span>
                    }
                  />
                </Col>
              </Row>
            )}

            {/* broker issues indicator */}
            {!store.serverStatus.status?.broker_connected && (
              <Row>
                <Col xs={24}>
                  <Alert
                    type="warning"
                    showIcon
                    style={{ border: 'none', height: '4rem', fontSize: '1rem', color: '#D4B106' }}
                    message="Your server is not connected to the broker, and the fallback mechanism will kick in. This may impact network performance. Contact your administrator."
                  />
                </Col>
              </Row>
            )}

            {/* server status indicator */}
            {!store.serverStatus.isHealthy && (
              <Row>
                <Col xs={24}>
                  <Alert
                    type="warning"
                    showIcon
                    style={{ border: 'none', height: '4rem', fontSize: '1rem', color: '#D4B106' }}
                    message={
                      !store.serverStatus.status?.healthyNetwork
                        ? `Unable to reach ${branding.productName} server. Check you internet connection.`
                        : `Your ${branding.productName} server is not running properly. This may impact network performance. Contact your administrator.`
                    }
                  />
                </Col>
              </Row>
            )}
            <Outlet />
          </Content>
        </Layout>
      </Layout>

      {/* misc */}
      {canUpgrade && (
        <VersionUpgradeModal
          isOpen={isVersionUpgradeModalOpen}
          latestNetmakerVersion={latestNetmakerVersion}
          onCancel={() => setIsVersionUpgradeModalOpen(false)}
        />
      )}
      <RacModal isOpen={isRacModalOpen} onClose={() => setIsRacModalOpen(false)} />
    </AppErrorBoundary>
  );
}
