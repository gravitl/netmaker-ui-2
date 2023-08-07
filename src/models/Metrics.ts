import { ExternalClient } from './ExternalClient';
import { Network } from './Network';
import { ExtendedNode, Node } from './Node';

export interface NodeOrClientMetric {
  node_name: ExtendedNode['name'] | ExternalClient['clientid'];
  connected: boolean;
  actualuptime: number;
  uptime: number;
  percentup: number;
  latency: number;
  totalreceived: number;
  totalsent: number;
  totaltime: number;
}

export type NetworkMetrics = {
  nodes: Record<
    Node['id'],
    {
      connectivity: Record<Node['id'], NodeOrClientMetric>;
      needsfailover: Record<string, any>;
      network: Network['netid'];
      node_id: Node['id'];
      node_name: ExtendedNode['name'];
    }
  >;
};

export interface UptimeNodeMetrics {
  uptime: number;
  fractionalUptime: number;
  totalFractionalUptime: number;
  uptimePercent: number | string;
}

export type MetricCategories =
  | 'connectivity-status'
  | 'latency'
  | 'bytes-sent'
  | 'bytes-received'
  | 'uptime'
  | 'clients';
