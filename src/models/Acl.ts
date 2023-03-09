import { MutableRequired } from '../utils/Types';
import { Node } from './Node';

// shape: { "node1": 2 }
// 2 = allow, 1 = deny
export type NodeACL = Record<Node['id'], number>;

// shape: { "node1": { "node1": 2, "node2": 1 } }
export type NodeACLContainer = MutableRequired<{ [nodeID: Node['id']]: NodeACL }>;
