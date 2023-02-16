import { StateCreator } from 'zustand';
import { Node } from '../models/Node';

export interface INodeSlice {
  nodes: Node[];
  setNodes: (nodes: Node[]) => void;
}

const createNodeSlice: StateCreator<INodeSlice, [], [], INodeSlice> = (set) => ({
  nodes: [],
  setNodes: (nodes: Node[]) => set((state) => ({ nodes })),
});

export const NodeSlice = {
  createNodeSlice,
};
