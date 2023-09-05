import { Host } from '@/models/Host';
import { Node } from '@/models/Node';
import { NodeConnectivityStatus } from '@/models/NodeConnectivityStatus';
import { Col, FormInstance, Progress, Row, Space, Tag, Tooltip, Typography } from 'antd';
import { getNodeConnectivityStatus } from './NodeUtils';
import { ExtClientAcls, ExternalClient } from '@/models/ExternalClient';
import { ACL_ALLOWED, ACL_DENIED, AclStatus, ACL_UNDEFINED } from '@/models/Acl';
import { CloseOutlined } from '@ant-design/icons';
import { MetricCategories, UptimeNodeMetrics } from '@/models/Metrics';
import { ReactNode, useEffect, useState } from 'react';
import {
  DEFAULT_BRANDING_CONFIG,
  METRIC_LATENCY_DANGER_THRESHOLD,
  METRIC_LATENCY_WARNING_THRESHOLD,
} from '@/constants/AppConstants';
import { Rule } from 'antd/es/form';
import { useStore } from '@/store/store';
import { BrandingConfig } from '@/models/BrandingConfig';
import { isSaasBuild } from '@/services/BaseService';

export function renderNodeHealth(health: NodeConnectivityStatus) {
  switch (health) {
    case 'unknown':
      return <Tag>Unknown</Tag>;
    case 'error':
      return <Tag color="error">Error</Tag>;
    case 'warning':
      return <Tag color="warning">Warning</Tag>;
    case 'healthy':
      return <Tag color="success">Healthy</Tag>;
  }
}

export function getTimeMinHrs(duration: number) {
  // TODO: review this calc
  const minutes = duration / 60_000_000_000;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.ceil(((minutes / 60) % 1) * 60);
  return { hours, min: remainingMinutes };
}

// Gets host health as the worst health of associated nodes
export function getHostHealth(
  hostId: Host['id'],
  hostNodes: Node[],
  shouldRender = true,
): JSX.Element | NodeConnectivityStatus {
  const nodeHealths = hostNodes
    .filter((n) => n.hostid === hostId)
    .map((n) => getNodeConnectivityStatus(n))
    .map((h) => {
      switch (h) {
        case 'healthy':
          return 3;
        case 'warning':
          return 2;
        case 'error':
          return 1;
        default:
          return 0;
      }
    })
    .filter((h) => h !== 0);

  let worstHealth = Number.MAX_SAFE_INTEGER;
  nodeHealths.forEach((h) => {
    worstHealth = Math.min(worstHealth, h);
  });

  switch (worstHealth) {
    default:
      return shouldRender ? <Tag>Unknown</Tag> : 'unknown';
    case 1:
      return shouldRender ? <Tag color="error">Error</Tag> : 'error';
    case 2:
      return shouldRender ? <Tag color="warning">Warning</Tag> : 'warning';
    case 3:
      return shouldRender ? <Tag color="success">Healthy</Tag> : 'healthy';
  }
}

const DEFAULT_CONFIRM_DIRTY_MODAL_CLOSE_MSG =
  'Closing the modal will lose any unsaved changes. Do you want to proceed?';
/**
 * Confirm whether to proceed with closing a modal if any of the forms are dirty.
 *
 * @param forms array of forms to verify
 * @param msg prompt to display
 * @returns whether to proceed or not
 */
export function confirmDirtyModalClose(forms: FormInstance[], msg = DEFAULT_CONFIRM_DIRTY_MODAL_CLOSE_MSG): boolean {
  if (forms.some((f) => f.isFieldsTouched())) {
    return confirm(msg);
  }
  return true;
}

function parseJwt(token: string) {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(
    window
      .atob(base64)
      .split('')
      .map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      })
      .join(''),
  );

  return JSON.parse(jsonPayload);
}

/**
 * Checks if a jwt is valid.
 *
 * @param jwt
 * @returns whether the jwt is valid or not
 */
export function isValidJwt(jwt: string): boolean {
  try {
    const json = parseJwt(jwt);
    return (json?.exp ?? 0) > Date.now() / 1000;
  } catch (err) {
    return false;
  }
}

/**
 * Checks whether a node or client is allowed or denied.
 *
 * @param nodeOrClientId node or client id to check
 * @param clientOrClientAcl client or client ACL to check against
 * @returns whether the node or client is allowed or denied
 */
export function getExtClientAclStatus(
  nodeOrClientId: Node['id'] | ExternalClient['clientid'],
  clientOrClientAcl: ExternalClient | ExtClientAcls,
): AclStatus {
  // check if it is a client
  if (clientOrClientAcl.clientid) {
    if (nodeOrClientId === clientOrClientAcl.clientid) return ACL_UNDEFINED;
    if (!clientOrClientAcl.deniednodeacls) return ACL_ALLOWED;
    if (nodeOrClientId in clientOrClientAcl.deniednodeacls) {
      return ACL_DENIED;
    }
    return ACL_ALLOWED;
  } else {
    // ExtClientAcls was passed
    if (!clientOrClientAcl) return ACL_ALLOWED;
    if (nodeOrClientId in clientOrClientAcl) {
      return ACL_DENIED;
    }
    return ACL_ALLOWED;
  }
}

/**
 * Gets the formatted data in bytes, KiB, MiB, GiB, or TiB.
 *
 * @param data data in bytes
 * @returns data with unit
 */
export function getFormattedData(data: number): string {
  let unit = '';
  let value = '';

  // derive unit
  if (data > 1000000000000) {
    unit = 'TiB';
  } else if (data > 1000000000) {
    unit = 'GiB';
  } else if (data > 1000000) {
    unit = 'MiB';
  } else if (data > 1000) {
    unit = 'KiB';
  } else {
    unit = 'B';
  }

  // derive value
  if (data > 1000000000000) {
    value = (data / 1000000000000).toFixed(2);
  } else if (data > 1000000000) {
    value = (data / 1000000000).toFixed(2);
  } else if (data > 1000000) {
    value = (data / 1000000).toFixed(2);
  } else if (data > 1000) {
    value = (data / 1000).toFixed(2);
  } else {
    value = data.toFixed(2);
  }

  return `${value} (${unit})`;
}

/**
 * Gets the formatted time in hours and minutes.
 *
 * @param time unix time
 * @returns formatted time in hrs and mins
 */
export function getFormattedTime(time: number): string {
  let timeString = '';
  if (time) {
    const { hours, min } = getTimeMinHrs(time);
    timeString = `${hours}h${min}m`;
  } else {
    timeString = '0h0m';
  }
  return timeString;
}

/**
 * Renders a metric value.
 *
 * @param metricType type to render
 * @param value metric value
 * @returns rendered metric value as a react node
 */
export function renderMetricValue(metricType: MetricCategories, value: unknown): ReactNode {
  let fractionalDowntime: number;
  let downtime: number;

  switch (metricType) {
    default:
      return <></>;
      break;
    case 'connectivity-status':
      if (value === true) {
        return (
          <div
            data-testid={`connectivity-metric-${value}`}
            style={{
              border: '2px solid #49AA19',
              borderRadius: '50%',
              background: '#162312',
              width: '15px',
              height: '15px',
            }}
          ></div>
        );
      }
      return <CloseOutlined style={{ color: '#D32029' }} />;
      break;
    case 'latency':
      return (
        <Typography.Text
          data-testid={`latency-metric-${value}`}
          style={{
            color:
              (value as number) > METRIC_LATENCY_DANGER_THRESHOLD
                ? '#D32029'
                : (value as number) > METRIC_LATENCY_WARNING_THRESHOLD
                ? '#D8BD14'
                : undefined,
          }}
        >
          {value as number} ms
        </Typography.Text>
      );
      break;
    case 'bytes-sent':
      return (
        <Typography.Text data-testid={`bytes-sent-metric-${value}`}>
          {getFormattedData(value as number)}
        </Typography.Text>
      );
      break;
    case 'bytes-received':
      return (
        <Typography.Text data-testid={`bytes-received-metric-${value}`}>
          {getFormattedData(value as number)}
        </Typography.Text>
      );
      break;
    case 'uptime':
      fractionalDowntime =
        (value as UptimeNodeMetrics).totalFractionalUptime / (value as UptimeNodeMetrics).fractionalUptime;
      downtime =
        (fractionalDowntime * (value as UptimeNodeMetrics).uptime) / (value as UptimeNodeMetrics).fractionalUptime;
      return (
        <Tooltip
          title={
            <Space style={{ width: '8rem' }} direction="vertical">
              <Row>
                <Col xs={12}>
                  <Progress showInfo={false} percent={100} status="exception" />
                </Col>
                <Col xs={12} style={{ textAlign: 'right' }}>
                  {getFormattedTime(downtime)}
                </Col>
              </Row>
              <Row>
                <Col xs={12}>
                  <Progress showInfo={false} percent={100} status="success" />
                </Col>
                <Col xs={12} style={{ textAlign: 'right' }}>
                  {getFormattedTime((value as UptimeNodeMetrics).uptime)}
                </Col>
              </Row>
            </Space>
          }
        >
          <Progress
            data-testid={`uptime-metric-${JSON.stringify(value || {})}`}
            style={{ width: '3rem' }}
            showInfo={false}
            type="line"
            percent={100}
            success={{ percent: Number((value as UptimeNodeMetrics).uptimePercent) }}
          />{' '}
          {(value as UptimeNodeMetrics).uptimePercent}%
        </Tooltip>
      );
      break;
  }
}

const validateEmail = (_: any, value: string) => {
  const regex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/; // Regular expression for email validation

  if (regex.test(value)) {
    return Promise.resolve();
  } else {
    return Promise.reject('Please enter a valid email address.');
  }
};

const validateName = (fieldName: string): Rule[] => [
  { required: false, message: `Please enter a ${fieldName}.` },
  {
    validator: (_: any, value: string) => {
      const regex = /^[A-Z][a-zA-Z ]*$/;
      if (regex.test(value)) {
        return Promise.resolve();
      } else {
        return Promise.reject(`${fieldName} should start with a capital letter and contain only alphabets.`);
      }
    },
  },
];

const validateSpecialCharactersWithNumbers = (_: any, value: string) => {
  const regex = /^[a-zA-Z0-9\s]+$/; // Regular expression to allow only alphabetic characters, numbers and spaces

  if (!regex.test(value)) {
    return Promise.reject('Special characters are not allowed.');
  } else {
    return Promise.resolve();
  }
};

export const validatePlainTextFieldWithNumbersButNotRequired: Rule[] = [
  { required: false, message: 'Please enter a value.' },
  { validator: validateSpecialCharactersWithNumbers },
];

export const validateEmailField: Rule[] = [
  { required: true, message: 'Please enter a value.' },
  { validator: validateEmail },
];

export const validateLastNameField = validateName('last name');
export const validateFirstNameField = validateName('first name');

/**
 * Hook to get app branding configuration.
 *
 * @returns the branding config
 */
export function useBranding(): BrandingConfig {
  const serverStatus = useStore((s) => s.serverStatus);

  const [branding, setBranding] = useState<BrandingConfig>(DEFAULT_BRANDING_CONFIG);

  useEffect(() => {
    if (isSaasBuild) {
      setBranding(DEFAULT_BRANDING_CONFIG);
    }
    if (serverStatus?.status?.is_pro) {
      setBranding({
        productName: import.meta.env.VITE_PRODUCT_NAME || DEFAULT_BRANDING_CONFIG.productName,
        logoDarkUrl: import.meta.env.VITE_TENANT_LOGO_DARK_URL || DEFAULT_BRANDING_CONFIG.logoDarkUrl,
        logoLightUrl: import.meta.env.VITE_TENANT_LOGO_LIGHT_URL || DEFAULT_BRANDING_CONFIG.logoLightUrl,
        logoAltText: import.meta.env.VITE_TENANT_LOGO_ALT_TEXT || DEFAULT_BRANDING_CONFIG.logoAltText,
        logoDarkSmallUrl:
          import.meta.env.VITE_TENANT_LOGO_DARK_SMALL_URL ||
          import.meta.env.VITE_TENANT_LOGO_DARK_URL ||
          DEFAULT_BRANDING_CONFIG.logoDarkSmallUrl,
        logoLightSmallUrl:
          import.meta.env.VITE_TENANT_LOGO_LIGHT_SMALL_URL ||
          import.meta.env.VITE_TENANT_LOGO_LIGHT_URL ||
          DEFAULT_BRANDING_CONFIG.logoLightSmallUrl,
        favicon:
          import.meta.env.VITE_TENANT_FAVICON_URL ||
          import.meta.env.VITE_TENANT_LOGO_LIGHT_SMALL_URL ||
          import.meta.env.VITE_TENANT_LOGO_LIGHT_URL ||
          DEFAULT_BRANDING_CONFIG.favicon,
        primaryColor: import.meta.env.VITE_TENANT_PRIMARY_COLOR || DEFAULT_BRANDING_CONFIG.primaryColor,
      });
    } else {
      setBranding(DEFAULT_BRANDING_CONFIG);
    }
  }, [serverStatus?.status?.is_pro]);

  return branding;
}
