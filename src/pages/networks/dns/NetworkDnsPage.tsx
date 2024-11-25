import AddDnsModal from '@/components/modals/add-dns-modal/AddDnsModal';
import AddRelayModal from '@/components/modals/add-relay-modal/AddRelayModal';
import UpdateRelayModal from '@/components/modals/update-relay-modal/UpdateRelayModal';
import { ExternalLinks } from '@/constants/LinkAndImageConstants';
import { NULL_NODE } from '@/constants/Types';
import PageLayout from '@/layouts/PageLayout';
import { DNS } from '@/models/Dns';
import { ExtendedNode } from '@/models/Node';
import { isSaasBuild } from '@/services/BaseService';
import { NetworksService } from '@/services/NetworksService';
import { NodesService } from '@/services/NodesService';
import { useStore } from '@/store/store';
import { getExtendedNode, isNodeRelay } from '@/utils/NodeUtils';
import { extractErrorMsg } from '@/utils/ServiceUtils';
import { useBranding, useGetActiveNetwork, useServerLicense } from '@/utils/Utils';
import {
  SearchOutlined,
  InfoCircleOutlined,
  QuestionCircleOutlined,
  MoreOutlined,
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { ComputerDesktopIcon, InboxStackIcon } from '@heroicons/react/24/solid';
import {
  Button,
  Card,
  Col,
  Dropdown,
  Input,
  MenuProps,
  Modal,
  notification,
  Row,
  Table,
  TableColumnProps,
  Tooltip,
  Typography,
} from 'antd';
import { AxiosError } from 'axios';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';

interface NetworkDnsPageProps {
  networkId?: string;
  isFullScreen: boolean;
}

export default function NetworkDnsPage({ isFullScreen }: NetworkDnsPageProps) {
  const store = useStore();
  const storeFetchNodes = store.fetchNodes;
  const { networkId } = useParams<{ networkId: string }>();
  const resolvedNetworkId = networkId || store.activeNetwork;
  const { isServerEE } = useServerLicense();
  const branding = useBranding();
  const { network, isLoadingNetwork } = useGetActiveNetwork(resolvedNetworkId);
  const [notify, notifyCtx] = notification.useNotification();

  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [searchDns, setSearchDns] = useState('');
  const [dnses, setDnses] = useState<DNS[]>([]);
  const [isAddDnsModalOpen, setIsAddDnsModalOpen] = useState(false);

  const networkNodes = useMemo(
    () =>
      store.nodes
        .map((node) => getExtendedNode(node, store.hostsCommonDetails))
        .filter((node) => node.network === resolvedNetworkId),
    [store.nodes, store.hostsCommonDetails, resolvedNetworkId],
  );

  const isDefaultDns = useCallback(
    (dns: DNS) => {
      return networkNodes.some(
        (node) => `${getExtendedNode(node, store.hostsCommonDetails).name}.${node.network}` === dns.name,
      );
    },
    [networkNodes, store.hostsCommonDetails],
  );

  const confirmDeleteDns = useCallback(
    (dns: DNS) => {
      Modal.confirm({
        title: `Delete DNS ${dns.name}.${dns.network}`,
        content: `Are you sure you want to delete this DNS?`,
        onOk: async () => {
          try {
            await NetworksService.deleteDns(dns.network, dns.name);
            setDnses((dnses) => dnses.filter((d) => d.name !== dns.name));
            notify.success({ message: 'DNS deleted' });
          } catch (err) {
            if (err instanceof AxiosError) {
              notify.error({
                message: 'Error deleting DNS',
                description: extractErrorMsg(err),
              });
            }
          }
        },
      });
    },
    [notify],
  );

  const onCreateDns = useCallback((dns: DNS) => {
    setDnses((prevDnses) => [...prevDnses, dns]);
    setIsAddDnsModalOpen(false);
  }, []);

  const loadNetworkDnses = useCallback(async () => {
    try {
      if (!networkId) return;
      const dnses = (await NetworksService.getDnsesPerNetwork(networkId)).data ?? [];
      setDnses(dnses);
    } catch (err) {
      if (err instanceof AxiosError && err.response?.status === 403) return;
      notify.error({
        message: 'Error loading network DNS',
        description: extractErrorMsg(err as any),
      });
    }
  }, [networkId, notify]);

  useEffect(() => {
    if (isInitialLoad) {
      loadNetworkDnses();
      setIsInitialLoad(false);
    }
  }, [isInitialLoad, loadNetworkDnses]);

  const isEmpty = dnses.length === 0;

  return (
    <PageLayout
      title="DNS"
      isFullScreen
      description={
        <>
          Configure and manage domain name resolution across your network infrastructure.
          <br />
          Set up DNS policies, manage records, and optimize name resolution performance.
        </>
      }
      icon={<InboxStackIcon className=" size-5" />}
    >
      {isEmpty && (
        <Row
          className="page-padding"
          style={{
            background: 'linear-gradient(90deg, #52379F 0%, #B66666 100%)',
            width: '100%',
          }}
        >
          <Col xs={24} xl={16}>
            <Typography.Title level={3} style={{ color: 'white ' }}>
              Domain Names
            </Typography.Title>
            <Typography.Text style={{ color: 'white ' }}>
              DNS, otherwise known as human-readable machine addresses, are used to easily access devices on the
              network. DNS entries can be created for devices on the network, and can be used to access devices by name
              instead of IP address.
              <a
                href="https://www.netmaker.io/features#DNS"
                target="_blank"
                rel="noreferrer"
                style={{ color: 'inherit', textDecoration: 'underline' }}
              >
                (Learn More)
              </a>
              .
            </Typography.Text>
          </Col>
          <Col xs={24} xl={8} style={{ position: 'relative' }}>
            <Card className="header-card" style={{ position: 'absolute', width: '100%' }}>
              <Typography.Title level={3}>Create DNS Entry</Typography.Title>
              <Typography.Text>
                Select a device to create a DNS entry for. Afterwards, you can access the device by name instead of IP.
              </Typography.Text>
              <Row style={{ marginTop: '5rem' }}>
                <Col>
                  <Button type="primary" size="large" onClick={() => setIsAddDnsModalOpen(true)}>
                    <PlusOutlined /> Create DNS
                  </Button>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      )}
      {!isEmpty && (
        <Row justify="space-between" style={{ marginBottom: '1rem', width: '100%' }}>
          <Col xs={24} md={8}>
            <Input
              size="large"
              placeholder="Search DNS"
              value={searchDns}
              onChange={(ev) => setSearchDns(ev.target.value)}
              prefix={<SearchOutlined />}
              style={{ marginBottom: '.5rem' }}
            />
          </Col>
          <Col xs={24} md={6} style={{ textAlign: 'right' }}>
            <Button
              type="primary"
              size="large"
              onClick={() => setIsAddDnsModalOpen(true)}
              className="mt-10 full-width-button-xs"
              style={{ marginBottom: '.5rem' }}
            >
              <PlusOutlined /> Add DNS
            </Button>
            {/* <Button
              style={{ marginLeft: '1rem', marginBottom: '.5rem' }}
              onClick={() => alert('not implemented')}
              icon={<InfoCircleOutlined />}
            >
              Take Tour
            </Button> */}
            <Button
              title="Go to DNS documentation"
              style={{ marginLeft: '1rem', marginBottom: '.5rem' }}
              href={ExternalLinks.CORE_DNS_SETUP_LINK}
              target="_blank"
              icon={<QuestionCircleOutlined />}
            />
          </Col>

          <Col xs={24} style={{ paddingTop: '1rem' }}>
            <div className="table-wrapper">
              <Table
                scroll={{ x: true }}
                columns={[
                  {
                    title: 'DNS Entry',
                    render(_, dns) {
                      return <Typography.Text copyable>{`${dns.name}`}</Typography.Text>;
                    },
                    sorter: (a, b) => a.name.localeCompare(b.name),
                    defaultSortOrder: 'ascend',
                  },
                  {
                    title: 'IP Addresses',
                    render(_, dns) {
                      const addrs = ([] as Array<string>).concat(dns.address || [], dns.address6 || []).join(', ');
                      return <Typography.Text copyable>{addrs}</Typography.Text>;
                    },
                  },
                  {
                    title: '',
                    key: 'action',
                    width: '1rem',
                    render: (_, dns) => (
                      <Dropdown
                        placement="bottomRight"
                        menu={{
                          items: [
                            {
                              key: 'delete',
                              disabled: isDefaultDns(dns),
                              onClick: () => (isDefaultDns(dns) ? undefined : confirmDeleteDns(dns)),
                              danger: true,
                              label: (
                                <Tooltip title={isDefaultDns(dns) ? 'Cannot delete default DNS' : 'Delete DNS'}>
                                  <DeleteOutlined /> Delete
                                </Tooltip>
                              ),
                            },
                          ] as MenuProps['items'],
                        }}
                      >
                        <MoreOutlined />
                      </Dropdown>
                    ),
                  },
                ]}
                dataSource={dnses.filter((dns) => dns.name.toLocaleLowerCase().includes(searchDns.toLocaleLowerCase()))}
                rowKey="name"
                size="small"
              />
            </div>
          </Col>
        </Row>
      )}

      {/* misc */}
      {notifyCtx}
      <AddDnsModal
        isOpen={isAddDnsModalOpen}
        networkId={resolvedNetworkId}
        onCreateDns={onCreateDns}
        onCancel={() => setIsAddDnsModalOpen(false)}
      />
    </PageLayout>
  );
}
