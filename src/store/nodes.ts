import { NodesService } from '@/services/NodesService';
import { StateCreator } from 'zustand';
import { Node } from '../models/Node';
import { useStore } from './store';

export interface INodeSlice {
  nodes: Node[];
  isFetchingNodes: boolean;
  setNodes: (nodes: Node[]) => void;
  updateNode: (nodeId: Node['id'], newNode: Node) => void;
  deleteNode: (nodeId: Node['id']) => void;
  fetchNodes: () => Promise<void>;
}

const createNodeSlice: StateCreator<INodeSlice, [], [], INodeSlice> = (set, get) => ({
  nodes: [],
  isFetchingNodes: false,
  setNodes: (nodes: Node[]) => set(() => ({ nodes })),
  updateNode(nodeId, newNode) {
    set((state) => ({
      nodes: state.nodes.map((node) => {
        if (node.id === nodeId) {
          return newNode;
        }
        return node;
      }),
    }));
  },
  deleteNode(nodeId) {
    set((state) => ({ nodes: state.nodes.filter((node) => node.id !== nodeId) }));
  },
  async fetchNodes() {
    try {
      set(() => ({ isFetchingNodes: true }));
      // const nodes = (await NodesService.getNodes()).data ?? [];

      const networks = useStore.getState().networks;
      const res = await Promise.allSettled(networks.map((network) => NodesService.getNetworkNodes(network.netid)));
      const nodes: Node[] = [];
      res.forEach((result) => {
        if (result.status === 'fulfilled') {
          nodes.push(...result.value.data);
        }
      });
      nodes.sort((a, b) => a.id.localeCompare(b.id));
      set(() => ({ nodes, isFetchingNodes: false }));
    } catch (err) {
      console.error(err);
    }
  },
});

export const NodeSlice = {
  createNodeSlice,
};
