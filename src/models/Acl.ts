import { MutableRequired } from '../utils/Types';
import { Node } from './Node';

export const ACL_ALLOWED = 2;
export const ACL_DENIED = 1;
export const ACL_UNDEFINED = 0;

export type AclStatus = typeof ACL_ALLOWED | typeof ACL_DENIED | typeof ACL_UNDEFINED;

// shape: { "node1": 2 }
// 2 = allow, 1 = deny
export type NodeAcl = Record<Node['id'], AclStatus>;

// shape: { "node1": { "node1": 2, "node2": 1 } }
export type NodeAclContainer = MutableRequired<{ [nodeID: Node['id']]: NodeAcl }>;
