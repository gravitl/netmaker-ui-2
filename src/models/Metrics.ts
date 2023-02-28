export type NodeMetrics = Record<string, NodeMetricsContainer>;

export interface NodeMetricsContainer {
  connectivity: NodeMetricsTable;
}

export type NodeMetricsTable = Record<string, NodeMetric>;

export interface NodeMetric {
  node_name: string;
  uptime: number;
  totaltime: number;
  latency: number;
  totalreceived: number;
  totalsent: number;
  actualuptime: number;
  percentup: number;
  connected: boolean;
}

export type NetworkMetrics = Record<string, MetricsContainer>;

export interface MetricsContainer {
  nodes: MetricsTable;
}

export type MetricsTable = Record<string, NodeMetricsContainer>;
