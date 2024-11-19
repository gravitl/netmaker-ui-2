import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { notification, Switch, Button } from 'antd';
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
import { SourceTypeValue, DestinationTypeValue, ACLRule } from '@/services/dtos/ACLDtos';
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

interface UpdateResourcesFormProps {
  networkId: Network['netid'];
  onClose?: () => void;
  selectedPolicy: ACLRule;
  reloadACL: () => void;
  fetchACLRules: () => void;
  notify: NotificationInstance;
}

interface FormValues {
  name: string;
  source: Item[];
  destination: Item[];
}

const cleanTagName = (tagName: string) => {
  const lastDotIndex = tagName.lastIndexOf('.');
  return lastDotIndex !== -1 ? tagName.substring(lastDotIndex + 1) : tagName;
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
        name: cleanTagName(tag.tag_name),
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
    return tags.filter((tag) => cleanTagName(tag.tag_name).toLowerCase().includes(searchLower));
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
        <ChevronDownIcon className="absolute w-4 h-4 ml-auto shrink-0 top-2 right-2 text-text-secondary" />
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
                <TagIcon className="w-4 h-4 text-text-secondary shrink-0" aria-hidden="true" />
                <span className="flex-1">All Resources</span>
                {value.some((v) => v.id === '*') && <div className="w-4 h-4 ml-auto text-primary-500">✓</div>}
              </div>

              {filteredTags.length === 0 && searchText && (
                <div className="px-3 py-2 text-sm text-text-secondary">No tags found</div>
              )}

              {filteredTags.map((tag) => {
                const isSelected = value.some((v) => v.id === tag.id);
                const isDisabled = value.some((v) => v.id === '*');
                const displayName = cleanTagName(tag.tag_name);

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
                    <span className="flex-1">{displayName}</span>
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

const UpdateResourcesForm: React.FC<UpdateResourcesFormProps> = ({
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
  const [tagsList, setTagsList] = useState<Tag[]>([]);

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
    },
  });

  const convertTypeToItems = useCallback(
    (typeValues: (SourceTypeValue | DestinationTypeValue)[]): Item[] => {
      return typeValues.map((type) => {
        if (type.value === '*') {
          return {
            id: type.value,
            name: 'All Resources',
            type: 'tag',
          };
        }

        const matchingTag = tagsList.find((tag) => tag.id === type.value || tag.tag_name === type.value);

        return {
          id: type.value,
          name: matchingTag ? cleanTagName(matchingTag.tag_name) : cleanTagName(type.value),
          type: 'tag',
        };
      });
    },
    [tagsList],
  );

  useEffect(() => {
    setValue('name', selectedPolicy.name);
    setValue('source', convertTypeToItems(selectedPolicy.src_type));
    setValue('destination', convertTypeToItems(selectedPolicy.dst_type));
  }, [selectedPolicy, setValue, convertTypeToItems]);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const tags = (await TagsService.getTagsPerNetwork(networkId)).data.Response;
        setTagsList(tags);
      } catch (error) {
        console.error('Error fetching tags:', error);
        setTagsList([]);
      }
    };

    fetchTags();
  }, [networkId]);

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
      if (!values.name || !values.source.length || !values.destination.length) {
        notify.error({
          message: 'Validation Error',
          description: 'Please fill in all required fields',
        });
        return;
      }

      setIsSubmitting(true);
      setError(null);

      const srcType =
        values.source[0].id === '*'
          ? [{ id: 'tag' as const, value: '*' }]
          : values.source.map(convertSourceItemToTypeValue);

      const dstType =
        values.destination[0].id === '*'
          ? [{ id: 'tag' as const, value: '*' }]
          : values.destination.map(convertDestinationItemToTypeValue);

      const updatedPolicy: ACLRule = {
        ...selectedPolicy,
        name: values.name,
        network_id: networkId,
        src_type: srcType,
        dst_type: dstType,
        enabled: isPolicyEnabled,
      };

      await ACLService.updateACLRule(updatedPolicy, networkId);
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
            Update Policy
          </Button>
        </div>
      </form>
    </div>
  );
};

export default UpdateResourcesForm;
