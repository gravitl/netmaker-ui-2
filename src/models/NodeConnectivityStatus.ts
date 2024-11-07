export type NodeConnectivityStatus =
  | 'healthy'
  | 'warning'
  | 'error'
  | 'disconnected'
  | 'unknown'
  | 'enabled'
  | 'disabled';

export const HOST_HEALTH_STATUS = {
  healthy: 'healthy',
  error: 'error',
  unknown: 'unknown',
  warning: 'warning',
};
