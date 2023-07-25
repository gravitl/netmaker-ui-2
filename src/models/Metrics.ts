import { Network } from './Network';
import { ExtendedNode, Node } from './Node';

export interface NodeMetric {
  node_name: ExtendedNode['name'];
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
      connectivity: Record<Node['id'], NodeMetric>;
      needsfailover: Record<string, any>;
      network: Network['netid'];
      node_id: Node['id'];
      node_name: ExtendedNode['name'];
    }
  >;
};
