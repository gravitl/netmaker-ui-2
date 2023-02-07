import { create } from "zustand"
import { INodeSlice, NodeSlice } from "./nodes";

export const useStore = create<INodeSlice>()((...a) => ({
  ...NodeSlice.createNodeSlice(...a),
}))
