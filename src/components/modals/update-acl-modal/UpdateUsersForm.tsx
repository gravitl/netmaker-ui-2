import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { notification, Switch, Button, Select, Input, InputNumber, Alert, Tooltip } from 'antd';
import { useForm, Controller } from 'react-hook-form';
import {
  UsersIcon,
  WrenchIcon,
  XMarkIcon,
  UserIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  TagIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/solid';
import { UsersService } from '@/services/UsersService';
import { ACLService } from '@/services/ACLService';
import { TagsService } from '@/services/TagsService';
import { User, UserGroup } from '@/models/User';
import { Tag } from '@/models/Tags';
import { ACLRule, SourceTypeValue, DestinationTypeValue } from '@/services/dtos/ACLDtos';
import { Network } from '@/models/Network';
import { extractErrorMsg } from '@/utils/ServiceUtils';
import { NotificationInstance } from 'antd/es/notification/interface';
import { Link } from 'react-router-dom';
import { useServerLicense } from '@/utils/Utils';
import arrowBidirectional from '@/assets/arrow-bidirectional.svg';
import arrowLeft from '@/assets/arrow-l.svg';
import arrowRight from '@/assets/arrow-r.svg';

interface Item {
  id: string;
  name: string;
  type: 'user' | 'group' | 'tag';
}

interface SelectDropdownProps {
  value: Item[];
  onChange: (value: Item[]) => void;
  placeholder?: string;
  showManageButton?: boolean;
  users?: User[];
  groups?: UserGroup[];
  onManageClick?: () => void;
}

interface TagSelectDropdownProps
  extends Omit<SelectDropdownProps, 'users' | 'groups' | 'showManageButton' | 'onManageClick'> {
  value: Item[];
  onChange: (value: Item[]) => void;
  placeholder?: string;
  tags?: Tag[];
}

interface UpdateUsersFormProps {
  networkId: Network['netid'];
  onClose?: () => void;
  selectedPolicy: ACLRule;
  reloadACL: () => void;
  fetchACLRules: () => void;
  notify: NotificationInstance;
}

interface ACLType {
  name: string;
  allowed_protocols: string[];
  port_range: string | number;
  allow_port_setting: boolean;
}

interface FormValues {
  name: string;
  source: Item[];
  destination: Item[];
  service: string;
  port: string;
}

const SelectDropdown: React.FC<SelectDropdownProps> = ({
  value = [],
  onChange,
  placeholder = 'Select items',
  showManageButton = true,
  onManageClick,
  users = [],
  groups = [],
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState('');

  const { isServerEE } = useServerLicense();

  const toggleItem = useCallback(
    (item: User) => {
      const newItem: Item = {
        id: item.username,
        name: item.username,
        type: 'user',
      };
      const isSelected = value.some((v) => v.id === item.username);
      onChange(isSelected ? value.filter((v) => v.id !== item.username) : [...value, newItem]);
    },
    [value, onChange],
  );

  const toggleGroup = useCallback(
    (group: UserGroup) => {
      const newItem: Item = {
        id: group.id,
        name: group.name,
        type: 'group',
      };
      const isSelected = value.some((v) => v.id === group.id);
      onChange(isSelected ? value.filter((v) => v.id !== group.id) : [...value, newItem]);
    },
    [value, onChange],
  );

  const filteredItems = useMemo(() => {
    const searchLower = searchText.toLowerCase();
    return {
      groups: groups.filter((group) => group.name.toLowerCase().includes(searchLower)),
      users: users.filter((user) => user.username.toLowerCase().includes(searchLower)),
    };
  }, [searchText, users, groups]);

  const removeItem = useCallback(
    (itemToRemove: Item) => {
      onChange(value.filter((item) => item.id !== itemToRemove.id));
    },
    [value, onChange],
  );

  return (
    <div className="relative w-full">
      <div
        className="flex cursor-pointer flex-wrap items-center min-h-[38px] w-full p-2 border rounded-lg bg-bg-default border-stroke-default"
        onClick={() => setIsOpen(true)}
      >
        {value.length === 0 ? (
          <span className="px-2 text-text-secondary">{placeholder}</span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {value.map((item) => (
              <span
                key={item.id}
                className="inline-flex items-center gap-1 px-2 py-1 text-sm rounded text-text-primary bg-bg-hover"
              >
                {item.type === 'group' ? (
                  <UsersIcon className="w-3 h-3 shrink-0" />
                ) : (
                  <UserIcon className="w-3 h-3 shrink-0" />
                )}
                {item.name}
                <XMarkIcon
                  className="w-4 h-4 cursor-pointer shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeItem(item);
                  }}
                />
              </span>
            ))}
          </div>
        )}
        <ChevronDownIcon className="absolute w-4 h-4 ml-auto shrink-0 top-2 right-2 text-text-secondary" />
      </div>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute z-20 mt-1 overflow-hidden border rounded-lg shadow-lg w-[520px] bg-bg-default border-stroke-default">
            <div className="p-2 border-b border-stroke-default">
              <div className="relative">
                <input
                  type="text"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Search groups and users..."
                  className="w-full pl-8 pr-2 py-1.5 text-sm border rounded-md bg-bg-default border-stroke-default focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
                <MagnifyingGlassIcon className="absolute w-4 h-4 shrink-0 left-2 top-2 text-text-secondary" />
              </div>
            </div>

            <div className="w-full">
              <div className="flex w-full max-h-[180px]">
                {filteredItems.groups.length > 0 && isServerEE && (
                  <div className="w-full py-1 overflow-y-auto">
                    <div className="px-3 py-1 text-sm text-text-secondary">Select groups</div>
                    {filteredItems.groups.map((group) => (
                      <div
                        key={group.id}
                        className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-button-secondary-fill-hover"
                        onClick={() => toggleGroup(group)}
                      >
                        <UsersIcon className="w-4 h-4 shrink-0 text-text-secondary" />
                        {group.name}
                        {value.some((v) => v.id === group.id) && <div className="w-4 h-4 ml-auto">✓</div>}
                      </div>
                    ))}
                  </div>
                )}

                {filteredItems.users.length > 0 && (
                  <div className="w-full py-1 overflow-y-auto">
                    <div className="px-3 py-1 text-sm text-text-secondary">Select individual users</div>
                    {filteredItems.users.map((user) => (
                      <div
                        key={user.username}
                        className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-button-secondary-fill-hover"
                        onClick={() => toggleItem(user)}
                      >
                        <UserIcon className="w-4 h-4 shrink-0 text-text-secondary" />
                        {user.username}
                        {value.some((v) => v.id === user.username) && <div className="w-4 h-4 ml-auto">✓</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {showManageButton && (
                <div className="w-full p-2 border-t border-stroke-default">
                  <Link to="/users">
                    <button
                      type="button"
                      onClick={onManageClick}
                      className="flex items-center justify-center w-full gap-2 px-4 py-2 text-sm transition-colors duration-200 rounded-md bg-button-primary-fill-default hover:bg-button-primary-fill-hover"
                    >
                      <WrenchIcon className="w-4 h-4 shrink-0" />
                      Manage groups and users
                    </button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const TagSelectDropdown: React.FC<TagSelectDropdownProps> = ({
  value = [],
  onChange,
  placeholder = 'Select tag',
  tags = [],
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState('');

  const selectAllTag = () => {
    const isAllCurrentlySelected = value.some((v) => v.id === '*');

    if (isAllCurrentlySelected) {
      onChange([]);
    } else {
      const tagItem: Item = {
        id: '*',
        name: 'All Resources',
        type: 'tag',
      };
      onChange([tagItem]);
    }
  };

  const toggleTag = useCallback(
    (tag: Tag) => {
      if (value.some((v) => v.id === '*')) {
        return;
      }
      const tagItem: Item = {
        id: tag.id,
        name: tag.tag_name,
        type: 'tag',
      };
      const isSelected = value.some((v) => v.id === tag.id);
      const newValue = isSelected ? value.filter((v) => v.id !== tag.id) : [...value, tagItem];

      onChange(newValue);
    },
    [value, onChange],
  );

  const removeItem = useCallback(
    (itemToRemove: Item) => {
      onChange(value.filter((item) => item.id !== itemToRemove.id));
    },
    [value, onChange],
  );

  const filteredTags = useMemo(() => {
    const searchLower = searchText.toLowerCase();
    return tags.filter((tag) => tag.tag_name.toLowerCase().includes(searchLower));
  }, [searchText, tags]);

  return (
    <div className="relative w-full">
      <div
        className="flex cursor-pointer flex-wrap items-center min-h-[38px] w-full p-2 border rounded-lg bg-bg-default border-stroke-default"
        onClick={() => setIsOpen(true)}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="true"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(true);
          }
        }}
      >
        {value.length === 0 ? (
          <span className="px-2 text-text-secondary">{placeholder}</span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {value.map((item) => (
              <span
                key={item.id}
                className="inline-flex items-center gap-1 px-2 py-1 text-sm rounded text-text-primary bg-bg-hover"
              >
                <TagIcon className="w-3 h-3 shrink-0" />
                {item.name}
                <XMarkIcon
                  className="w-4 h-4 cursor-pointer shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeItem(item);
                  }}
                />
              </span>
            ))}
          </div>
        )}
        <ChevronDownIcon className="absolute w-4 h-4 ml-auto shrink-0 top-2 right-2 text-text-secondary" />
      </div>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute z-20 mt-1 overflow-hidden border rounded-lg shadow-lg w-96 bg-bg-default border-stroke-default">
            <div className="p-2 border-b border-stroke-default">
              <div className="relative">
                <input
                  type="text"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Search tags..."
                  className="w-full pl-8 pr-2 py-1.5 text-sm border rounded-md bg-bg-default border-stroke-default focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
                <MagnifyingGlassIcon className="absolute w-4 h-4 shrink-0 left-2 top-2 text-text-secondary" />
              </div>
            </div>

            <div className="w-full py-1">
              <div
                className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-button-secondary-fill-hover"
                onClick={selectAllTag}
              >
                <TagIcon className="w-4 h-4 shrink-0 text-text-secondary" />
                All Resources
                {value.some((v) => v.id === '*') && <div className="w-4 h-4 ml-auto">✓</div>}
              </div>

              {filteredTags.map((tag) => {
                const isSelected = value.some((v) => v.id === tag.id);
                const isDisabled = value.some((v) => v.id === '*');

                return (
                  <div
                    key={tag.id}
                    className={`
                      flex items-center gap-2 px-3 py-2 text-sm
${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-button-secondary-fill-hover'}
                    ${isSelected && !isDisabled ? 'bg-button-secondary-fill-hover' : ''}
                    `}
                    onClick={() => !isDisabled && toggleTag(tag)}
                    role="option"
                    aria-selected={isSelected}
                    aria-disabled={isDisabled}
                  >
                    <TagIcon className="w-4 h-4 shrink-0 text-text-secondary" aria-hidden="true" />
                    <span className="flex-1">{tag.tag_name}</span>
                    {isSelected && !isDisabled && <div className="w-4 h-4 ml-auto text-primary-500">✓</div>}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const UpdateUsersForm: React.FC<UpdateUsersFormProps> = ({
  networkId,
  onClose,
  selectedPolicy,
  reloadACL,
  notify,
  fetchACLRules,
}) => {
  const [isPolicyEnabled, setIsPolicyEnabled] = useState(selectedPolicy.enabled);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [groupsList, setGroupsList] = useState<UserGroup[]>([]);
  const [tagsList, setTagsList] = useState<Tag[]>([]);
  const [direction, setDirection] = useState<0 | 1>(selectedPolicy.allowed_traffic_direction);
  const [aclTypes, setAclTypes] = useState<ACLType[]>([]);
  const [selectedService, setSelectedService] = useState<ACLType | null>(null);
  const [showUnidirectionalWarning, setShowUnidirectionalWarning] = useState(false);
  const [protocolType, setProtocolType] = useState<'tcp' | 'udp' | 'icmp'>(
    (selectedPolicy.protocol || 'tcp') as 'tcp' | 'udp' | 'icmp',
  );
  const { isServerEE } = useServerLicense();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
    setValue,
  } = useForm<FormValues>({
    defaultValues: {
      name: selectedPolicy.name,
      source: [],
      destination: [],
      service: selectedPolicy.type,
      port:
        selectedPolicy.type === 'All TCP' || selectedPolicy.type === 'All UDP'
          ? 'All ports'
          : selectedPolicy.ports.length > 0
            ? selectedPolicy.ports.map((port) => port.split('/')[0]).join(',')
            : '',
    },
  });

  const validatePortFormat = (value: string): boolean => {
    if (protocolType === 'icmp') return true;
    if (selectedService?.port_range === 'All ports' && selectedService?.name !== 'Custom') return true;
    if (value === '') return true;

    if (!value) return false;

    const sanitizedValue = value.replace(/\s/g, '');
    const isValidFormat = /^(\d+(-\d+)?)(,\d+(-\d+)?)*$/.test(sanitizedValue);
    if (!isValidFormat) return false;

    const parts = sanitizedValue.split(',');
    return parts.every((part) => {
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(Number);
        return !isNaN(start) && !isNaN(end) && start >= 1 && start <= 65535 && end >= 1 && end <= 65535 && start < end;
      }
      const port = Number(part);
      return !isNaN(port) && port >= 1 && port <= 65535;
    });
  };

  const convertPortsToArray = (portString: string): string[] => {
    if (protocolType === 'icmp' || (selectedService?.port_range === 'All ports' && selectedService?.name !== 'Custom'))
      return [];

    const ports: string[] = [];
    const entries = portString.split(',').map((entry) => entry.trim());

    for (const entry of entries) {
      if (entry.includes('-')) {
        const [start, end] = entry.split('-').map(Number);
        ports.push(`${start}-${end}`);
      } else {
        ports.push(entry);
      }
    }

    return ports;
  };
  const convertSourceTypesToItems = useCallback(
    (sourceTypes: SourceTypeValue[]): Item[] => {
      return sourceTypes.map((source) => {
        if (source.id === 'user-group') {
          const group = groupsList.find((g) => g.id === source.value);
          return {
            id: source.value,
            name: group?.name || source.value,
            type: 'group',
          };
        }
        return {
          id: source.value,
          name: source.value,
          type: 'user',
        };
      });
    },
    [groupsList],
  );

  const convertDestinationTypeToItems = useCallback((destinationTypes: DestinationTypeValue[]): Item[] => {
    return destinationTypes.map((dest) => ({
      id: dest.value,
      name: dest.value === '*' ? 'All Resources' : dest.value,
      type: 'tag',
    }));
  }, []);

  useEffect(() => {
    setValue('name', selectedPolicy.name);
    setValue('source', convertSourceTypesToItems(selectedPolicy.src_type));
    setValue('destination', convertDestinationTypeToItems(selectedPolicy.dst_type));
  }, [selectedPolicy, setValue, convertSourceTypesToItems, convertDestinationTypeToItems]);

  useEffect(() => {
    const fetchACLTypes = async () => {
      try {
        if (!networkId) return;
        const response = await ACLService.getACLTypes();
        const types = response?.data?.Response?.ProtocolTypes || [];
        if (Array.isArray(types)) {
          setAclTypes(types);
          const service = types.find((t) => t.name === selectedPolicy.type);
          setSelectedService(service || null);
        }
      } catch (error) {
        console.error('Error fetching ACL types:', error);
        notify.error({
          message: 'Failed to fetch ACL types',
          description: error instanceof Error ? error.message : 'Unknown error occurred',
        });
      }
    };

    fetchACLTypes();
  }, [networkId, notify, selectedPolicy.protocol]);

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

    const fetchGroups = async () => {
      try {
        const response = await UsersService.getGroups();
        const filteredGroups = (response.data.Response || []).filter((group) => {
          if (!group.network_roles) {
            return false;
          }
          return (
            Object.keys(group.network_roles).includes(networkId) ||
            Object.keys(group.network_roles).includes('all_networks')
          );
        });
        setGroupsList(filteredGroups);
      } catch (error) {
        console.error('Error fetching groups:', error);
        setGroupsList([]);
      }
    };

    const fetchTags = async () => {
      try {
        const tags = (await TagsService.getTagsPerNetwork(networkId)).data.Response;
        setTagsList(tags);
      } catch (error) {
        console.error('Error fetching tags:', error);
        setTagsList([]);
      }
    };

    fetchUsers();
    isServerEE && fetchGroups();
    fetchTags();
  }, [networkId, isServerEE]);

  const convertSourceItemsToTypeValues = useCallback((items: Item[]): SourceTypeValue[] => {
    return items.map((item) => ({
      id: item.type === 'user' ? 'user' : 'user-group',
      value: item.id,
    }));
  }, []);

  const convertDestinationItemToTypeValue = useCallback((item: Item): DestinationTypeValue => {
    return {
      id: 'tag',
      value: item.id,
    };
  }, []);
  const handleServiceChange = (serviceName: string) => {
    const service = aclTypes.find((type) => type.name === serviceName);
    setSelectedService(service || null);

    if (service) {
      setProtocolType(service.allowed_protocols[0] as 'tcp' | 'udp' | 'icmp');
      setValue(
        'port',
        service.allow_port_setting
          ? '8000'
          : service.port_range === 'All ports'
            ? 'All ports'
            : service.port_range.toString(),
      );
    } else {
      setValue('port', '8000');
      setProtocolType('tcp');
    }
  };
  const handleDirectionChange = () => {
    const newDirection = direction === 0 ? 1 : 0;
    setDirection(newDirection);
    setShowUnidirectionalWarning(newDirection === 0);
  };

  const onSubmit = async (values: FormValues) => {
    try {
      if (!values.name || !values.source.length || !values.destination.length || !values.service) {
        notify.error({
          message: 'Validation Error',
          description: 'Please fill in all required fields',
        });
        return;
      }

      setIsSubmitting(true);
      setError(null);

      const updatedPolicy: ACLRule = {
        ...selectedPolicy,
        name: values.name,
        network_id: networkId,
        src_type: convertSourceItemsToTypeValues(values.source),
        dst_type: values.destination.map(convertDestinationItemToTypeValue),
        enabled: isPolicyEnabled,
        allowed_traffic_direction: direction,
        protocol: protocolType,
        type: values.service,
        ports: protocolType === 'icmp' ? [] : convertPortsToArray(values.port),
      };

      const response = await ACLService.updateACLRule(updatedPolicy, networkId);
      console.log(response);

      notify.success({ message: 'Policy updated successfully' });
      fetchACLRules?.();
      reloadACL();
      onClose?.();
    } catch (err) {
      notify.error({
        message: 'Failed to update policy',
        description: extractErrorMsg(err as any),
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="w-full">
      {error && <div className="p-3 mb-4 text-sm text-red-600 border border-red-200 rounded-md bg-red-50">{error}</div>}

      <form onSubmit={handleSubmit(onSubmit)} className="w-full">
        <div className="flex flex-col w-full gap-2 mb-4">
          <label htmlFor="name" className="block text-sm font-semibold text-text-primary">
            Rule name
          </label>
          <input
            {...register('name', { required: true })}
            type="text"
            id="name"
            placeholder="e.g. devops-team"
            className="w-full p-2 text-sm border rounded-lg bg-bg-default border-stroke-default"
          />
          {errors.name && <span className="text-sm text-red-500">Rule name is required</span>}
        </div>

        <div className="flex gap-4 mb-4">
          <div className="flex flex-col flex-1 gap-2">
            <label htmlFor="service" className="block text-sm font-semibold text-text-primary">
              Service
            </label>
            <Controller
              name="service"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <Select
                  {...field}
                  className="w-full"
                  placeholder="Select a service"
                  options={aclTypes.map((type) => ({ label: type.name, value: type.name }))}
                  onChange={(value) => {
                    field.onChange(value);
                    handleServiceChange(value);
                  }}
                />
              )}
            />
            {errors.service && <span className="text-sm text-red-500">Service is required</span>}
          </div>
          {selectedService?.allow_port_setting && (
            <div className="flex flex-col w-32 gap-2">
              <label htmlFor="type" className="block text-sm font-semibold text-text-primary">
                Type
              </label>
              <Select
                value={protocolType}
                onChange={setProtocolType}
                options={selectedService.allowed_protocols.map((protocol) => ({
                  label: protocol,
                  value: protocol,
                }))}
              />
            </div>
          )}
          {!selectedService?.allowed_protocols.includes('icmp') && (
            <div className="flex flex-col w-32 gap-2">
              <label htmlFor="port" className="block text-sm font-semibold text-text-primary">
                Port
              </label>
              <div className="flex items-center gap-2">
                <Controller
                  name="port"
                  control={control}
                  rules={{
                    required: true,
                    validate: validatePortFormat,
                  }}
                  render={({ field: { onChange, value } }) => (
                    <Input
                      onChange={(e) => onChange(e.target.value)}
                      value={value}
                      disabled={!selectedService?.allow_port_setting}
                      placeholder="80,443,8000-9000"
                      className="w-full"
                    />
                  )}
                />
                {selectedService?.allow_port_setting && (
                  <Tooltip title="Use single ports, ranges (e.g., 8000-9000), or comma-separated ports (80,443) or both.">
                    <InformationCircleIcon className="w-4 h-4 text-text-secondary cursor-help shrink-0" />
                  </Tooltip>
                )}
              </div>
              {errors.port && (
                <span className="text-sm text-red-500">
                  Invalid port format. Use single ports, ranges (e.g., 8000-9000), or comma-separated ports (80,443) or
                  both.
                </span>
              )}
            </div>
          )}{' '}
        </div>

        <div className="flex w-full gap-7">
          <div className="w-full">
            <div className="flex flex-col w-full gap-2">
              <label className="block text-sm font-semibold text-text-primary">Source</label>
              <Controller
                name="source"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <SelectDropdown
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Select source"
                    showManageButton={true}
                    users={usersList}
                    groups={groupsList}
                  />
                )}
              />
              {errors.source && <span className="text-sm text-red-500">Source is required</span>}
            </div>
          </div>

          <div className="flex flex-col items-center justify-center w-2/3 gap-2">
            <img src={arrowRight} className="w-full" alt="Right arrow" />
            {/* <img
              onClick={handleDirectionChange}
              src={arrowLeft}
              className={`w-full cursor-pointer ${direction === 0 ? 'opacity-30' : ''}`}
              alt="Left arrow"
            /> */}
          </div>

          <div className="w-full">
            <div className="flex flex-col w-full gap-2">
              <label className="block text-sm font-semibold text-text-primary">Destination</label>
              <Controller
                name="destination"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <TagSelectDropdown
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Select destination tag"
                    tags={tagsList}
                  />
                )}
              />
              {errors.destination && <span className="text-sm text-red-500">Destination is required</span>}
            </div>
          </div>
        </div>

        {/* {showUnidirectionalWarning && (
          <Alert
            message="Unidirectional Mode"
            description="Only Linux machines are supported in unidirectional mode."
            type="warning"
            showIcon
            closable
            className="[&_.ant-alert-message]:!text-sm-semibold [&_.ant-alert-description]:!text-xs [&_.anticon]:!size-5 p-4"
            onClose={() => setShowUnidirectionalWarning(false)}
          />
        )} */}

        <div className="flex w-full gap-2 p-4 mt-4 border rounded-md border-stroke-default">
          <div className="flex flex-col w-full gap-1">
            <h3 className="text-base font-semibold text-text-primary">Enable Policy</h3>
            <p className="text-text-secondary">Use to enable or disable policy.</p>
          </div>
          <Switch checked={isPolicyEnabled} onChange={setIsPolicyEnabled} />
        </div>

        <div className="flex justify-end w-full gap-4 pt-4">
          <Button type="primary" loading={isSubmitting} onClick={handleSubmit(onSubmit)}>
            Update Policy
          </Button>
        </div>
      </form>
    </div>
  );
};

export default UpdateUsersForm;
