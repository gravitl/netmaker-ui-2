import { NULL_HOST } from '@/constants/Types';
import { ExternalClient } from '@/models/ExternalClient';
import { Host, HostCommonDetails } from '@/models/Host';
import { ExtendedNode, Node } from '@/models/Node';
import { NodeConnectivityStatus } from '@/models/NodeConnectivityStatus';

/**
 * Calculates node connectivity using last check-in time.
 *
 * @param {number} lastCheckInTime node's last check-in time
 */
export function getConnectivityStatus(lastCheckInTime: number): NodeConnectivityStatus {
  const ERROR_THRESHOLD = 1800;
  const WARNING_THRESHOLD = 300;

  const currentTime = Date.now() / 1000;

  if (lastCheckInTime === undefined || lastCheckInTime === null) return 'unknown';
  else if (currentTime - lastCheckInTime >= ERROR_THRESHOLD) return 'error';
  else if (currentTime - lastCheckInTime >= WARNING_THRESHOLD) return 'warning';
  else return 'healthy';
}

/**
 * Calculates node connectivity using last check-in time.
 *
 * @param {Node} node the node whose connectivity is to be checked
 */
export function getNodeConnectivityStatus(node: Node | ExternalClient): NodeConnectivityStatus {
  return getConnectivityStatus((node as Node).lastcheckin);
}

/**
 * Derives the extended node for a given node.
 * This includes certain details from the associated host.
 *
 * @param node node to get extended version
 * @param hostCommonDetails all host common details
 * @returns node with associated common host details
 */
export function getExtendedNode(node: Node, hostCommonDetails: Record<string, HostCommonDetails>): ExtendedNode {
  const hostDetails = hostCommonDetails[node.hostid];
  return { ...node, ...(hostDetails ? hostDetails : NULL_HOST) };
}

/**
 * Detemine whether the passed node is a relay or not.
 *
 * @param node Node to determine if is a relay or not
 * @returns whether node is a relay or not
 */
export function isNodeRelay(node: Node): boolean {
  if (node.relaynodes) return node.relaynodes.length > 0;
  return false;
}

/**
 * Util to determine if a host is behind a NAT or not.
 *
 * @param host host to check if is natted
 * @returns whether host is behind a NAT or not
 */
export function isHostNatted(host: Host): boolean {
  return host.nat_type !== undefined && host.nat_type !== null && host.nat_type !== '' && host.nat_type !== 'public';
}
