import { MutableRequired } from '../utils/Types';
import { Node } from './Node';

export type NodeACL = Record<Node['id'], number>;

export type NodeACLContainer = MutableRequired<{ [nodeID: Node['id']]: NodeACL }>;
