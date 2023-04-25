import { NodesService } from '@/services/NodesService';
import { StateCreator } from 'zustand';
import { Node } from '../models/Node';

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
  setNodes: (nodes: Node[]) => set((state) => ({ nodes })),
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
      set((state) => ({ isFetchingNodes: true }));
      const nodes = (await NodesService.getNodes()).data ?? [];
      set((state) => ({ nodes, isFetchingNodes: false }));
    } catch (err) {
      console.error(err);
    }
  },
});

export const NodeSlice = {
  createNodeSlice,
};
