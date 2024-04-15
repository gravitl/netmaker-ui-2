import { MetricCategories } from '@/models/Metrics';
import { ExtendedNode } from '@/models/Node';
import { useStore } from '@/store/store';
import { Tour, TourProps } from 'antd';
import { t } from 'i18next';
import { useRef, Fragment, Ref, RefObject, useMemo, useCallback, useEffect } from 'react';

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
  // addRAGateway: number;
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
  remoteAccessTabVPNConfigCreateConfigRef: RefObject<HTMLDivElement>;
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
    remoteAccessTabVPNConfigCreateConfigRef,
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
  } = props;
  const store = useStore();
  const isServerEE = store.serverConfig?.IsEE === 'yes';

  const nextTourStep = () => {
    setTourStep(tourStep + 1);
  };

  const prevTourStep = () => {
    setTourStep(tourStep - 1);
  };

  const networkDetailsTourStepsPro: TourProps['steps'] = [
    {
      title: 'Overview',
      description: 'Get a quick overview of your network',
      target: overviewTabContainerRef.current,
      onNext: () => {
        nextTourStep();
        setActiveTabKey('hosts');
      },
    },
    {
      title: 'Hosts Table',
      description: (
        <>
          Get host information like host name, private address, public address, connectivity status, health status and
          failover status. You can click on a host to view more details or hover over the ellipsis at the end of the row
          to edit, disconnect or remove a host from network.
        </>
      ),
      target: hostsTabContainerTableRef.current,
      onPrev: () => {
        prevTourStep();
        setActiveTabKey('overview');
      },
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
          setTourStep(8);
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
          nextTourStep();
        } else {
          setActiveTabKey('hosts');
          setTourStep(5);
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
          setTourStep(14);
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
        setActiveTabKey('access-control');
        nextTourStep();
      },
    },
    {
      title: 'Access Control Table',
      description: (
        <>
          Show information about which machines can access which other machines on the network and you can also disable
          the connection
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
        nextTourStep();
      },
    },
  ];

  const networkDetailsTourStepsCE: TourProps['steps'] = [
    {
      title: 'Overview',
      description: 'Get a quick overview of your network',
      target: overviewTabContainerRef.current,
      onNext: () => {
        nextTourStep();
        setActiveTabKey('hosts');
      },
    },
    {
      title: 'Hosts Table',
      description: (
        <>
          Get host information like host name, private address, public address, connectivity status, health status and
          failover status. You can click on a host to view more details or hover over the ellipsis at the end of the row
          to edit, disconnect or remove a host from network.
        </>
      ),
      target: hostsTabContainerTableRef.current,
      onPrev: () => {
        prevTourStep();
        setActiveTabKey('overview');
      },
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
          setTourStep(8);
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
          setTourStep(5);
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
          setTourStep(13);
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
          setTourStep(23);
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
          setTourStep(29);
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
          Show information about which machines can access which other machines on the network and you can also disable
          the connection
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
  ];

  const handleTourOnChange = (current: number) => {
    setTourStep(current);
  };

  const tourSteps = useMemo(() => (isServerEE ? networkDetailsTourStepsPro : networkDetailsTourStepsCE), [isServerEE]);

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
    };

    const jumpToTourStepObj: JumpToTourStepObj = {
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
    };

    Texts.forEach((tab, index) => {
      const tourStepIndex = tourSteps.findIndex((step) => step.title === tab);
      if (tourStepIndex !== -1) {
        jumpToTourStepObj[TextToStepMap[tab] as keyof JumpToTourStepObj] = tourStepIndex;
      }
    });

    props.setJumpToTourStepObj(jumpToTourStepObj);
  }, [tourSteps]);

  useEffect(() => {
    generateJumpToTourStepObj();
  }, [generateJumpToTourStepObj]);

  return (
    <>
      <Tour
        open={isTourOpen}
        steps={isServerEE ? networkDetailsTourStepsPro : networkDetailsTourStepsCE}
        onClose={() => setIsTourOpen(false)}
        onChange={handleTourOnChange}
        current={tourStep}
      />
    </>
  );
}
