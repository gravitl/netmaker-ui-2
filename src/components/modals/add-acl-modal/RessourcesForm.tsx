import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Switch, Button, notification } from 'antd';
import { useForm, Controller } from 'react-hook-form';
import {
  ComputerDesktopIcon,
  WrenchIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  TagIcon,
} from '@heroicons/react/24/solid';
import { ACLService } from '@/services/ACLService';
import { TagsService } from '@/services/TagsService';
import { CreateACLRuleDto, SourceTypeValue, DestinationTypeValue } from '@/services/dtos/ACLDtos';
import { Network } from '@/models/Network';
import { extractErrorMsg } from '@/utils/ServiceUtils';
import { Tag } from '@/models/Tags';
import { NotificationInstance } from 'antd/es/notification/interface';

interface Item {
  id: string;
  name: string;
  type: 'resource' | 'tag';
}

interface TagSelectDropdownProps {
  value: Item[];
  onChange: (value: Item[]) => void;
  placeholder?: string;
  tags?: Tag[];
}

interface ResourcesFormProps {
  networkId: Network['netid'];
  onClose?: () => void;
  fetchACLRules?: () => void;
  reloadACL?: () => void;
  notify: NotificationInstance;
}

interface FormValues {
  name: string;
  source: Item[];
  destination: Item[];
}

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
                  className="w-4 h-4 cursor-pointer hover:text-text-primary shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeItem(item);
                  }}
                  role="button"
                  aria-label={`Remove ${item.name}`}
                />
              </span>
            ))}
          </div>
        )}
        <ChevronDownIcon className="absolute w-4 h-4 ml-auto top-2 right-2 shrink-0 text-text-secondary" />
      </div>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} aria-hidden="true" />
          <div
            className="absolute z-20 mt-1 overflow-hidden border rounded-lg shadow-lg w-96 bg-bg-default border-stroke-default"
            role="listbox"
          >
            <div className="p-2 border-b border-stroke-default">
              <div className="relative">
                <input
                  type="text"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Search tags..."
                  className="w-full pl-8 pr-2 py-1.5 text-sm border rounded-md bg-bg-default border-stroke-default focus:outline-none focus:ring-1 focus:ring-primary-500"
                  onClick={(e) => e.stopPropagation()}
                  autoComplete="off"
                />
                <MagnifyingGlassIcon
                  className="absolute w-4 h-4 shrink-0 left-2 top-2 text-text-secondary"
                  aria-hidden="true"
                />
              </div>
            </div>

            <div className="w-full overflow-y-auto max-h-[300px]" role="presentation">
              <div
                className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-button-secondary-fill-hover"
                onClick={selectAllTag}
                role="option"
                aria-selected={value.some((v) => v.id === '*')}
              >
                <TagIcon className="w-4 h-4 shrink-0 text-text-secondary" aria-hidden="true" />
                <span className="flex-1">All Resources</span>
                {value.some((v) => v.id === '*') && <div className="w-4 h-4 ml-auto text-primary-500">✓</div>}
              </div>

              {filteredTags.length === 0 && searchText && (
                <div className="px-3 py-2 text-sm text-text-secondary">No tags found</div>
              )}

              {filteredTags.map((tag) => {
                const isSelected = value.some((v) => v.id === tag.id);
                const isDisabled = value.some((v) => v.id === '*');

                return (
                  <div
                    key={tag.id}
                    className={`
                      flex items-center gap-2 px-3 py-2 text-sm
                      ${
                        isDisabled
                          ? 'opacity-50 cursor-not-allowed'
                          : 'cursor-pointer hover:bg-button-secondary-fill-hover'
                      }
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

const ResourcesForm: React.FC<ResourcesFormProps> = ({ networkId, onClose, fetchACLRules, reloadACL, notify }) => {
  const [isPolicyEnabled, setIsPolicyEnabled] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [tagsList, setTagsList] = useState<Tag[]>([]);

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

  const loadTags = useCallback(async () => {
    try {
      const tags = (await TagsService.getTagsPerNetwork(networkId)).data.Response;
      setTagsList(tags);
    } catch (err) {
      console.error(err);
    }
  }, [networkId]);

  useEffect(() => {
    loadTags();
  }, [loadTags]);

  const convertSourceItemToTypeValue = useCallback((item: Item): SourceTypeValue => {
    return {
      id: 'tag',
      value: item.id,
    };
  }, []);

  const convertDestinationItemToTypeValue = useCallback((item: Item): DestinationTypeValue => {
    return {
      id: 'tag',
      value: item.id,
    };
  }, []);

  const onSubmit = async (values: FormValues) => {
    try {
      if (!networkId) {
        setError('Network ID is required');
        return;
      }

      if (!values.name || !values.source.length || !values.destination.length) {
        notify.error({
          message: 'Validation Error',
          description: 'Please fill in all required fields',
        });
        return;
      }

      setIsSubmitting(true);
      setError(null);
      setIsSuccess(false);

      const srcType =
        values.source[0].id === '*'
          ? [{ id: 'tag' as const, value: '*' }]
          : values.source.map(convertSourceItemToTypeValue);

      const dstType =
        values.destination[0].id === '*'
          ? [{ id: 'tag' as const, value: '*' }]
          : values.destination.map(convertDestinationItemToTypeValue);

      const payload: CreateACLRuleDto = {
        name: values.name,
        network_id: networkId,
        policy_type: 'device-policy',
        src_type: srcType,
        dst_type: dstType,
        allowed_traffic_direction: 1,
        enabled: isPolicyEnabled,
      };

      await ACLService.createACLRule(payload, networkId);
      notify.success({ message: `Ressources policy created` });
      reset();
      setIsPolicyEnabled(true);
      fetchACLRules?.();
      reloadACL?.();
      onClose?.();
    } catch (err) {
      notify.error({
        message: 'Failed to create policy',
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
            placeholder="e.g. api-gateway-access"
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
                  <TagSelectDropdown
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Select source"
                    tags={tagsList}
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
                    placeholder="Select destination"
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

export default ResourcesForm;
