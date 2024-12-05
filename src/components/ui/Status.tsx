import { type NodeConnectivityStatus } from '@/models/NodeConnectivityStatus';
import { Col, Modal, notification, Row } from 'antd';
import { CircleCheckIcon, CircleSlashIcon, CircleXIcon, TriangleAlertIcon } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../shadcn/accordion';
import { Node } from '@/models/Node';
import { useStore } from '@/store/store';
import { useBranding, useServerLicense } from '@/utils/Utils';
import { Button } from '../shadcn/Button';
import { getExtendedNode } from '@/utils/NodeUtils';
import { NULL_NODE } from '@/constants/Types';
import { NetworksService } from '@/services/NetworksService';
import { NodesService } from '@/services/NodesService';
import { HostsService } from '@/services/HostsService';
import { Host } from '@/models/Host';
import { isSaasBuild } from '@/services/BaseService';
import { useIntercom } from 'react-use-intercom';

interface StatusProps {
  nodeHealth: NodeConnectivityStatus;
  nodeId?: Node['id'];
  clickable?: boolean;
}

type PossibleIssue =
  | 'firewall-setup'
  | 'not-connected-to-failover'
  | 'failover-missing'
  | 'failover-connection-not-working';

export default function NodeStatus(props: StatusProps) {
  const store = useStore();
  const branding = useBranding();
  const { show: showIntercom } = useIntercom();
  const { isServerEE } = useServerLicense();
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  let possibleIssues: PossibleIssue[] = [];

  const node = useMemo(() => store.nodes.find((n) => n.id === props.nodeId), [props.nodeId]);

  const getTextColor = () => {
    switch (props.nodeHealth) {
      case 'online':
      case 'enabled':
        return '#00ba34';
      case 'warning':
        return '#C98C07';
      case 'error':
        return '#f43f5e';
      case 'offline':
      case 'disabled':
        return '#D4D4D4';
      case 'unknown':
        return '#D4D4D4';
      default:
        return '#D4D4D4';
    }
  };

  const getBgColor = () => {
    switch (props.nodeHealth) {
      case 'online':
      case 'enabled':
        return '#07C98D1A';
      case 'warning':
        return '#C98C071A';
      case 'error':
        return '#E32C081A';
      case 'offline':
      case 'disabled':
        return '#D4D4D41A';
      case 'unknown':
        return '#D4D4D41A';
      default:
        return '#D4D4D41A';
    }
  };

  const getStatusText = (infoModalTitle = false) => {
    switch (props.nodeHealth) {
      case 'online':
      case 'enabled':
        return infoModalTitle ? (
          <span className="inline-flex justify-center">
            <CircleCheckIcon className="inline-block mr-2 text-success" /> Node{' '}
            {props.nodeHealth === 'enabled' ? ' Enabled' : ' Online'}
          </span>
        ) : props.nodeHealth === 'enabled' ? (
          'Enabled'
        ) : (
          'Online'
        );
      case 'warning':
        return infoModalTitle ? (
          <span className="inline-flex justify-center">
            <TriangleAlertIcon className="inline-block mr-2 text-yellow-600" /> Degraded Performance
          </span>
        ) : (
          'Warning'
        );
      case 'error':
        return infoModalTitle ? (
          <span className="inline-flex justify-center">
            <CircleXIcon className="inline-block mr-2 text-critical" /> Connection Lost
          </span>
        ) : (
          'Error'
        );
      case 'offline':
      case 'disabled':
        return infoModalTitle ? (
          <span className="inline-flex justify-center">
            <CircleSlashIcon className="inline-block mr-2 text-neutral-600" /> Node{' '}
            {props.nodeHealth === 'disabled' ? ' Disabled' : ' Offline'}
          </span>
        ) : props.nodeHealth === 'disabled' ? (
          'Disabled'
        ) : (
          'Offline'
        );
      default:
        return infoModalTitle ? (
          <span className="inline-flex justify-center">
            <CircleSlashIcon className="inline-block mr-2 text-neutral-600" /> Unknown Node Status
          </span>
        ) : (
          'Unknown'
        );
    }
  };

  const getStatusDesc = () => {
    switch (props.nodeHealth) {
      case 'online':
        return 'Node is healthy and connected. All systems are functioning normally.';
      case 'warning':
        return 'Node connectivity is degraded. Network performance may be affected.';
      case 'error':
        return 'Node connection lost. Check network settings or re-sync the node.';
      case 'offline':
        return 'Node is disconnected from the network. You can connect to restore connection.';
      default:
        return "Node's status is unknown. It may no longer be connected to any network on this server.";
    }
  };

  const performResolution = useCallback(
    async (issue: PossibleIssue) => {
      try {
        const networkNodes = store.nodes.filter((n) => n.network === node?.network);
        const hostsMap = store.hosts.reduce(
          (acc, host) => {
            acc[host.id] = host;
            return acc;
          },
          {} as Record<string, Host>,
        );
        const firstDefaultNode = networkNodes.find((n) => hostsMap[n.hostid]?.isdefault);
        const networkFailover = networkNodes.find((n) => n.is_fail_over);
        const firstRelayNode = networkNodes.find((n) => n.isrelay && n.id !== props.nodeId);
        const anyOtherNonRelayNode = networkNodes.find((n) => n.id !== props.nodeId && !n.isrelay);

        switch (issue) {
          case 'failover-missing':
            if (firstDefaultNode) {
              await NodesService.setNodeAsFailover(firstDefaultNode.id);
            } else {
              notification.info({
                message: 'Set a failover device from the Nodes page',
                description: 'Could not find a default node to set as failover. Please set a failover device manually.',
              });
            }
            return;
          case 'not-connected-to-failover':
            try {
              await NodesService.resetFailover(node?.network ?? '');
              notification.success({
                message: 'Failover reset successful',
              });
            } catch (err) {
              console.error(err);
              notification.error({
                message: 'Failed to reset failover',
                description: 'An error occurred while trying to reset the failover. Please try again.',
              });
            }
            return;
          case 'failover-connection-not-working':
            if (firstDefaultNode?.isrelay) {
              await NodesService.updateNode(firstDefaultNode.id, firstDefaultNode.network, {
                ...firstDefaultNode,
                relaynodes: [...(firstDefaultNode.relaynodes ?? []), props.nodeId!],
              });
              return;
            }
            if (firstRelayNode) {
              await NodesService.updateNode(firstRelayNode.id, firstRelayNode.network, {
                ...firstRelayNode,
                relaynodes: [...(firstRelayNode.relaynodes ?? []), props.nodeId!],
              });
              return;
            }

            // create a relay node
            if (networkNodes.length > 0) {
              await NodesService.createRelay(
                anyOtherNonRelayNode?.id ?? NULL_NODE.id,
                anyOtherNonRelayNode?.network ?? '',
                {
                  nodeid: anyOtherNonRelayNode?.id ?? NULL_NODE.id,
                  netid: node?.network ?? '',
                  relayaddrs: [props.nodeId!],
                },
              );
            } else {
              notification.info({
                message: 'Add another host and create a relay node from the Nodes page',
                description: 'Could not find any node to relay through. Please create a relay node manually.',
              });
              return;
            }
        }
        notification.success({
          message: 'Resolution successful',
          description: 'The issue with this device has been resolved successfully.',
        });
      } catch (err) {
        console.error(err);
        notification.error({
          message: 'Failed to resolve issue',
          description: 'An error occurred while trying to resolve the issue. Please try again.',
        });
      }
    },
    [node?.network, props.nodeId, store.hosts, store.nodes],
  );

  const getIssueDetails = (issue: PossibleIssue) => {
    const node = store.nodes.find((n) => n.id === props.nodeId);
    const networkFailover = getExtendedNode(
      store.nodes.find((n) => n.network === node?.network && n.is_fail_over) ?? NULL_NODE,
      store.hostsCommonDetails,
    );

    switch (issue) {
      case 'firewall-setup':
        return {
          title: 'Check your firewall setup',
          desc: (
            <>
              <p>
                Devices connected to {branding.productName} need to communicate with a server. Ensure outbnound traffic
                to the server IP address <code>{store.serverConfig?.PublicIp || ''}</code> and port 443 (TCP and UDP)
                are allowed on the device&apos;s firewall settings.
              </p>
            </>
          ),
        };
      case 'not-connected-to-failover':
        return {
          title: 'Connect to the failover device',
          desc: (
            <>
              <p>
                This device is not connected to the failover, and is therefore not reachable by some or all devices. To
                ensure high availability, connect to the failover.
              </p>
              <div className="text-right">
                <Button size="sm" onClick={() => performResolution(issue)} title="Reset failover device connections">
                  Refresh failover
                </Button>
              </div>
            </>
          ),
        };
      case 'failover-missing':
        return {
          title: 'Set a failover device',
          desc: (
            <>
              <p>
                There is no failover device on your network. To ensure high availability, assign one device to act as a
                failover, to automatically route traffic to the destination device when a direct route is unusable.
              </p>
              <div className="text-right">
                <Button
                  size="sm"
                  onClick={() => performResolution(issue)}
                  title="Automatically set a preferred device as failover"
                >
                  Assign failover
                </Button>
              </div>
            </>
          ),
        };
      case 'failover-connection-not-working':
        return {
          title: 'Ensure failover firewall settings',
          desc: (
            <>
              <p>
                This device is not able to communicate with the network-assigned failover. Ensure the firewall settings
                are correctly configured. Allow outbound traffic to the failover device&apos;s IP address (
                {[networkFailover.endpointip, networkFailover.endpointipv6].concat(' or ')}) and port UDP and TCP (
                {networkFailover.listenport})
              </p>
              <p>If the issue persists, you can use a relay node to connect to the network.</p>
              <Button size="sm" onClick={() => performResolution(issue)} title="Automatically relay this device">
                Relay this device
              </Button>
            </>
          ),
        };
    }
  };

  if (props.nodeId) {
    // deduce possible issues
    const node = store.nodes.find((n) => n.id === props.nodeId);
    const networkHasFailover = store.nodes.some((n) => n.is_fail_over);

    if (networkHasFailover) {
      if (node?.is_fail_over) {
        // check if the node is a the failover itself
        possibleIssues = ['firewall-setup'];
      } else {
        if (!node?.failed_over_by && !node?.isrelay && !node?.isrelayed) {
          // check if the node is not being failed over
          possibleIssues = ['not-connected-to-failover'];
        } else {
          // if it is being failed over already, allow firewall or advise to connect to a relay
          possibleIssues = ['failover-connection-not-working'];
        }
      }
    } else {
      possibleIssues = ['failover-missing'];
    }
  }

  return (
    <>
      <span
        className="rounded-full text-nowrap whitespace-nowrap"
        style={{
          padding: '.2rem .5rem',
          color: getTextColor(),
          backgroundColor: getBgColor(),
          cursor: props.clickable ? 'pointer' : 'default',
        }}
        onClick={() => {
          if (!props.clickable) return;
          setIsInfoModalOpen(true);
        }}
      >
        &#9679; {getStatusText()}
      </span>

      {/* modals */}
      <Modal
        title={getStatusText(true)}
        open={isInfoModalOpen}
        width="30vw"
        onCancel={() => setIsInfoModalOpen(false)}
        footer={null}
        centered
      >
        <hr className="border-neutral-700" />
        <Row style={{ marginTop: '2rem' }}>
          <Col span={24}>{getStatusDesc()}</Col>
        </Row>
        {(props.nodeHealth === 'warning' || props.nodeHealth === 'error') && (
          <Row style={{ marginTop: '2rem' }}>
            <Col span={24}>
              <Accordion type="single" collapsible className="w-full">
                {possibleIssues.map((issue, i) => (
                  <AccordionItem key={`issue-${i}`} value={issue}>
                    <AccordionTrigger>{getIssueDetails(issue)['title']}</AccordionTrigger>
                    <AccordionContent>{getIssueDetails(issue)['desc']}</AccordionContent>
                  </AccordionItem>
                ))}
                <AccordionItem key="contact-us" value="contact-us">
                  <AccordionTrigger>Contact Support</AccordionTrigger>
                  <AccordionContent>
                    {isSaasBuild && (
                      <p>
                        If you are unable to resolve this issue, please{' '}
                        <a
                          href="#"
                          onClick={() => {
                            showIntercom();
                          }}
                          className="underline"
                        >
                          contact our support team for assistance
                        </a>
                        .
                      </p>
                    )}
                    {!isSaasBuild && (
                      <p>
                        If you are unable to resolve this issue, please{' '}
                        <a
                          target="_blank"
                          href={isServerEE ? 'mailto:help@netmaker.io' : 'https://discord.gg/zRb9Vfhk8A'}
                          rel="noreferrer"
                          className="underline"
                        >
                          contact our support team for assistance
                        </a>
                        .
                      </p>
                    )}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </Col>
          </Row>
        )}
        {props.nodeHealth === 'offline' && !node?.connected && (
          <Row style={{ marginTop: '2rem' }}>
            <Col span={24}>
              <div className="text-right">
                <Button
                  variant="default"
                  size="sm"
                  onClick={async () => {
                    try {
                      if (!node) return;
                      await NodesService.updateNode(node.id, node.network, { ...node, connected: true });
                      notification.success({
                        message: 'Node connected successfully',
                        description: 'The node has been connected to the network successfully.',
                      });
                      setIsInfoModalOpen(false);
                    } catch (err) {
                      console.error(err);
                      notification.error({
                        message: 'Failed to connect node',
                        description: 'An error occurred while trying to connect the node. Please try again.',
                      });
                    }
                  }}
                >
                  Reconnect Node
                </Button>
              </div>
            </Col>
          </Row>
        )}
      </Modal>
    </>
  );
}
