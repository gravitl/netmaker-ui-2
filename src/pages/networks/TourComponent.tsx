import { UsecaseQuestionKey } from '@/constants/NetworkUseCases';
import { MetricCategories } from '@/models/Metrics';
import { ExtendedNode } from '@/models/Node';
import { useStore } from '@/store/store';
import { useServerLicense } from '@/utils/Utils';
import { Tour, TourProps, notification } from 'antd';
import { NotificationInstance } from 'antd/es/notification/interface';
import { t, use } from 'i18next';
import { current } from 'immer';
import { set } from 'lodash';
import { useRef, Fragment, Ref, RefObject, useMemo, useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

export interface JumpToTourStepObj {
  overview: number;
  hosts: number;
  remoteAccess: number;
  vpnConfigs: number;
  relays: number;
  egress: number;
  dns: number;
  acls: number;
  graph: number;
  metrics: number;
  remoteAccessGatewayModal: number;
  remoteAccessVPNConfigModal: number;
  addEgressModal: number;
}

interface TourUtilsProps {
  overviewTabContainerRef: RefObject<HTMLDivElement>;
  hostsTabContainerTableRef: RefObject<HTMLDivElement>;
  hostsTabContainerAddHostsRef: RefObject<HTMLDivElement>;
  connectHostModalEnrollmentKeysTabRef: RefObject<HTMLDivElement>;
  connectHostModalSelectOSTabRef: RefObject<HTMLDivElement>;
  connectHostModalJoinNetworkTabRef: RefObject<HTMLDivElement>;
  remoteAccessTabGatewayTableRef: RefObject<HTMLDivElement>;
  remoteAccessTabAddGatewayRef: RefObject<HTMLDivElement>;
  addClientGatewayModalHostRef: RefObject<HTMLDivElement>;
  addClientGatewayModalDefaultClientDNSRef: RefObject<HTMLDivElement>;
  addClientGatewayModalIsInternetGatewayRef: RefObject<HTMLDivElement>;
  remoteAccessTabVPNConfigTableRef: RefObject<HTMLDivElement>;
  remoteAccessTabDisplayAllVPNConfigsRef: RefObject<HTMLDivElement>;
  remoteAccessTabDownloadClientRef: RefObject<HTMLDivElement>;
  remoteAccessTabVPNConfigCreateConfigRef: RefObject<HTMLDivElement>;
  remoteAccessAddOrRemoveUsersRef: RefObject<HTMLDivElement>;
  remoteAccessManageUsersRef: RefObject<HTMLDivElement>;
  createClientConfigModalSelectGatewayRef: RefObject<HTMLDivElement>;
  createClientConfigModalClientIDRef: RefObject<HTMLDivElement>;
  createClientConfigModalPublicKeyRef: RefObject<HTMLDivElement>;
  createClientConfigModalDNSRef: RefObject<HTMLDivElement>;
  createClientConfigModalAdditionalAddressesRef: RefObject<HTMLDivElement>;
  createClientConfigModalPostUpRef: RefObject<HTMLDivElement>;
  createClientConfigModalPostDownRef: RefObject<HTMLDivElement>;
  relaysTabRelayTableRef: RefObject<HTMLDivElement>;
  relaysTabAddRelayRef: RefObject<HTMLDivElement>;
  createRelayModalSelectHostRef: RefObject<HTMLDivElement>;
  relaysTabRelayedHostsTableRef: RefObject<HTMLDivElement>;
  relaysTabAddRelayedNodesRef: RefObject<HTMLDivElement>;
  relaysTabDisplayAllRelayedHostsRef: RefObject<HTMLDivElement>;
  addRelayedHostModalSelectHostRef: RefObject<HTMLDivElement>;
  egressTabEgressTableRef: RefObject<HTMLDivElement>;
  egressTabAddEgressRef: RefObject<HTMLDivElement>;
  createEgressModalSelectHostRef: RefObject<HTMLDivElement>;
  createEgressModalEnableNATRef: RefObject<HTMLDivElement>;
  createEgressModalSelectExternalRangesRef: RefObject<HTMLDivElement>;
  egressTabExternalRoutesTableRef: RefObject<HTMLDivElement>;
  egressTabAddExternalRouteRef: RefObject<HTMLDivElement>;
  egressTabDisplayAllExternalRoutesRef: RefObject<HTMLDivElement>;
  dnsTabDNSTableRef: RefObject<HTMLDivElement>;
  dnsTabAddDNSRef: RefObject<HTMLDivElement>;
  addDNSModalDNSNameRef: RefObject<HTMLDivElement>;
  addDNSModalAddressToAliasRef: RefObject<HTMLDivElement>;
  aclTabTableRef: RefObject<HTMLDivElement>;
  aclTabShowClientAclsRef: RefObject<HTMLDivElement>;
  aclTabAllowAllRef: RefObject<HTMLDivElement>;
  aclTabDenyAllRef: RefObject<HTMLDivElement>;
  aclTabResetRef: RefObject<HTMLDivElement>;
  aclTabSubmitRef: RefObject<HTMLDivElement>;
  graphTabContainerRef: RefObject<HTMLDivElement>;
  metricsTabConnectivityStatusTableRef: RefObject<HTMLDivElement>;
  metricsTabLatencyTableRef: RefObject<HTMLDivElement>;
  metricsTabBytesSentTableRef: RefObject<HTMLDivElement>;
  metricsTabBytesReceivedTableRef: RefObject<HTMLDivElement>;
  metricsTabUptimeTableRef: RefObject<HTMLDivElement>;
  metricsTabClientsTableRef: RefObject<HTMLDivElement>;
  internetGatewaysTableRef: RefObject<HTMLDivElement>;
  createInternetGatewayButtonRef: RefObject<HTMLDivElement>;
  internetGatewaysConnectedHostsTableRef: RefObject<HTMLDivElement>;
  internetGatewaysUpdateConnectedHostsRef: RefObject<HTMLDivElement>;
  createInternetGatewayModalSelectHostRef: RefObject<HTMLDivElement>;
  createInternetGatewayModalSelectConnectedHostsRef: RefObject<HTMLDivElement>;
  updateInternetGatewayModalSelectConnectedHostsRef: RefObject<HTMLDivElement>;
  setTourStep: (step: number) => void;
  setActiveTabKey: (key: string) => void;
  setIsAddNewHostModalOpen: (isOpen: boolean) => void;
  setIsAddClientGatewayModalOpen: (isOpen: boolean) => void;
  setIsAddClientModalOpen: (isOpen: boolean) => void;
  setIsAddRelayModalOpen: (isOpen: boolean) => void;
  setIsUpdateRelayModalOpen: (isOpen: boolean) => void;
  setIsAddEgressModalOpen: (isOpen: boolean) => void;
  setIsAddDnsModalOpen: (isOpen: boolean) => void;
  clientGateways: ExtendedNode[];
  egresses: ExtendedNode[];
  setIsTourOpen: (isOpen: boolean) => void;
  isTourOpen: boolean;
  setCurrentMetric: (metric: MetricCategories) => void;
  tourStep: number;
  relays: ExtendedNode[];
  setJumpToTourStepObj: (obj: JumpToTourStepObj) => void;
  notify: NotificationInstance;
  isAddInternetGatewayModalOpen: boolean;
  setIsAddInternetGatewayModalOpen: (isOpen: boolean) => void;
  setIsUpdateIngressUsersModalOpen: (isOpen: boolean) => void;
}

export default function TourComponent(props: TourUtilsProps) {
  const {
    overviewTabContainerRef,
    hostsTabContainerTableRef,
    hostsTabContainerAddHostsRef,
    connectHostModalEnrollmentKeysTabRef,
    connectHostModalSelectOSTabRef,
    connectHostModalJoinNetworkTabRef,
    remoteAccessTabGatewayTableRef,
    remoteAccessTabAddGatewayRef,
    addClientGatewayModalHostRef,
    addClientGatewayModalDefaultClientDNSRef,
    addClientGatewayModalIsInternetGatewayRef,
    remoteAccessTabVPNConfigTableRef,
    remoteAccessTabDisplayAllVPNConfigsRef,
    remoteAccessTabDownloadClientRef,
    remoteAccessTabVPNConfigCreateConfigRef,
    remoteAccessAddOrRemoveUsersRef,
    remoteAccessManageUsersRef,
    createClientConfigModalSelectGatewayRef,
    createClientConfigModalClientIDRef,
    createClientConfigModalPublicKeyRef,
    createClientConfigModalDNSRef,
    createClientConfigModalAdditionalAddressesRef,
    createClientConfigModalPostUpRef,
    createClientConfigModalPostDownRef,
    relaysTabRelayTableRef,
    relaysTabAddRelayRef,
    createRelayModalSelectHostRef,
    relaysTabRelayedHostsTableRef,
    relaysTabAddRelayedNodesRef,
    relaysTabDisplayAllRelayedHostsRef,
    addRelayedHostModalSelectHostRef,
    egressTabEgressTableRef,
    egressTabAddEgressRef,
    createEgressModalSelectHostRef,
    createEgressModalEnableNATRef,
    createEgressModalSelectExternalRangesRef,
    egressTabExternalRoutesTableRef,
    egressTabAddExternalRouteRef,
    egressTabDisplayAllExternalRoutesRef,
    dnsTabDNSTableRef,
    dnsTabAddDNSRef,
    addDNSModalDNSNameRef,
    addDNSModalAddressToAliasRef,
    aclTabTableRef,
    aclTabShowClientAclsRef,
    aclTabAllowAllRef,
    aclTabDenyAllRef,
    aclTabResetRef,
    aclTabSubmitRef,
    graphTabContainerRef,
    metricsTabConnectivityStatusTableRef,
    metricsTabLatencyTableRef,
    metricsTabBytesSentTableRef,
    metricsTabBytesReceivedTableRef,
    metricsTabUptimeTableRef,
    metricsTabClientsTableRef,
    internetGatewaysConnectedHostsTableRef,
    internetGatewaysTableRef,
    createInternetGatewayButtonRef,
    createInternetGatewayModalSelectHostRef,
    createInternetGatewayModalSelectConnectedHostsRef,
    updateInternetGatewayModalSelectConnectedHostsRef,
    setTourStep,
    setActiveTabKey,
    setIsAddNewHostModalOpen,
    setIsAddClientGatewayModalOpen,
    setIsAddClientModalOpen,
    setIsAddRelayModalOpen,
    setIsUpdateRelayModalOpen,
    setIsAddEgressModalOpen,
    setIsAddDnsModalOpen,
    clientGateways,
    egresses,
    setIsTourOpen,
    isTourOpen,
    setCurrentMetric,
    tourStep,
    relays,
    notify,
    isAddInternetGatewayModalOpen,
    setIsAddInternetGatewayModalOpen,
    setIsUpdateIngressUsersModalOpen,
  } = props;
  const store = useStore();
  const { isServerEE } = useServerLicense();
  const location = useLocation();
  const [jumpToTourStepObj, setJumpToTourStepObj] = useState<JumpToTourStepObj>({
    overview: 0,
    hosts: 1,
    remoteAccess: 6,
    vpnConfigs: 10,
    relays: 18,
    egress: 23,
    dns: 31,
    acls: 39,
    graph: 47,
    metrics: 48,
    remoteAccessGatewayModal: 2,
    remoteAccessVPNConfigModal: 10,
    addEgressModal: 23,
  });

  const nextTourStep = useCallback(() => {
    setTourStep(tourStep + 1);
  }, [setTourStep, tourStep]);

  const prevTourStep = useCallback(() => {
    setTourStep(tourStep - 1);
  }, [setTourStep, tourStep]);

  const networkDetailsTourStepsPro: TourProps['steps'] = useMemo(
    () => [
      {
        title: 'Hosts Table',
        description: (
          <>
            Get host information like host name, private address, public address, connectivity status, health status and
            failover status. You can click on a host to view more details or hover over the ellipsis at the end of the
            row to edit, disconnect or remove a host from network.
          </>
        ),
        target: hostsTabContainerTableRef.current,
      },
      {
        title: 'Add Host',
        description: 'Add a new host or an existing host to your network',
        target: hostsTabContainerAddHostsRef.current,
        onNext: () => {
          nextTourStep();
          setIsAddNewHostModalOpen(true);
        },
      },
      {
        title: 'Connect a Host - Enrollment Keys',
        description: (
          <>
            You can create an enrollment key which defines the networks a host has access to or you can pick an existing
            enrollment key
          </>
        ),
        target: connectHostModalEnrollmentKeysTabRef.current,
        onPrev: () => {
          setIsAddNewHostModalOpen(false);
          setActiveTabKey('hosts');
          prevTourStep();
        },
      },
      {
        title: 'Connect a Host - Select OS',
        description: (
          <>You can select the OS of the host that you want to connect and follow the netclient install instructions</>
        ),
        target: connectHostModalSelectOSTabRef.current,
      },
      {
        title: 'Connect a Host - Join a Network',
        description: <>You can join a network by running the command on the terminal</>,
        target: connectHostModalJoinNetworkTabRef.current,
        onNext: () => {
          setIsAddNewHostModalOpen(false);
          setActiveTabKey('clients');
          // check if there are any gateways, if there are then go to the next step else
          // go to the create gateway step
          if (clientGateways.length > 0) {
            nextTourStep();
          } else {
            setIsAddClientGatewayModalOpen(true);
            setTourStep(jumpToTourStepObj.remoteAccessGatewayModal);
          }
        },
      },
      {
        title: 'Gateway Table',
        description: (
          <>
            Get gateway information like gateway name, private address, endpoint , default client DNS, and you can view
            the gateway details by clicking on the gateway name and hover over the ellipsis to edit it or remove it from
            the network and add a user or remove a user from the gateway.
          </>
        ),
        target: remoteAccessTabGatewayTableRef.current,
        onPrev: () => {
          setIsAddNewHostModalOpen(true);
          setActiveTabKey('hosts');
          prevTourStep();
        },
      },
      {
        title: 'Add Gateway',
        description: 'Add a new gateway to your network',
        target: remoteAccessTabAddGatewayRef.current,
        onNext: () => {
          setIsAddClientGatewayModalOpen(true);
          nextTourStep();
        },
      },
      {
        title: 'Select Host for Remote Access Gateway',
        description: 'Select a host to act as a gateway',
        target: addClientGatewayModalHostRef.current,
        onPrev: () => {
          setIsAddClientGatewayModalOpen(false);

          // check if there are any gateways, if there are then go to the next step else
          // go to hosts
          if (clientGateways.length > 0) {
            nextTourStep();
          } else {
            setActiveTabKey('hosts');
            setTourStep(jumpToTourStepObj.hosts);
          }
        },
      },
      {
        title: 'Default DNS',
        description: 'Select a default DNS for your gateway',
        target: addClientGatewayModalDefaultClientDNSRef.current,
      },
      {
        title: 'Internet Gateway Check',
        description: 'Check this box if you want to use this gateway as an internet gateway',
        target: addClientGatewayModalIsInternetGatewayRef.current,
        onNext: () => {
          setIsAddClientGatewayModalOpen(false);

          // check if there are any gateways, if there are then go to the next step else we go to
          // the create client config
          if (clientGateways.length > 0) {
            nextTourStep();
          } else {
            setTourStep(jumpToTourStepObj.remoteAccessVPNConfigModal);
            setIsAddClientModalOpen(true);
          }
        },
      },
      {
        title: 'VPN Config Files Table',
        description: (
          <>
            Get VPN config files for clients, you can view the owner, address and gateway of the client, if its enabled
            and by clicking on the ellipsis you can download the config file, edit the client or remove the client from
            the gateway you can also see extra information about the client by clicking on the client name.
          </>
        ),
        target: remoteAccessTabVPNConfigTableRef.current,
      },
      {
        title: 'Create Config',
        description: 'Create a new VPN config file for a client',
        target: remoteAccessTabVPNConfigCreateConfigRef.current,
        onNext: () => {
          nextTourStep();
          setIsAddClientModalOpen(true);
        },
      },
      {
        title: 'Select Remote Access Gateway',
        description: 'Select a gateway to create a VPN config for',
        target: createClientConfigModalSelectGatewayRef.current,
        onPrev: () => {
          setIsAddClientModalOpen(false);
          prevTourStep();
        },
      },
      {
        title: 'Client ID',
        description: 'Enter a client ID',
        target: createClientConfigModalClientIDRef.current,
      },
      {
        title: 'Public Key',
        description: 'Enter a public key',
        target: createClientConfigModalPublicKeyRef.current,
      },
      {
        title: 'DNS',
        description: 'Enter a DNS',
        target: createClientConfigModalDNSRef.current,
      },
      {
        title: 'Additional Addresses',
        description: 'Enter additional addresses',
        target: createClientConfigModalAdditionalAddressesRef.current,
      },
      {
        title: 'Post Up',
        description:
          'PostUp serves as a lifetime hook that runs the provided script that run just after wireguard sets up the interface and the VPN connection is live',
        target: createClientConfigModalPostUpRef.current,
      },
      {
        title: 'Post Down',
        description:
          'PostDown serves as a lifetime hook that runs the provided script that run just after wireguard tears down the interface',
        target: createClientConfigModalPostDownRef.current,
        onNext: () => {
          setActiveTabKey('relays');
          setIsAddClientModalOpen(false);
          nextTourStep();
        },
      },
      {
        title: 'Relays Table',
        description: (
          <>
            Get relay information like relay name, address and you can update the relay details by hovering over the
            ellipsis and clicking on update relay
          </>
        ),
        target: relaysTabRelayTableRef.current,
        onPrev: () => {
          setActiveTabKey('clients');
        },
      },
      {
        title: 'Add Relay',
        description: 'Add a new relay to your network',
        target: relaysTabAddRelayRef.current,
        onNext: () => {
          nextTourStep();
          setIsAddRelayModalOpen(true);
        },
      },
      {
        title: 'Select Host',
        description: 'Select a host to act as a relay',
        target: createRelayModalSelectHostRef.current,
        onNext: () => {
          setIsAddRelayModalOpen(false);
          nextTourStep();
        },
        onPrev: () => {
          setIsAddRelayModalOpen(false);
          prevTourStep();
        },
      },
      // {
      //   title: 'Relayed Hosts',
      //   description:
      //     'Get relayed host information like host name, relayed by, addresses and you can update a host to be stop being relayed',
      //   target: relaysTabRelayedHostsTableRef.current,
      //   onPrev: () => {
      //     setIsAddRelayModalOpen(true);
      //     setTourStep(23);
      //   },
      // },
      {
        title: 'Add Relayed Host',
        description: 'Add a new relayed host to your selected relay',
        target: relaysTabAddRelayedNodesRef.current,
        onNext: () => {
          nextTourStep();
          setIsUpdateRelayModalOpen(true);
        },
        onPrev: () => {
          setIsAddRelayModalOpen(true);
          prevTourStep();
        },
      },
      {
        title: 'Select Host to relay',
        description: 'Select a host to relay',
        target: addRelayedHostModalSelectHostRef.current,
        onNext: () => {
          setIsUpdateRelayModalOpen(false);
          setActiveTabKey('egress');
          nextTourStep();
        },
        onPrev: () => {
          setIsUpdateRelayModalOpen(false);
          prevTourStep();
        },
      },

      {
        title: 'Egress Table',
        description: (
          <>
            Get egress information like egress name, address and you can update the egress details by hovering over the
            ellipsis and clicking on update egress and you can get more info about the egress by clicking on the egress
            name.
          </>
        ),
        target: egressTabEgressTableRef.current,
        onPrev: () => {
          setActiveTabKey('relays');
          setIsUpdateRelayModalOpen(true);
          prevTourStep();
        },
      },
      {
        title: 'Create Egress',
        description: 'Add a new egress to your network',
        target: egressTabAddEgressRef.current,
        onNext: () => {
          nextTourStep();
          setIsAddEgressModalOpen(true);
        },
      },
      {
        title: 'Select Host',
        description: 'Select a host to act as an egress',
        target: createEgressModalSelectHostRef.current,
        onPrev: () => {
          setIsAddEgressModalOpen(false);
          prevTourStep();
        },
      },
      {
        title: 'Enable NAT for egress traffic',
        description: 'Check this box if you want to enable NAT for egress traffic',
        target: createEgressModalEnableNATRef.current,
        onNext: () => {
          setIsAddEgressModalOpen(false);
          nextTourStep();
        },
      },
      // {
      //   title: 'Select external ranges',
      //   description: 'Select external ranges',
      //   target: createEgressModalSelectExternalRangesRef.current,
      //   onNext: () => {
      //     setIsAddEgressModalOpen(false);
      //     setTourStep(33);
      //   },
      // },
      {
        title: 'External Routes Table',
        description: 'Get external route information',
        target: egressTabExternalRoutesTableRef.current,
        onPrev: () => {
          setIsAddEgressModalOpen(true);
          prevTourStep();
        },
      },
      {
        title: 'Add External Route',
        description: 'Add a new external route to your selected egress gateway',
        target: egressTabAddExternalRouteRef.current,
        onNext: () => {
          setActiveTabKey('dns');
          nextTourStep();
        },
      },
      {
        title: 'DNS Table',
        description: <>Get DNS entries and IP addresses for your network and you can delete a DNS entry</>,
        target: dnsTabDNSTableRef.current,
        onPrev: () => {
          setActiveTabKey('egress');
          prevTourStep();
        },
      },
      {
        title: 'Add DNS',
        description: 'Add a new DNS entry to your network',
        target: dnsTabAddDNSRef.current,
        onNext: () => {
          setIsAddDnsModalOpen(true);
          nextTourStep();
        },
      },
      {
        title: 'DNS Name',
        description: 'Enter a DNS name',
        target: addDNSModalDNSNameRef.current,
        onPrev: () => {
          prevTourStep();
          setIsAddDnsModalOpen(false);
        },
      },
      {
        title: 'Address To Alias',
        description: 'Enter an address to alias',
        target: addDNSModalAddressToAliasRef.current,
        onNext: () => {
          setIsAddDnsModalOpen(false);
          setActiveTabKey('internet-gateways');
          nextTourStep();
        },
      },
      {
        title: 'Internet Gateways Table',
        description: 'List of internet gateways',
        target: internetGatewaysTableRef.current,
        onPrev: () => {
          setIsAddDnsModalOpen(true);
          setActiveTabKey('dns');
          prevTourStep();
        },
      },
      {
        title: 'Create Internet Gateway',
        description: 'Create a new internet gateway',
        target: createInternetGatewayButtonRef.current,
        onNext: () => {
          setIsAddInternetGatewayModalOpen(true);
          nextTourStep();
        },
      },
      {
        title: 'Select Host for Internet Gateway',
        description: 'Select a host to act as an internet gateway',
        target: createInternetGatewayModalSelectHostRef.current,
        onPrev: () => {
          setIsAddInternetGatewayModalOpen(false);
          prevTourStep();
        },
      },
      {
        title: 'Select Connected Hosts',
        description: 'Select connected hosts for the internet gateway',
        target: createInternetGatewayModalSelectConnectedHostsRef.current,
        onNext: () => {
          setIsAddInternetGatewayModalOpen(false);
          nextTourStep();
        },
      },
      {
        title: 'View Connected Hosts',
        description: 'View connected hosts for the internet gateway',
        target: internetGatewaysConnectedHostsTableRef.current,
        onPrev: () => {
          setIsAddInternetGatewayModalOpen(true);
          prevTourStep();
        },
        onNext: () => {
          setActiveTabKey('access-control');
          nextTourStep();
        },
      },
      {
        title: 'Access Control Table',
        description: (
          <>
            Show information about which machines can access which other machines on the network and you can also
            disable the connection
          </>
        ),
        target: aclTabTableRef.current,
        onPrev: () => {
          setActiveTabKey('internet-gateways');
          prevTourStep();
        },
      },
      {
        title: 'Show Clients',
        description: 'Show clients in the access control table',
        target: aclTabShowClientAclsRef.current,
      },
      {
        title: 'Allow All',
        description: 'Allow all connections',
        target: aclTabAllowAllRef.current,
      },
      {
        title: 'Block All',
        description: 'Block all connections',
        target: aclTabDenyAllRef.current,
      },
      {
        title: 'Reset',
        description: 'Reset the access control table',
        target: aclTabResetRef.current,
      },
      {
        title: 'Submit Changes',
        description: 'Submit the changes to the access control table',
        target: aclTabSubmitRef.current,
        onNext: () => {
          setActiveTabKey('graph');
          nextTourStep();
        },
      },
      {
        title: 'Graph',
        description: <> View a graph of your network </>,
        target: graphTabContainerRef.current,
        onPrev: () => {
          setActiveTabKey('access-control');
          prevTourStep();
        },
        onNext: () => {
          setActiveTabKey('metrics');
          setCurrentMetric('connectivity-status');
          nextTourStep();
        },
      },

      {
        title: 'Metrics Connectivity Status',
        description: <>View the connectivity status between nodes</>,
        target: metricsTabConnectivityStatusTableRef.current,
        onNext: () => {
          setCurrentMetric('latency');
          nextTourStep();
        },
        onPrev() {
          setActiveTabKey('graph');
          prevTourStep();
        },
      },
      {
        title: 'Metrics Latency',
        description: 'View the latency between nodes',
        target: metricsTabLatencyTableRef.current,
        onNext: () => {
          setCurrentMetric('bytes-sent');
          nextTourStep();
        },
        onPrev() {
          setCurrentMetric('connectivity-status');
          prevTourStep();
        },
      },
      {
        title: 'Metrics Bytes Sent',
        description: 'View the bytes sent between nodes',
        target: metricsTabBytesSentTableRef.current,
        onNext: () => {
          setCurrentMetric('bytes-received');
          nextTourStep();
        },
        onPrev() {
          setCurrentMetric('latency');
          prevTourStep();
        },
      },
      {
        title: 'Metrics Bytes Received',
        description: 'View the bytes received between nodes',
        target: metricsTabBytesReceivedTableRef.current,
        onNext: () => {
          setCurrentMetric('uptime');
          nextTourStep();
        },
        onPrev() {
          setCurrentMetric('bytes-sent');
          prevTourStep();
        },
      },
      {
        title: 'Metrics Uptime',
        description: 'View the uptime between nodes',
        target: metricsTabUptimeTableRef.current,
        onNext: () => {
          setCurrentMetric('clients');
          nextTourStep();
        },
        onPrev() {
          setCurrentMetric('bytes-received');
          prevTourStep();
        },
      },
      {
        title: 'Metrics Clients',
        description: 'View the clients connected to the network',
        target: metricsTabClientsTableRef.current,
        onPrev() {
          setCurrentMetric('uptime');
          prevTourStep();
        },
        onNext: () => {
          setActiveTabKey('overview');
          nextTourStep();
        },
      },
      {
        title: 'Overview',
        description: 'Get a quick overview of your network',
        target: overviewTabContainerRef.current,
        onPrev: () => {
          prevTourStep();
          setActiveTabKey('overview');
        },
      },
    ],
    [
      aclTabAllowAllRef,
      aclTabDenyAllRef,
      aclTabResetRef,
      aclTabShowClientAclsRef,
      aclTabSubmitRef,
      aclTabTableRef,
      addClientGatewayModalDefaultClientDNSRef,
      addClientGatewayModalHostRef,
      addClientGatewayModalIsInternetGatewayRef,
      addDNSModalAddressToAliasRef,
      addDNSModalDNSNameRef,
      addRelayedHostModalSelectHostRef,
      clientGateways.length,
      connectHostModalEnrollmentKeysTabRef,
      connectHostModalJoinNetworkTabRef,
      connectHostModalSelectOSTabRef,
      createClientConfigModalAdditionalAddressesRef,
      createClientConfigModalClientIDRef,
      createClientConfigModalDNSRef,
      createClientConfigModalPostDownRef,
      createClientConfigModalPostUpRef,
      createClientConfigModalPublicKeyRef,
      createClientConfigModalSelectGatewayRef,
      createEgressModalEnableNATRef,
      createEgressModalSelectHostRef,
      createRelayModalSelectHostRef,
      dnsTabAddDNSRef,
      dnsTabDNSTableRef,
      egressTabAddEgressRef,
      egressTabAddExternalRouteRef,
      egressTabEgressTableRef,
      egressTabExternalRoutesTableRef,
      graphTabContainerRef,
      hostsTabContainerAddHostsRef,
      hostsTabContainerTableRef,
      jumpToTourStepObj.hosts,
      jumpToTourStepObj.remoteAccessGatewayModal,
      jumpToTourStepObj.remoteAccessVPNConfigModal,
      metricsTabBytesReceivedTableRef,
      metricsTabBytesSentTableRef,
      metricsTabClientsTableRef,
      metricsTabConnectivityStatusTableRef,
      metricsTabLatencyTableRef,
      metricsTabUptimeTableRef,
      nextTourStep,
      overviewTabContainerRef,
      prevTourStep,
      relaysTabAddRelayRef,
      relaysTabAddRelayedNodesRef,
      relaysTabRelayTableRef,
      remoteAccessTabAddGatewayRef,
      remoteAccessTabGatewayTableRef,
      remoteAccessTabVPNConfigCreateConfigRef,
      remoteAccessTabVPNConfigTableRef,
      setActiveTabKey,
      setCurrentMetric,
      setIsAddClientGatewayModalOpen,
      setIsAddClientModalOpen,
      setIsAddDnsModalOpen,
      setIsAddEgressModalOpen,
      setIsAddNewHostModalOpen,
      setIsAddRelayModalOpen,
      setIsUpdateRelayModalOpen,
      setTourStep,
    ],
  );

  const networkDetailsTourStepsCE: TourProps['steps'] = useMemo(
    () => [
      {
        title: 'Hosts Table',
        description: (
          <>
            Get host information like host name, private address, public address, connectivity status, health status and
            failover status. You can click on a host to view more details or hover over the ellipsis at the end of the
            row to edit, disconnect or remove a host from network.
          </>
        ),
        target: hostsTabContainerTableRef.current,
      },
      {
        title: 'Add Host',
        description: 'Add a new host or an existing host to your network',
        target: hostsTabContainerAddHostsRef.current,
        onNext: () => {
          nextTourStep();
          setIsAddNewHostModalOpen(true);
        },
      },
      {
        title: 'Connect a Host - Enrollment Keys',
        description: (
          <>
            You can create an enrollment key which defines the networks a host has access to or you can pick an existing
            enrollment key
          </>
        ),
        target: connectHostModalEnrollmentKeysTabRef.current,
      },
      {
        title: 'Connect a Host - Select OS',
        description: (
          <>You can select the OS of the host that you want to connect and follow the netclient install instructions</>
        ),
        target: connectHostModalSelectOSTabRef.current,
      },
      {
        title: 'Connect a Host - Join a Network',
        description: <>You can join a network by running the command on the terminal</>,
        target: connectHostModalJoinNetworkTabRef.current,
        onNext: () => {
          setIsAddNewHostModalOpen(false);
          setActiveTabKey('clients');
          // check if there are any gateways, if there are then go to the next step else
          // go to the create gateway step
          if (clientGateways.length > 0) {
            nextTourStep();
          } else {
            setIsAddClientGatewayModalOpen(true);
            setTourStep(jumpToTourStepObj.remoteAccessGatewayModal);
          }
        },
      },
      {
        title: 'Gateway Table',
        description: (
          <>
            Get gateway information like gateway name, private address, endpoint , default client DNS, and you can view
            the gateway details by clicking on the gateway name and hover over the ellipsis to edit it or remove it from
            the network and add a user or remove a user from the gateway.
          </>
        ),
        target: remoteAccessTabGatewayTableRef.current,
        onPrev: () => {
          setIsAddNewHostModalOpen(true);
          setActiveTabKey('hosts');
          prevTourStep();
        },
      },
      {
        title: 'Add Gateway',
        description: 'Add a new gateway to your network',
        target: remoteAccessTabAddGatewayRef.current,
        onNext: () => {
          setIsAddClientGatewayModalOpen(true);
          nextTourStep();
        },
      },
      {
        title: 'Select Host',
        description: 'Select a host to act as a gateway',
        target: addClientGatewayModalHostRef.current,
        onPrev: () => {
          setIsAddClientGatewayModalOpen(false);

          // check if there are any gateways, if there are then go to the next step else
          // go to hosts
          if (clientGateways.length > 0) {
            prevTourStep();
          } else {
            setActiveTabKey('hosts');
            setTourStep(jumpToTourStepObj.hosts);
          }
        },
      },
      {
        title: 'Default DNS',
        description: 'Select a default DNS for your gateway',
        target: addClientGatewayModalDefaultClientDNSRef.current,
        onNext: () => {
          setIsAddClientGatewayModalOpen(false);

          // check if there are any gateways, if there are then go to the next step else we go to
          // the create client config
          if (clientGateways.length > 0) {
            nextTourStep();
          } else {
            setTourStep(jumpToTourStepObj.remoteAccessVPNConfigModal);
            setIsAddClientModalOpen(true);
          }
        },
      },
      {
        title: 'VPN Config Files Table',
        description: (
          <>
            Get VPN config files for clients, you can view the owner, address and gateway of the client, if its enabled
            and by clicking on the ellipsis you can download the config file, edit the client or remove the client from
            the gateway you can also see extra information about the client by clicking on the client name.
          </>
        ),
        target: remoteAccessTabVPNConfigTableRef.current,
      },
      {
        title: 'Create Config',
        description: 'Create a new VPN config file for a client',
        target: remoteAccessTabVPNConfigCreateConfigRef.current,
        onNext: () => {
          nextTourStep();
          setIsAddClientModalOpen(true);
        },
      },
      {
        title: 'Select Remote Access Gateway',
        description: 'Select a gateway to create a VPN config for',
        target: createClientConfigModalSelectGatewayRef.current,
        onPrev: () => {
          setIsAddClientModalOpen(false);
          prevTourStep();
        },
      },
      {
        title: 'Client ID',
        description: 'Enter a client ID',
        target: createClientConfigModalClientIDRef.current,
      },
      {
        title: 'Public Key',
        description: 'Enter a public key',
        target: createClientConfigModalPublicKeyRef.current,
      },
      {
        title: 'DNS',
        description: 'Enter a DNS',
        target: createClientConfigModalDNSRef.current,
      },
      {
        title: 'Additional Addresses',
        description: 'Enter additional addresses',
        target: createClientConfigModalAdditionalAddressesRef.current,
      },
      {
        title: 'Post Up',
        description:
          'PostUp serves as a lifetime hook that runs the provided script that run just after wireguard sets up the interface and the VPN connection is live',
        target: createClientConfigModalPostUpRef.current,
      },
      {
        title: 'Post Down',
        description:
          'PostDown serves as a lifetime hook that runs the provided script that run just after wireguard tears down the interface',
        target: createClientConfigModalPostDownRef.current,
        onNext: () => {
          setActiveTabKey('egress');
          // if there are any egresses then go to the next step else go to create egress
          if (egresses.length > 0) {
            setIsAddClientModalOpen(false);
            nextTourStep();
          } else {
            setTourStep(jumpToTourStepObj.addEgressModal);
            setIsAddClientModalOpen(false);
            setIsAddEgressModalOpen(true);
          }
        },
      },
      {
        title: 'Egress Table',
        description: (
          <>
            Get egress information like egress name, address and you can update the egress details by hovering over the
            ellipsis and clicking on update egress and you can get more info about the egress by clicking on the egress
            name.
          </>
        ),
        target: egressTabEgressTableRef.current,
        onPrev: () => {
          setActiveTabKey('clients');
          prevTourStep();
        },
      },
      {
        title: 'Create Egress',
        description: 'Add a new egress to your network',
        target: egressTabAddEgressRef.current,
        onNext: () => {
          nextTourStep();
          setIsAddEgressModalOpen(true);
        },
      },
      {
        title: 'Select Host for Egress Gateway',
        description: 'Select a host to act as an egress',
        target: createEgressModalSelectHostRef.current,
        onPrev: () => {
          setIsAddEgressModalOpen(false);
          prevTourStep();
        },
      },
      {
        title: 'Enable NAT for egress traffic',
        description: 'Check this box if you want to enable NAT for egress traffic',
        target: createEgressModalEnableNATRef.current,
      },
      {
        title: 'Select external ranges',
        description: 'Select external ranges',
        target: createEgressModalSelectExternalRangesRef.current,
        onNext: () => {
          // if there are any egresses then go to the next step else go to dns
          if (egresses.length > 0) {
            nextTourStep();
            setIsAddEgressModalOpen(false);
          } else {
            setTourStep(jumpToTourStepObj.dns);
            setActiveTabKey('dns');
            setIsAddEgressModalOpen(false);
          }
        },
      },
      {
        title: 'External Routes Table',
        description: 'Get external route information',
        target: egressTabExternalRoutesTableRef.current,
        onPrev: () => {
          setIsAddEgressModalOpen(true);
          prevTourStep();
        },
      },
      {
        title: 'Add External Route',
        description: 'Add a new external route to your selected egress gateway',
        target: egressTabAddExternalRouteRef.current,
        onNext: () => {
          setActiveTabKey('dns');
          nextTourStep();
        },
      },
      {
        title: 'DNS Table',
        description: <>Get DNS entries and IP addresses for your network and you can delete a DNS entry</>,
        target: dnsTabDNSTableRef.current,
        onPrev: () => {
          setActiveTabKey('egress');
          prevTourStep();
          setIsAddEgressModalOpen(true);
        },
      },
      {
        title: 'Add DNS',
        description: 'Add a new DNS entry to your network',
        target: dnsTabAddDNSRef.current,
        onNext: () => {
          nextTourStep();
          setIsAddDnsModalOpen(true);
        },
      },
      {
        title: 'DNS Name',
        description: 'Enter a DNS name',
        target: addDNSModalDNSNameRef.current,
        onPrev: () => {
          setIsAddDnsModalOpen(false);
          prevTourStep();
        },
      },
      {
        title: 'Address To Alias',
        description: 'Enter an address to alias',
        target: addDNSModalAddressToAliasRef.current,
        onNext: () => {
          setIsAddDnsModalOpen(false);
          setActiveTabKey('access-control');
          nextTourStep();
        },
      },
      {
        title: 'Access Control Table',
        description: (
          <>
            Show information about which machines can access which other machines on the network and you can also
            disable the connection
          </>
        ),
        target: aclTabTableRef.current,
        onPrev: () => {
          setActiveTabKey('dns');
          setIsAddDnsModalOpen(true);
          prevTourStep();
        },
      },
      {
        title: 'Allow All',
        description: 'Allow all connections',
        target: aclTabAllowAllRef.current,
      },
      {
        title: 'Block All',
        description: 'Block all connections',
        target: aclTabDenyAllRef.current,
      },
      {
        title: 'Reset',
        description: 'Reset the access control table',
        target: aclTabResetRef.current,
      },
      {
        title: 'Submit Changes',
        description: 'Submit the changes to the access control table',
        target: aclTabSubmitRef.current,
        onNext: () => {
          setActiveTabKey('graph');
          prevTourStep();
        },
      },
      {
        title: 'Graph',
        description: <> View a graph of your network </>,
        target: graphTabContainerRef.current,
        onPrev: () => {
          setActiveTabKey('access-control');
          prevTourStep();
        },
      },
      {
        title: 'Overview',
        description: 'Get a quick overview of your network',
        target: overviewTabContainerRef.current,
        onPrev: () => {
          prevTourStep();
          setActiveTabKey('graph');
        },
      },
    ],
    [
      aclTabAllowAllRef,
      aclTabDenyAllRef,
      aclTabResetRef,
      aclTabSubmitRef,
      aclTabTableRef,
      addClientGatewayModalDefaultClientDNSRef,
      addClientGatewayModalHostRef,
      addDNSModalAddressToAliasRef,
      addDNSModalDNSNameRef,
      clientGateways.length,
      connectHostModalEnrollmentKeysTabRef,
      connectHostModalJoinNetworkTabRef,
      connectHostModalSelectOSTabRef,
      createClientConfigModalAdditionalAddressesRef,
      createClientConfigModalClientIDRef,
      createClientConfigModalDNSRef,
      createClientConfigModalPostDownRef,
      createClientConfigModalPostUpRef,
      createClientConfigModalPublicKeyRef,
      createClientConfigModalSelectGatewayRef,
      createEgressModalEnableNATRef,
      createEgressModalSelectExternalRangesRef,
      createEgressModalSelectHostRef,
      dnsTabAddDNSRef,
      dnsTabDNSTableRef,
      egressTabAddEgressRef,
      egressTabAddExternalRouteRef,
      egressTabEgressTableRef,
      egressTabExternalRoutesTableRef,
      egresses.length,
      graphTabContainerRef,
      hostsTabContainerAddHostsRef,
      hostsTabContainerTableRef,
      jumpToTourStepObj.addEgressModal,
      jumpToTourStepObj.dns,
      jumpToTourStepObj.hosts,
      jumpToTourStepObj.remoteAccessGatewayModal,
      jumpToTourStepObj.remoteAccessVPNConfigModal,
      nextTourStep,
      overviewTabContainerRef,
      prevTourStep,
      remoteAccessTabAddGatewayRef,
      remoteAccessTabGatewayTableRef,
      remoteAccessTabVPNConfigCreateConfigRef,
      remoteAccessTabVPNConfigTableRef,
      setActiveTabKey,
      setIsAddClientGatewayModalOpen,
      setIsAddClientModalOpen,
      setIsAddDnsModalOpen,
      setIsAddEgressModalOpen,
      setIsAddNewHostModalOpen,
      setTourStep,
    ],
  );

  const remoteAccessSpecificMachinesTourStepsPro: TourProps['steps'] = useMemo(
    () => [
      {
        title: 'Hosts Table',
        description: (
          <>
            These are the nodes of your VPN, get host information like host name, private address, public address,
            connectivity status, health status and failover status. You can click on a host to view more details or
            hover over the ellipsis at the end of the row to edit, disconnect or remove a host from network.
          </>
        ),
        target: hostsTabContainerTableRef.current,
        onNext: () => {
          setActiveTabKey('clients');
          nextTourStep();
        },
      },
      {
        title: 'Gateway Table',
        description: (
          <>
            This is the gateway for users into the network, get gateway information like gateway name, private address,
            endpoint , default client DNS, and you can view the gateway details by clicking on the gateway name and
            hover over the ellipsis to edit it or remove it from the network and add a user or remove a user from the
            gateway.
          </>
        ),
        target: remoteAccessTabGatewayTableRef.current,
        onPrev: () => {
          setActiveTabKey('hosts');
          prevTourStep();
        },
      },
      {
        title: 'Download the Remote Access Client',
        description: (
          <>
            Download the remote access client for your OS, you can also view the instructions on how to install the
            client
          </>
        ),
        target: remoteAccessTabDownloadClientRef.current,
      },
      {
        title: 'Add / Remove Users from the Gateway',
        description: (
          <>You can add / remove users from the gateway by clicking on the ellipsis and selecting add / remove users.</>
        ),
        target: remoteAccessAddOrRemoveUsersRef.current,
        onNext: () => {
          setIsUpdateIngressUsersModalOpen(true);
          nextTourStep();
        },
      },
      {
        title: 'How to Manage Users on a Gateway',
        description: (
          <>
            You can add a new user by clicking on the add user button. After you can attach or detach the user from the
            gateway.
          </>
        ),
        target: remoteAccessManageUsersRef.current,
        onNext: () => {
          setIsUpdateIngressUsersModalOpen(false);
          nextTourStep();
        },
        onPrev: () => {
          setIsUpdateIngressUsersModalOpen(false);
          prevTourStep();
        },
      },
      {
        title: 'VPN Config Files Table',
        description: (
          <>
            Get VPN config files for clients, you can view the owner, address and gateway of the client, if its enabled
            and by clicking on the ellipsis you can download the config file, edit the client or remove the client from
            the gateway you can also see extra information about the client by clicking on the client name.
          </>
        ),
        target: remoteAccessTabVPNConfigTableRef.current,
      },
    ],
    [
      addClientGatewayModalDefaultClientDNSRef,
      addClientGatewayModalHostRef,
      addClientGatewayModalIsInternetGatewayRef,
      clientGateways.length,
      connectHostModalEnrollmentKeysTabRef,
      connectHostModalJoinNetworkTabRef,
      connectHostModalSelectOSTabRef,
      createClientConfigModalAdditionalAddressesRef,
      createClientConfigModalClientIDRef,
      createClientConfigModalDNSRef,
      createClientConfigModalPostDownRef,
      createClientConfigModalPostUpRef,
      createClientConfigModalPublicKeyRef,
      createClientConfigModalSelectGatewayRef,
      hostsTabContainerAddHostsRef,
      hostsTabContainerTableRef,
      jumpToTourStepObj.hosts,
      jumpToTourStepObj.remoteAccessGatewayModal,
      jumpToTourStepObj.remoteAccessVPNConfigModal,
      nextTourStep,
      prevTourStep,
      remoteAccessTabAddGatewayRef,
      remoteAccessTabGatewayTableRef,
      remoteAccessTabVPNConfigCreateConfigRef,
      remoteAccessTabVPNConfigTableRef,
      setActiveTabKey,
      setIsAddClientGatewayModalOpen,
      setIsAddClientModalOpen,
      setIsAddNewHostModalOpen,
      setTourStep,
    ],
  );

  const remoteAccessWithEgressTourStepsPro: TourProps['steps'] = useMemo(
    () => [
      {
        title: 'Hosts Table',
        description: (
          <>
            These are the nodes of your VPN, get host information like host name, private address, public address,
            connectivity status, health status and failover status. You can click on a host to view more details or
            hover over the ellipsis at the end of the row to edit, disconnect or remove a host from network.
          </>
        ),
        target: hostsTabContainerTableRef.current,
        onNext: () => {
          setActiveTabKey('clients');
          nextTourStep();
        },
      },
      {
        title: 'Gateway Table',
        description: (
          <>
            This is the gateway for users into the network, get gateway information like gateway name, private address,
            endpoint , default client DNS, and you can view the gateway details by clicking on the gateway name and
            hover over the ellipsis to edit it or remove it from the network and add a user or remove a user from the
            gateway.
          </>
        ),
        target: remoteAccessTabGatewayTableRef.current,
        onPrev: () => {
          setIsAddNewHostModalOpen(true);
          setActiveTabKey('hosts');
          prevTourStep();
        },
      },
      {
        title: 'Download the Remote Access Client',
        description: (
          <>
            Download the remote access client for your OS, you can also view the instructions on how to install the
            client
          </>
        ),
        target: remoteAccessTabDownloadClientRef.current,
      },
      {
        title: 'Add / Remove Users from the Gateway',
        description: (
          <>You can add / remove users from the gateway by clicking on the ellipsis and selecting add / remove users.</>
        ),
        target: remoteAccessAddOrRemoveUsersRef.current,
        onNext: () => {
          setIsUpdateIngressUsersModalOpen(true);
          nextTourStep();
        },
      },
      {
        title: 'How to Manage Users on a Gateway',
        description: (
          <>
            You can add a new user by clicking on the add user button. After you can attach or detach the user from the
            gateway.
          </>
        ),
        target: remoteAccessManageUsersRef.current,
        onNext: () => {
          setIsUpdateIngressUsersModalOpen(false);
          nextTourStep();
        },
        onPrev: () => {
          setIsUpdateIngressUsersModalOpen(false);
          prevTourStep();
        },
      },
      {
        title: 'VPN Config Files Table',
        description: (
          <>
            Get VPN config files for clients, you can view the owner, address and gateway of the client, if its enabled
            and by clicking on the ellipsis you can download the config file, edit the client or remove the client from
            the gateway you can also see extra information about the client by clicking on the client name.
          </>
        ),
        target: remoteAccessTabVPNConfigTableRef.current,
        onNext: () => {
          setActiveTabKey('egress');
          nextTourStep();
        },
      },
      {
        title: 'Egress Table',
        description: (
          <>
            These are the devices sending traffic to your network, get egress information like egress name, address and
            you can update the egress details by hovering over the ellipsis and clicking on update egress and you can
            get more info about the egress by clicking on the egress name.
          </>
        ),
        target: egressTabEgressTableRef.current,
        onPrev: () => {
          setActiveTabKey('clients');
          setTourStep(jumpToTourStepObj.remoteAccess);
        },
      },
      {
        title: 'External Routes Table',
        description: 'These are the ranges been forwarded by the egress',
        target: egressTabExternalRoutesTableRef.current,
      },
    ],
    [
      hostsTabContainerTableRef,
      remoteAccessTabGatewayTableRef,
      remoteAccessTabDownloadClientRef,
      remoteAccessAddOrRemoveUsersRef,
      remoteAccessManageUsersRef,
      remoteAccessTabVPNConfigTableRef,
      egressTabEgressTableRef,
      egressTabExternalRoutesTableRef,
      setActiveTabKey,
      nextTourStep,
      setIsAddNewHostModalOpen,
      prevTourStep,
      setIsUpdateIngressUsersModalOpen,
      setTourStep,
      jumpToTourStepObj.remoteAccess,
    ],
  );

  const remoteAccessWithSpecificMachinesTourStepsCE: TourProps['steps'] = useMemo(
    () => [
      {
        title: 'Hosts Table',
        description: (
          <>
            These are the nodes of your VPN, get host information like host name, private address, public address,
            connectivity status, health status and failover status. You can click on a host to view more details or
            hover over the ellipsis at the end of the row to edit, disconnect or remove a host from network.
          </>
        ),
        target: hostsTabContainerTableRef.current,
        onNext: () => {
          setActiveTabKey('clients');
          nextTourStep();
        },
      },
      {
        title: 'Gateway Table',
        description: (
          <>
            This is the gateway for users into the network, get gateway information like gateway name, private address,
            endpoint , default client DNS, and you can view the gateway details by clicking on the gateway name and
            hover over the ellipsis to edit it or remove it from the network and add a user or remove a user from the
            gateway.
          </>
        ),
        target: remoteAccessTabGatewayTableRef.current,
        onPrev: () => {
          setIsAddNewHostModalOpen(true);
          setActiveTabKey('hosts');
          prevTourStep();
        },
      },
      {
        title: 'Download the Remote Access Client',
        description: (
          <>
            Download the remote access client for your OS, you can also view the instructions on how to install the
            client
          </>
        ),
        target: remoteAccessTabDownloadClientRef.current,
      },
      {
        title: 'Add / Remove Users from the Gateway',
        description: (
          <>You can add / remove users from the gateway by clicking on the ellipsis and selecting add / remove users.</>
        ),
        target: remoteAccessAddOrRemoveUsersRef.current,
        onNext: () => {
          setIsUpdateIngressUsersModalOpen(true);
          nextTourStep();
        },
      },
      {
        title: 'How to Manage Users on a Gateway',
        description: (
          <>
            You can add a new user by clicking on the add user button. After you can attach or detach the user from the
            gateway.
          </>
        ),
        target: remoteAccessManageUsersRef.current,
        onNext: () => {
          setIsUpdateIngressUsersModalOpen(false);
          nextTourStep();
        },
        onPrev: () => {
          setIsUpdateIngressUsersModalOpen(false);
          prevTourStep();
        },
      },
      {
        title: 'VPN Config Files Table',
        description: (
          <>
            Get VPN config files for clients, you can view the owner, address and gateway of the client, if its enabled
            and by clicking on the ellipsis you can download the config file, edit the client or remove the client from
            the gateway you can also see extra information about the client by clicking on the client name.
          </>
        ),
        target: remoteAccessTabVPNConfigTableRef.current,
      },
    ],
    [
      addClientGatewayModalDefaultClientDNSRef,
      addClientGatewayModalHostRef,
      addClientGatewayModalIsInternetGatewayRef,
      clientGateways.length,
      connectHostModalEnrollmentKeysTabRef,
      connectHostModalJoinNetworkTabRef,
      connectHostModalSelectOSTabRef,
      createClientConfigModalAdditionalAddressesRef,
      createClientConfigModalClientIDRef,
      createClientConfigModalDNSRef,
      createClientConfigModalPostDownRef,
      createClientConfigModalPostUpRef,
      createClientConfigModalPublicKeyRef,
      createClientConfigModalSelectGatewayRef,
      hostsTabContainerAddHostsRef,
      hostsTabContainerTableRef,
      jumpToTourStepObj.hosts,
      jumpToTourStepObj.remoteAccessGatewayModal,
      jumpToTourStepObj.remoteAccessVPNConfigModal,
      nextTourStep,
      prevTourStep,
      remoteAccessTabAddGatewayRef,
      remoteAccessTabGatewayTableRef,
      remoteAccessTabVPNConfigCreateConfigRef,
      remoteAccessTabVPNConfigTableRef,
      setActiveTabKey,
      setIsAddClientGatewayModalOpen,
      setIsAddClientModalOpen,
      setIsAddNewHostModalOpen,
      setTourStep,
    ],
  );

  const remoteAccessWithEgressTourStepsCE: TourProps['steps'] = useMemo(
    () => [
      {
        title: 'Hosts Table',
        description: (
          <>
            These are the nodes of your VPN, get host information like host name, private address, public address,
            connectivity status, health status and failover status. You can click on a host to view more details or
            hover over the ellipsis at the end of the row to edit, disconnect or remove a host from network.
          </>
        ),
        target: hostsTabContainerTableRef.current,
        onNext: () => {
          setActiveTabKey('clients');
          nextTourStep();
        },
      },
      {
        title: 'Gateway Table',
        description: (
          <>
            This is the gateway for users into the network, get gateway information like gateway name, private address,
            endpoint , default client DNS, and you can view the gateway details by clicking on the gateway name and
            hover over the ellipsis to edit it or remove it from the network and add a user or remove a user from the
            gateway.
          </>
        ),
        target: remoteAccessTabGatewayTableRef.current,
        onPrev: () => {
          setIsAddNewHostModalOpen(true);
          setActiveTabKey('hosts');
          prevTourStep();
        },
      },
      {
        title: 'Download the Remote Access Client',
        description: (
          <>
            Download the remote access client for your OS, you can also view the instructions on how to install the
            client
          </>
        ),
        target: remoteAccessTabDownloadClientRef.current,
      },
      {
        title: 'Add / Remove Users from the Gateway',
        description: (
          <>You can add / remove users from the gateway by clicking on the ellipsis and selecting add / remove users.</>
        ),
        target: remoteAccessAddOrRemoveUsersRef.current,
        onNext: () => {
          setIsUpdateIngressUsersModalOpen(true);
          nextTourStep();
        },
      },
      {
        title: 'How to Manage Users on a Gateway',
        description: (
          <>
            You can add a new user by clicking on the add user button. After you can attach or detach the user from the
            gateway.
          </>
        ),
        target: remoteAccessManageUsersRef.current,
        onNext: () => {
          setIsUpdateIngressUsersModalOpen(false);
          nextTourStep();
        },
        onPrev: () => {
          setIsUpdateIngressUsersModalOpen(false);
          prevTourStep();
        },
      },
      {
        title: 'VPN Config Files Table',
        description: (
          <>
            Get VPN config files for clients, you can view the owner, address and gateway of the client, if its enabled
            and by clicking on the ellipsis you can download the config file, edit the client or remove the client from
            the gateway you can also see extra information about the client by clicking on the client name.
          </>
        ),
        target: remoteAccessTabVPNConfigTableRef.current,
        onNext: () => {
          setActiveTabKey('egress');
          nextTourStep();
        },
      },
      {
        title: 'Egress Table',
        description: (
          <>
            These are the devices sending traffic to your network, get egress information like egress name, address and
            you can update the egress details by hovering over the ellipsis and clicking on update egress and you can
            get more info about the egress by clicking on the egress name.
          </>
        ),
        target: egressTabEgressTableRef.current,
        onPrev: () => {
          setActiveTabKey('clients');
          setTourStep(jumpToTourStepObj.remoteAccess);
        },
      },
      {
        title: 'External Routes Table',
        description: 'These are the ranges been forwarded by the egress',
        target: egressTabExternalRoutesTableRef.current,
      },
    ],
    [
      hostsTabContainerTableRef,
      remoteAccessTabGatewayTableRef,
      remoteAccessTabDownloadClientRef,
      remoteAccessAddOrRemoveUsersRef,
      remoteAccessManageUsersRef,
      remoteAccessTabVPNConfigTableRef,
      egressTabEgressTableRef,
      egressTabExternalRoutesTableRef,
      setActiveTabKey,
      nextTourStep,
      setIsAddNewHostModalOpen,
      prevTourStep,
      setIsUpdateIngressUsersModalOpen,
      setTourStep,
      jumpToTourStepObj.remoteAccess,
    ],
  );

  const internetGatewayTourSteps: TourProps['steps'] = useMemo(
    () => [
      {
        title: 'Hosts Table',
        description: (
          <>
            These are the nodes of your VPN, get host information like host name, private address, public address,
            connectivity status, health status and failover status. You can click on a host to view more details or
            hover over the ellipsis at the end of the row to edit, disconnect or remove a host from network.
          </>
        ),
        target: hostsTabContainerTableRef.current,
        onNext: () => {
          setActiveTabKey('internet-gateways');
          nextTourStep();
        },
      },
      {
        title: 'Internet Gateways Table',
        description: 'These are the devices that allow your network to connect to the internet',
        target: internetGatewaysTableRef.current,
      },
      {
        title: 'View Connected Hosts',
        description: 'View connected hosts for the internet gateway',
        target: internetGatewaysConnectedHostsTableRef.current,
        onPrev: () => {
          setIsAddInternetGatewayModalOpen(true);
          prevTourStep();
        },
      },
    ],
    [internetGatewaysConnectedHostsTableRef, internetGatewaysTableRef, prevTourStep, setIsAddInternetGatewayModalOpen],
  );

  const egressGatewayTourSteps: TourProps['steps'] = useMemo(
    () => [
      {
        title: 'Hosts Table',
        description: (
          <>
            These are the nodes of your VPN, get host information like host name, private address, public address,
            connectivity status, health status and failover status. You can click on a host to view more details or
            hover over the ellipsis at the end of the row to edit, disconnect or remove a host from network.
          </>
        ),
        target: hostsTabContainerTableRef.current,
        onNext: () => {
          setActiveTabKey('egress');
          nextTourStep();
        },
      },
      {
        title: 'Egress Table',
        description: (
          <>
            These are the devices sending traffic to your network, get egress information like egress name, address and
            you can update the egress details by hovering over the ellipsis and clicking on update egress and you can
            get more info about the egress by clicking on the egress name.
          </>
        ),
        target: egressTabEgressTableRef.current,
      },
      {
        title: 'External Routes Table',
        description: 'These are the ranges been forwarded by the egress',
        target: egressTabExternalRoutesTableRef.current,
      },
    ],
    [egressTabEgressTableRef, egressTabExternalRoutesTableRef],
  );

  const remoteAccessSpecificMachinesTourStepsWithVpnConfig: TourProps['steps'] = useMemo(
    () => [
      {
        title: 'Hosts Table',
        description: (
          <>
            These are the nodes of your VPN, get host information like host name, private address, public address,
            connectivity status, health status and failover status. You can click on a host to view more details or
            hover over the ellipsis at the end of the row to edit, disconnect or remove a host from network.
          </>
        ),
        target: hostsTabContainerTableRef.current,
        onNext: () => {
          setActiveTabKey('clients');
          nextTourStep();
        },
      },
      {
        title: 'Gateway Table',
        description: (
          <>
            This is the gateway for users into the network, get gateway information like gateway name, private address,
            endpoint , default client DNS, and you can view the gateway details by clicking on the gateway name and
            hover over the ellipsis to edit it or remove it from the network and add a user or remove a user from the
            gateway.
          </>
        ),
        target: remoteAccessTabGatewayTableRef.current,
        onPrev: () => {
          setActiveTabKey('hosts');
          prevTourStep();
        },
      },
      {
        title: 'VPN Config Files Table',
        description: (
          <>
            Get VPN config files for clients, you can view the owner, address and gateway of the client, if its enabled
            and by clicking on the ellipsis you can download the config file, edit the client or remove the client from
            the gateway you can also see extra information about the client by clicking on the client name.
          </>
        ),
        target: remoteAccessTabVPNConfigTableRef.current,
      },
      {
        title: 'Create Config',
        description: 'Create a new VPN config file for a client',
        target: remoteAccessTabVPNConfigCreateConfigRef.current,
      },
    ],
    [
      hostsTabContainerTableRef,
      nextTourStep,
      prevTourStep,
      remoteAccessTabGatewayTableRef,
      remoteAccessTabVPNConfigCreateConfigRef,
      remoteAccessTabVPNConfigTableRef,
      setActiveTabKey,
    ],
  );

  const remoteAccessWithConnectToSiteTourSteps: TourProps['steps'] = useMemo(
    () => [
      {
        title: 'Hosts Table',
        description: (
          <>
            These are the nodes of your VPN, get host information like host name, private address, public address,
            connectivity status, health status and failover status. You can click on a host to view more details or
            hover over the ellipsis at the end of the row to edit, disconnect or remove a host from network.
          </>
        ),
        target: hostsTabContainerTableRef.current,
        onNext: () => {
          setActiveTabKey('clients');
          nextTourStep();
        },
      },
      {
        title: 'Gateway Table',
        description: (
          <>
            This is the gateway for users into the network, get gateway information like gateway name, private address,
            endpoint , default client DNS, and you can view the gateway details by clicking on the gateway name and
            hover over the ellipsis to edit it or remove it from the network and add a user or remove a user from the
            gateway.
          </>
        ),
        target: remoteAccessTabGatewayTableRef.current,
        onPrev: () => {
          setActiveTabKey('hosts');
          prevTourStep();
        },
      },
      {
        title: 'VPN Config Files Table',
        description: (
          <>
            Get VPN config files for clients, you can view the owner, address and gateway of the client, if its enabled
            and by clicking on the ellipsis you can download the config file, edit the client or remove the client from
            the gateway you can also see extra information about the client by clicking on the client name.
          </>
        ),
        target: remoteAccessTabVPNConfigTableRef.current,
      },
      {
        title: 'Create Config',
        description: 'Create a new VPN config file for a client',
        target: remoteAccessTabVPNConfigCreateConfigRef.current,
      },
    ],
    [
      hostsTabContainerTableRef,
      nextTourStep,
      prevTourStep,
      remoteAccessTabGatewayTableRef,
      remoteAccessTabVPNConfigCreateConfigRef,
      remoteAccessTabVPNConfigTableRef,
      setActiveTabKey,
    ],
  );

  const remoteAccessWithEgressTourStepsWithVpnConfig: TourProps['steps'] = useMemo(
    () => [
      {
        title: 'Hosts Table',
        description: (
          <>
            These are the nodes of your VPN, get host information like host name, private address, public address,
            connectivity status, health status and failover status. You can click on a host to view more details or
            hover over the ellipsis at the end of the row to edit, disconnect or remove a host from network.
          </>
        ),
        target: hostsTabContainerTableRef.current,
        onNext: () => {
          setActiveTabKey('clients');
          nextTourStep();
        },
      },
      {
        title: 'Gateway Table',
        description: (
          <>
            This is the gateway for users into the network, get gateway information like gateway name, private address,
            endpoint , default client DNS, and you can view the gateway details by clicking on the gateway name and
            hover over the ellipsis to edit it or remove it from the network and add a user or remove a user from the
            gateway.
          </>
        ),
        target: remoteAccessTabGatewayTableRef.current,
        onPrev: () => {
          setActiveTabKey('hosts');
          prevTourStep();
        },
      },
      {
        title: 'VPN Config Files Table',
        description: (
          <>
            Get VPN config files for clients, you can view the owner, address and gateway of the client, if its enabled
            and by clicking on the ellipsis you can download the config file, edit the client or remove the client from
            the gateway you can also see extra information about the client by clicking on the client name.
          </>
        ),
        target: remoteAccessTabVPNConfigTableRef.current,
      },
      {
        title: 'Create Config',
        description: 'Create a new VPN config file for a client',
        target: remoteAccessTabVPNConfigCreateConfigRef.current,
        onNext: () => {
          setActiveTabKey('egress');
          nextTourStep();
        },
      },
      {
        title: 'Egress Table',
        description: (
          <>
            These are the devices sending traffic to your network, get egress information like egress name, address and
            you can update the egress details by hovering over the ellipsis and clicking on update egress and you can
            get more info about the egress by clicking on the egress name.
          </>
        ),
        target: egressTabEgressTableRef.current,
        onPrev: () => {
          setActiveTabKey('clients');
          setTourStep(jumpToTourStepObj.remoteAccess);
        },
      },
      {
        title: 'External Routes Table',
        description: 'These are the ranges been forwarded by the egress',
        target: egressTabExternalRoutesTableRef.current,
      },
    ],
    [
      egressTabEgressTableRef,
      egressTabExternalRoutesTableRef,
      hostsTabContainerTableRef,
      jumpToTourStepObj.remoteAccess,
      nextTourStep,
      prevTourStep,
      remoteAccessTabGatewayTableRef,
      remoteAccessTabVPNConfigCreateConfigRef,
      remoteAccessTabVPNConfigTableRef,
      setActiveTabKey,
      setTourStep,
    ],
  );

  const handleTourOnChange = useCallback(
    (current: number) => {
      setTourStep(current);
    },
    [setTourStep],
  );

  const tourSteps = useMemo(() => {
    if (location.state) {
      if (location.state.startTour === 'remoteaccess_specificmachines_our_rac') {
        if (isServerEE) {
          return remoteAccessSpecificMachinesTourStepsPro;
        }
        return remoteAccessWithSpecificMachinesTourStepsCE;
      }
      if (location.state.startTour === 'remoteaccess_specificmachines_vpn_config') {
        return remoteAccessSpecificMachinesTourStepsWithVpnConfig;
      }
      if (location.state.startTour === 'remoteaccess_withegress_our_rac') {
        if (isServerEE) {
          return remoteAccessWithEgressTourStepsPro;
        }
        return remoteAccessWithEgressTourStepsCE;
      }
      if (location.state.startTour === 'remoteaccess_withegress_vpn_config') {
        return remoteAccessWithEgressTourStepsWithVpnConfig;
      }
      if (location.state.startTour === 'internetgateway') {
        return internetGatewayTourSteps;
      }
      if (location.state.startTour === 'connecttosite_router') {
        return remoteAccessWithConnectToSiteTourSteps;
      }
      if (location.state.startTour === 'connecttosite_netclient') {
        return egressGatewayTourSteps;
      }
    }

    if (isServerEE) {
      return networkDetailsTourStepsPro;
    }
    return networkDetailsTourStepsCE;
  }, [
    egressGatewayTourSteps,
    internetGatewayTourSteps,
    isServerEE,
    location.state,
    networkDetailsTourStepsCE,
    networkDetailsTourStepsPro,
    remoteAccessSpecificMachinesTourStepsPro,
    remoteAccessSpecificMachinesTourStepsWithVpnConfig,
    remoteAccessWithConnectToSiteTourSteps,
    remoteAccessWithEgressTourStepsCE,
    remoteAccessWithEgressTourStepsPro,
    remoteAccessWithEgressTourStepsWithVpnConfig,
    remoteAccessWithSpecificMachinesTourStepsCE,
  ]);

  const handleModalClose = useCallback(() => {
    setIsTourOpen(false);
    location.state = undefined;
  }, [location.state, setIsTourOpen]);

  const generateJumpToTourStepObj = useCallback(() => {
    // find the current step by index and then set the jump to tour step object
    const Texts = [
      'Overview',
      'Hosts Table',
      'Gateway Table',
      'Relays Table',
      'Egress Table',
      'DNS Table',
      'Access Control Table',
      'Graph',
      'Metrics Connectivity Status',
      'VPN Config Files Table',
      'Select Host for Remote Access Gateway',
      'Select Host for Egress Gateway',
    ];

    const TextToStepMap: { [key: string]: string } = {
      Overview: 'overview',
      'Hosts Table': 'hosts',
      'Gateway Table': 'remoteAccess',
      'Relays Table': 'relays',
      'Egress Table': 'egress',
      'DNS Table': 'dns',
      'Access Control Table': 'acls',
      Graph: 'graph',
      'Metrics Connectivity Status': 'metrics',
      Users: 'users',
      'VPN Config Files Table': 'vpnConfigs',
      'Select Host for Remote Access Gateway': 'remoteAccessGatewayModal',
      'Select Remote Access Gateway': 'remoteAccessVPNConfigModal',
      'Select Host for Egress Gateway': 'addEgressModal',
    };

    const jumpToTourStepObj: JumpToTourStepObj = {
      overview: 0,
      hosts: 1,
      remoteAccess: 6,
      remoteAccessGatewayModal: 7,
      vpnConfigs: 10,
      relays: 18,
      egress: 23,
      dns: 31,
      acls: 39,
      graph: 47,
      metrics: 48,
      remoteAccessVPNConfigModal: 49,
      addEgressModal: 50,
    };

    Texts.forEach((tab, index) => {
      const tourStepIndex = tourSteps?.findIndex((step) => step.title === tab);
      if (tourStepIndex !== -1) {
        jumpToTourStepObj[TextToStepMap[tab] as keyof JumpToTourStepObj] = tourStepIndex as number;
      }
    });

    props.setJumpToTourStepObj(jumpToTourStepObj);
  }, [props, tourSteps]);

  useEffect(() => {
    generateJumpToTourStepObj();
  }, [generateJumpToTourStepObj]);

  useEffect(() => {
    if (location.state == null) {
      return;
    }
    switch (location.state?.startTour) {
      case 'remoteaccess':
        setActiveTabKey('clients');
        if (clientGateways.length > 0) {
          setTourStep(jumpToTourStepObj?.remoteAccess);
          setIsTourOpen(true);
          break;
        }
        notify.info({
          message: 'Please add a gateway to start the tour',
          description: '',
        });
        break;
      case 'relays':
        setActiveTabKey('relays');
        if (relays.length > 0) {
          setTourStep(jumpToTourStepObj?.relays);
          setIsTourOpen(true);
          break;
        }
        notify.info({
          message: 'Please add a relay to start the tour',
          description: '',
        });
        break;
      case 'egress':
        setActiveTabKey('egress');
        if (egresses.length > 0) {
          setTourStep(jumpToTourStepObj?.egress);
          setIsTourOpen(true);
        }
        notify.info({
          message: 'Please add an egress to start the tour',
          description: '',
        });
        break;
      case 'acls':
        setActiveTabKey('access-control');
        setTourStep(jumpToTourStepObj?.acls);
        setIsTourOpen(true);
        break;
      default:
        setIsTourOpen(true);
        break;
    }
  }, [
    location.state,
    jumpToTourStepObj,
    setActiveTabKey,
    clientGateways.length,
    notify,
    relays.length,
    egresses.length,
    setTourStep,
    setIsTourOpen,
  ]);

  return (
    <>
      <Tour
        open={isTourOpen}
        steps={tourSteps}
        onClose={() => handleModalClose()}
        onChange={handleTourOnChange}
        current={tourStep}
        onFinish={() => {
          handleModalClose();
        }}
        mask={false}
      />
    </>
  );
}
