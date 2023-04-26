import { NodeConnectivityStatus } from '@/models/NodeConnectivityStatus';
import { Tag } from 'antd';

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
  const minutes = duration / 60000000000;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.ceil(((minutes / 60) % 1) * 60);
  return { hours, min: remainingMinutes };
}
