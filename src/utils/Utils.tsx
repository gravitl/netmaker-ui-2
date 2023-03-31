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
