import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { notification, Switch, Button } from 'antd';
import { useForm, Controller } from 'react-hook-form';
import {
  UsersIcon,
  WrenchIcon,
  XMarkIcon,
  UserIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  TagIcon,
} from '@heroicons/react/24/solid';
import { UsersService } from '@/services/UsersService';
import { ACLService } from '@/services/ACLService';
import { TagsService } from '@/services/TagsService';
import { User, UserGroup } from '@/models/User';
import { Tag } from '@/models/Tags';
import { CreateACLRuleDto, SourceTypeValue, DestinationTypeValue } from '@/services/dtos/ACLDtos';
import { Network } from '@/models/Network';
import { extractErrorMsg } from '@/utils/ServiceUtils';
import { NotificationInstance } from 'antd/es/notification/interface';
import { Link } from 'react-router-dom';
import { useServerLicense } from '@/utils/Utils';

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

interface UsersFormProps {
  networkId: Network['netid'];
  onClose?: () => void;
  fetchACLRules?: () => void;
  reloadACL: () => void;
  notify: NotificationInstance;
}

interface FormValues {
  name: string;
  source: Item[];
  destination: Item[];
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
      groups: groups.filter((group) => group.id.toLowerCase().includes(searchLower)),
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
                {item.type === 'group' ? <UsersIcon className="w-3 h-3" /> : <UserIcon className="w-3 h-3" />}
                {item.name}
                <XMarkIcon
                  className="w-4 h-4 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeItem(item);
                  }}
                />
              </span>
            ))}
          </div>
        )}
        <ChevronDownIcon className="absolute w-4 h-4 ml-auto top-2 right-2 text-text-secondary" />
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
                <MagnifyingGlassIcon className="absolute w-4 h-4 left-2 top-2 text-text-secondary" />
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
                        <UsersIcon className="w-4 h-4 text-text-secondary" />
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
                        <UserIcon className="w-4 h-4 text-text-secondary" />
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
                      <WrenchIcon className="w-4 h-4" />
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
    const tagItem: Item = {
      id: '*',
      name: 'All',
      type: 'tag',
    };
    onChange([tagItem]);
    setIsOpen(false);
  };

  const toggleTag = useCallback(
    (tag: Tag) => {
      const tagItem: Item = {
        id: tag.id,
        name: tag.tag_name,
        type: 'tag',
      };
      const isSelected = value.some((v) => v.id === tag.id);
      onChange(isSelected ? value.filter((v) => v.id !== tag.id) : [...value, tagItem]);
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
                <TagIcon className="w-3 h-3" />
                {item.name}
                <XMarkIcon
                  className="w-4 h-4 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeItem(item);
                  }}
                />
              </span>
            ))}
          </div>
        )}
        <ChevronDownIcon className="absolute w-4 h-4 ml-auto top-2 right-2 text-text-secondary" />
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
                <MagnifyingGlassIcon className="absolute w-4 h-4 left-2 top-2 text-text-secondary" />
              </div>
            </div>

            <div className="w-full py-1">
              <div
                className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-button-secondary-fill-hover"
                onClick={selectAllTag}
              >
                <TagIcon className="w-4 h-4 text-text-secondary" />
                All
                {value.some((v) => v.id === '*') && <div className="w-4 h-4 ml-auto">✓</div>}
              </div>

              {filteredTags.map((tag) => (
                <div
                  key={tag.id}
                  className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-button-secondary-fill-hover"
                  onClick={() => toggleTag(tag)}
                >
                  <TagIcon className="w-4 h-4 text-text-secondary" />
                  {tag.tag_name}
                  {value.some((v) => v.id === tag.id) && <div className="w-4 h-4 ml-auto">✓</div>}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const UsersForm: React.FC<UsersFormProps> = ({ networkId, onClose, fetchACLRules, reloadACL, notify }) => {
  const [isPolicyEnabled, setIsPolicyEnabled] = useState(true);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [groupsList, setGroupsList] = useState<UserGroup[]>([]);
  const [tagsList, setTagsList] = useState<Tag[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const { isServerEE } = useServerLicense();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm<FormValues>({
    defaultValues: {
      name: '',
      source: [],
      destination: [],
    },
  });

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

  const onSubmit = async (values: FormValues) => {
    if (!values.name || !values.source.length || !values.destination.length) {
      notify.error({
        message: 'Validation Error',
        description: 'Please fill in all required fields',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      setIsSuccess(false);

      const payload: CreateACLRuleDto = {
        name: values.name,
        network_id: networkId,
        policy_type: 'user-policy',
        src_type: convertSourceItemsToTypeValues(values.source),
        dst_type: values.destination.map(convertDestinationItemToTypeValue),
        allowed_traffic_direction: 1,
        enabled: isPolicyEnabled,
      };

      await ACLService.createACLRule(payload, networkId);
      notify.success({ message: `User policy created` });
      reset();
      setIsPolicyEnabled(true);
      fetchACLRules?.();
      reloadACL();
      onClose?.();
    } catch (err) {
      notify.error({
        message: 'Failed to create client',
        description: extractErrorMsg(err as any),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      {error && <div className="p-3 mb-4 text-sm text-red-600 border border-red-200 rounded-md bg-red-50">{error}</div>}
      {isSuccess && (
        <div className="p-3 mb-4 text-sm text-green-600 border border-green-200 rounded-md bg-green-50">
          Policy created successfully
        </div>
      )}

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
            <img
              src="/arrow-bidirectional.svg"
              className="w-full px-4 py-2 text-sm border rounded-lg bg-bg-default border-stroke-default"
              alt="Bidirectional arrow"
            />
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

        <div className="flex w-full gap-2 p-4 mt-4 border rounded-md border-stroke-default">
          <div className="flex flex-col w-full gap-1">
            <h3 className="text-base font-semibold text-text-primary">Enable Policy</h3>
            <p className="text-text-secondary">Use to enable or disable policy.</p>
          </div>
          <Switch checked={isPolicyEnabled} onChange={setIsPolicyEnabled} />
        </div>

        <div className="flex justify-end w-full gap-4 pt-4">
          <Button type="primary" loading={isSubmitting} onClick={handleSubmit(onSubmit)}>
            Save Policy
          </Button>
        </div>
      </form>
    </div>
  );
};

export default UsersForm;
