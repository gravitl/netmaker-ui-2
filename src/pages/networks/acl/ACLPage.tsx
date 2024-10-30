import { SearchOutlined, MoreOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { ComputerDesktopIcon, UsersIcon } from '@heroicons/react/24/solid';
import { Button, Dropdown, Input, Table, Tag, Tooltip, Switch, Modal, Col } from 'antd';
import { NotificationInstance } from 'antd/es/notification/interface';
import { useCallback, useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import { ACLRule } from '@/services/dtos/ACLDtos';
import { ACLService } from '@/services/ACLService';
import { extractErrorMsg } from '@/utils/ServiceUtils';
import arrowBidirectional from '../../../../public/arrow-bidirectional.svg';
import UpdateACLModal from '@/components/modals/update-acl-modal/UpdateACLModal';
import AddACLModal from '@/components/modals/add-acl-modal/AddACLModal';

interface ACLPageProps {
  networkId: string;
  notify: NotificationInstance;
  hostsTabContainerAddHostsRef: React.RefObject<HTMLButtonElement>;
  reloadACL: () => void;
}

export const ACLPage = ({ networkId, notify, hostsTabContainerAddHostsRef, reloadACL }: ACLPageProps) => {
  const [aclRules, setAclRules] = useState<ACLRule[]>([]);
  const [searchHost, setSearchHost] = useState('');
  const [policyType, setPolicyType] = useState('All');
  const [isEditPolicyModalOpen, setIsEditPolicyModalOpen] = useState(false);
  const [selectedEditPolicy, setSelectedEditPolicy] = useState<ACLRule | null>(null);
  const [addPolicyModal, setAddPolicyModal] = useState(false);

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
    fetchACLRules();
  }, [fetchACLRules]);

  const togglePolicyStatus = useCallback(
    async (policy: ACLRule) => {
      try {
        await ACLService.toggleEnabeledACLRule(policy, !policy.enabled, networkId);
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
    [fetchACLRules, notify, networkId],
  );

  const confirmDeletePolicy = useCallback(
    (policy: ACLRule) => {
      Modal.confirm({
        title: `Delete Policy ${policy.name}`,
        content: `Are you sure you want to delete this Policy?`,
        onOk: async () => {
          try {
            await ACLService.deleteACLRule(policy.id, networkId);
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
    [fetchACLRules, notify, networkId],
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

  useEffect(() => {
    fetchACLRules();
  }, [fetchACLRules]);

  const policyFilter = [
    { name: 'All' },
    { name: 'Resources', icon: ComputerDesktopIcon },
    { name: 'Users', icon: UsersIcon },
  ];

  return (
    <div className="flex flex-col w-full gap-6">
      <div className="flex items-start w-full gap-4 p-5 mb-2 border border-stroke-default rounded-xl bg-bg-contrastDefault ">
        <div className="flex flex-col w-full gap-2">
          <h3 className="text-text-primary text-base-semibold">Introducing the New Access Control System</h3>
          <p className="text-base text-text-secondary">
            Coming soon to replace the current Access Control system. Built to make access management easier and more
            secure.
          </p>
        </div>
      </div>
      <div className="flex justify-between w-full">
        <div className="flex gap-2">
          <Input
            size="large"
            placeholder="Search policies"
            value={searchHost}
            onChange={(ev) => setSearchHost(ev.target.value)}
            prefix={<SearchOutlined />}
            allowClear
            style={{ marginBottom: '.5rem' }}
          />
          <div className="flex gap-2">
            {policyFilter.map((filter) => (
              <button
                key={filter.name}
                onClick={() => setPolicyType(filter.name)}
                className={`flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors duration-200 ${
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
        <Col xs={24} md={6} className="add-host-dropdown-button">
          <Button
            type="primary"
            style={{ width: '170px', marginBottom: '.5rem' }}
            onClick={() => setAddPolicyModal(true)}
            ref={hostsTabContainerAddHostsRef}
          >
            <span>Add Policy</span>
          </Button>
        </Col>
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
                    <ComputerDesktopIcon className="w-4 h-4" />
                  ) : (
                    <UsersIcon className="w-4 h-4" />
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
                {rule.src_type.map((type, index) => (
                  <Tooltip key={index} title={type.value}>
                    <Tag>{type.value || 'Any'}</Tag>
                  </Tooltip>
                ))}
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
                {rule.dst_type.map((type, index) => (
                  <Tooltip key={index} title={type.value}>
                    <Tag>{type.value || 'Any'}</Tag>
                  </Tooltip>
                ))}
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
                <MoreOutlined
                  className={`${rule.default ? 'text-text-disabled cursor-not-allowed opacity-30' : 'cursor-pointer'}`}
                />
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
        networkId={networkId}
        onClose={() => {
          setAddPolicyModal(false);
        }}
        fetchACLRules={() => fetchACLRules()}
        reloadACL={reloadACL}
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
          fetchACLRules={fetchACLRules}
          reloadACL={reloadACL}
          notify={notify}
        />
      )}
    </div>
  );
};

export default ACLPage;
