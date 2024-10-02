import { SearchOutlined, MoreOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { ComputerDesktopIcon, EllipsisHorizontalIcon, TagIcon, UserIcon, UsersIcon } from '@heroicons/react/24/solid';
import {
  Button,
  Dropdown,
  Input,
  Table,
  Tag,
  Tooltip,
  Switch,
  Modal,
  Col,
  Row,
  Typography,
  notification,
  theme,
} from 'antd';
import { NotificationInstance } from 'antd/es/notification/interface';
import { useCallback, useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import { ACLRule, DestinationTypeValue, SourceTypeValue } from '@/services/dtos/ACLDtos';
import { ACLService } from '@/services/ACLService';
import { extractErrorMsg } from '@/utils/ServiceUtils';
import arrowBidirectional from '../../../../public/arrow-bidirectional.svg';
import UpdateACLModal from '@/components/modals/update-acl-modal/UpdateACLModal';
import AddACLModal from '@/components/modals/add-acl-modal/AddACLModal';
import { UsersService } from '@/services/UsersService';
import { User, UserGroup } from '@/models/User';
import { useBranding, useGetActiveNetwork, useServerLicense } from '@/utils/Utils';
import { Tag as TagType } from '@/models/Tags';
import { TagsService } from '@/services/TagsService';
import { useStore } from '@/store/store';
import { useNavigate, useParams } from 'react-router-dom';
import { getNetworkPageRoute } from '@/utils/RouteUtils';

interface NetworkAclsPageProps {
  isFullScreen: boolean;
  networkId?: string;
  // notify: NotificationInstance;
  // hostsTabContainerAddHostsRef?: React.RefObject<HTMLButtonElement>;
  // reloadACL: () => void;
}

export function NetworkAclsPage({
  isFullScreen,
  // networkId,
  // notify,
  // hostsTabContainerAddHostsRef,
  // reloadACL,
}: NetworkAclsPageProps) {
  const store = useStore();
  const storeFetchNodes = store.fetchNodes;
  const { aclVersion, setAclVersion } = store;
  const { networkId } = useParams<{ networkId: string }>();
  const resolvedNetworkId = networkId || store.activeNetwork;
  const { isServerEE } = useServerLicense();
  const branding = useBranding();
  const { network, isLoadingNetwork } = useGetActiveNetwork(resolvedNetworkId);
  const [notify, notifyCtx] = notification.useNotification();
  const { token: themeToken } = theme.useToken();
  const navigate = useNavigate();

  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [aclRules, setAclRules] = useState<ACLRule[]>([]);
  const [searchHost, setSearchHost] = useState('');
  const [policyType, setPolicyType] = useState('All');
  const [isEditPolicyModalOpen, setIsEditPolicyModalOpen] = useState(false);
  const [selectedEditPolicy, setSelectedEditPolicy] = useState<ACLRule | null>(null);
  const [addPolicyModal, setAddPolicyModal] = useState(false);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [groupsList, setGroupsList] = useState<UserGroup[]>([]);
  const [tagsList, setTagsList] = useState<TagType[]>([]);

  const fetchACLRules = useCallback(async () => {
    try {
      if (!networkId) return;
      const aclRulesResponse = (await ACLService.getACLRules(networkId)).data.Response;
      setAclRules(aclRulesResponse);
    } catch (error) {
      notify.error({
        message: 'Failed to fetch ACL rules',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  }, [networkId, notify]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await UsersService.getUsers();
        setUsersList(response.data || []);
      } catch (error) {
        console.error('Error fetching users:', error);
        setUsersList([]);
      }
    };

    const fetchTags = async () => {
      try {
        const tags = (await TagsService.getTagsPerNetwork(resolvedNetworkId)).data.Response;
        setTagsList(tags);
      } catch (error) {
        console.error('Error fetching tags:', error);
        setTagsList([]);
      }
    };

    const fetchGroups = async () => {
      try {
        const response = await UsersService.getGroups();
        const filteredGroups = (response.data.Response || []).filter((group) => {
          if (!group.network_roles) {
            return false;
          }
          return (
            Object.keys(group.network_roles).includes(resolvedNetworkId) ||
            Object.keys(group.network_roles).includes('all_networks')
          );
        });
        setGroupsList(filteredGroups);
      } catch (error) {
        console.error('Error fetching groups:', error);
        setGroupsList([]);
      }
    };

    fetchUsers();
    isServerEE && fetchGroups();
    fetchTags();
  }, [networkId, isServerEE, resolvedNetworkId]);

  useEffect(() => {
    fetchACLRules();
  }, [fetchACLRules]);

  const togglePolicyStatus = useCallback(
    async (policy: ACLRule) => {
      try {
        await ACLService.toggleEnabeledACLRule(policy, !policy.enabled, resolvedNetworkId);
        await fetchACLRules();
        notify.success({
          message: `Policy ${policy.enabled ? 'disabled' : 'enabled'} successfully`,
        });
      } catch (err) {
        if (err instanceof AxiosError) {
          notify.error({
            message: 'Error toggling policy status',
            description: extractErrorMsg(err),
          });
        }
      }
    },
    [resolvedNetworkId, fetchACLRules, notify],
  );

  const confirmDeletePolicy = useCallback(
    (policy: ACLRule) => {
      Modal.confirm({
        title: `Delete Policy ${policy.name}`,
        content: `Are you sure you want to delete this Policy?`,
        onOk: async () => {
          try {
            await ACLService.deleteACLRule(policy.id, resolvedNetworkId);
            await fetchACLRules();
            notify.success({ message: 'Policy deleted successfully' });
          } catch (err) {
            if (err instanceof AxiosError) {
              notify.error({
                message: 'Error deleting policy',
                description: extractErrorMsg(err),
              });
            }
          }
        },
      });
    },
    [resolvedNetworkId, fetchACLRules, notify],
  );

  const filteredACLRules = aclRules.filter((rule) => {
    const matchesSearch = rule.name.toLowerCase().includes(searchHost.toLowerCase());
    let matchesPolicyType = true;
    if (policyType === 'Resources') {
      matchesPolicyType = rule.policy_type === 'device-policy';
    } else if (policyType === 'Users') {
      matchesPolicyType = rule.policy_type !== 'device-policy';
    }
    return matchesSearch && matchesPolicyType;
  });

  const policyFilter = [
    { name: 'All' },
    { name: 'Resources', icon: ComputerDesktopIcon },
    { name: 'Users', icon: UsersIcon },
  ];

  useEffect(() => {
    if (isInitialLoad) {
      fetchACLRules();
      setIsInitialLoad(false);
    }
  }, [isInitialLoad, fetchACLRules]);

  return (
    <div className="NetworkAclsPage" style={{ position: 'relative', height: '100%', padding: isFullScreen ? 0 : 24 }}>
      <div className={`${isFullScreen ? 'page-padding' : ''}`}>
        <Row style={{ marginBottom: '1rem', width: '100%' }}>
          <Col>
            <Typography.Title level={2}>Access Control</Typography.Title>
          </Col>
        </Row>
        <div className="flex flex-col w-full gap-6">
          <div className="flex items-end w-full gap-4 p-5 mb-6 border border-stroke-default rounded-xl bg-bg-contrastDefault ">
            <div className="flex flex-col items-start w-full gap-2">
              <div className="flex items-center">
                <h3 className="text-text-primary text-base-semibold">Introducing the New Access Control System</h3>
                <span className="ml-2 px-2 py-0.5 text-white bg-button-primary-fill-default rounded-full text-xs">
                  Beta
                </span>
              </div>
              <p className="text-base text-text-secondary">Built to make access management easier and more secure.</p>
            </div>
            <div className="flex items-center gap-4">
              <p className="text-sm text-text-secondary whitespace-nowrap">Not sure?</p>
              <Button
                type="primary"
                onClick={() => {
                  setAclVersion(1);
                  navigate(getNetworkPageRoute('old-acls'));
                }}
              >
                Revert to old ACL
              </Button>{' '}
            </div>
          </div>
          <div className="flex flex-col justify-between w-full gap-4 md:flex-row">
            <div className="flex flex-col gap-3 md:flex-row">
              <Input
                size="large"
                placeholder="Search policies"
                value={searchHost}
                onChange={(ev) => setSearchHost(ev.target.value)}
                prefix={<SearchOutlined />}
                allowClear
                className="w-[300px]"
              />

              <div className="flex gap-2 px-4 pb-2 -mx-4 overflow-x-auto sm:mx-0 sm:px-0 sm:overflow-x-visible">
                {policyFilter.map((filter) => (
                  <button
                    key={filter.name}
                    onClick={() => setPolicyType(filter.name)}
                    className={`flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors duration-200 flex-shrink-0 ${
                      policyType === filter.name
                        ? 'bg-button-secondary-fill-default text-text-primary'
                        : 'bg-transparent text-text-secondary hover:bg-button-secondary-fill-hover'
                    }`}
                  >
                    {filter.icon && <filter.icon className="flex-shrink-0 w-4 h-4" />}
                    <span className="whitespace-nowrap">{filter.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <Button type="primary" className="w-full sm:w-[170px]" onClick={() => setAddPolicyModal(true)}>
              <span>Add Policy</span>
            </Button>
          </div>
          <Table
            scroll={{ x: true }}
            columns={[
              {
                title: 'Policy Name',
                dataIndex: 'name',
                sorter: (a: ACLRule, b: ACLRule) => a.name.localeCompare(b.name),
                defaultSortOrder: 'ascend',
              },
              {
                title: 'Type',
                dataIndex: 'policy_type',
                render: (policyType: string) => (
                  <div className="flex items-center gap-2 text-sm-semibold">
                    <span>
                      {policyType === 'device-policy' ? (
                        <ComputerDesktopIcon className="w-4 h-4 shrink-0" />
                      ) : (
                        <UsersIcon className="w-4 h-4 shrink-0" />
                      )}
                    </span>
                    <span>{policyType === 'device-policy' ? 'Resources' : 'Users'}</span>
                  </div>
                ),
              },
              {
                title: 'Source',
                render: (_, rule: ACLRule) => (
                  <>
                    {rule.src_type.map((type: SourceTypeValue, index) => {
                      let displayValue = type.value;
                      let Icon = UserIcon;

                      if (type.value === '*') {
                        displayValue =
                          type.id === 'user'
                            ? 'All Users'
                            : type.id === 'user-group'
                              ? 'All Groups'
                              : type.id === 'tag'
                                ? 'All Resources'
                                : type.value;

                        Icon = type.id === 'user' ? UserIcon : type.id === 'user-group' ? UsersIcon : TagIcon;
                      } else if (type.id === 'user-group') {
                        const group = groupsList.find((g) => g.id === type.value);
                        displayValue = group?.name || type.value;
                        Icon = UsersIcon;
                      } else if (type.id === 'tag') {
                        const tag = tagsList.find((t) => t.id === type.value);
                        displayValue = tag?.tag_name || type.value;
                        Icon = TagIcon;
                      } else if (type.id === 'user') {
                        Icon = UserIcon;
                      }

                      return (
                        <Tooltip key={index} title={displayValue}>
                          <Tag>
                            <div className="flex items-center gap-1">
                              <Icon className="w-3 h-3 shrink-0" />
                              <span>{displayValue}</span>
                            </div>
                          </Tag>
                        </Tooltip>
                      );
                    })}
                  </>
                ),
              },
              {
                title: 'Direction',
                render: () => <img src={arrowBidirectional} alt="Bidirectional" className="self-center w-32" />,
              },
              {
                title: 'Destination',
                render: (_, rule: ACLRule) => (
                  <>
                    {rule.dst_type.map((type: DestinationTypeValue, index) => {
                      let displayValue = type.value;

                      if (type.value === '*') {
                        displayValue = 'All Resources';
                      } else {
                        const tag = tagsList.find((t) => t.id === type.value);
                        displayValue = tag?.tag_name || type.value;
                      }

                      return (
                        <Tooltip key={index} title={displayValue}>
                          <Tag>
                            <div className="flex items-center gap-1">
                              <TagIcon className="w-3 h-3 shrink-0" />
                              <span>{displayValue}</span>
                            </div>
                          </Tag>
                        </Tooltip>
                      );
                    })}
                  </>
                ),
              },
              {
                title: 'Active',
                dataIndex: 'enabled',
                render: (enabled: boolean, record: ACLRule) => (
                  <Switch
                    checked={enabled}
                    onChange={(checked) => togglePolicyStatus({ ...record, enabled: !checked })}
                    size="small"
                  />
                ),
              },
              {
                width: '1rem',
                align: 'right',
                render: (_, rule: ACLRule) => (
                  <Dropdown
                    menu={{
                      items: [
                        {
                          key: 'edit',
                          label: 'Edit',
                          icon: <EditOutlined />,
                          onClick: () => {
                            setSelectedEditPolicy(rule);
                            setIsEditPolicyModalOpen(true);
                          },
                          disabled: rule.default,
                        },
                        {
                          key: 'remove',
                          label: 'Remove',
                          icon: <DeleteOutlined />,
                          danger: true,
                          onClick: () => confirmDeletePolicy(rule),
                          disabled: rule.default,
                        },
                      ],
                    }}
                    disabled={rule.default}
                  >
                    <div
                      className={`${rule.default ? 'text-text-disabled cursor-not-allowed opacity-30' : 'cursor-pointer'} rounded-md p-1/2 shrink-0 outline outline-stroke-default bg-bg-default hover:bg-bg-hover `}
                    >
                      <EllipsisHorizontalIcon className="w-6 h-6 text-text-primary" />
                    </div>
                  </Dropdown>
                ),
              },
            ]}
            dataSource={filteredACLRules}
            rowKey="id"
            size="small"
          />
          <AddACLModal
            isOpen={addPolicyModal}
            networkId={resolvedNetworkId}
            onClose={() => {
              setAddPolicyModal(false);
            }}
            fetchACLRules={() => fetchACLRules()}
            reloadACL={fetchACLRules}
            notify={notify}
          />
          {networkId && (
            <UpdateACLModal
              isOpen={isEditPolicyModalOpen}
              onClose={() => {
                setIsEditPolicyModalOpen(false);
                setSelectedEditPolicy(null);
              }}
              networkId={networkId}
              selectedPolicy={selectedEditPolicy}
              fetchACLRules={() => fetchACLRules()}
              reloadACL={fetchACLRules}
              notify={notify}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default NetworkAclsPage;
