import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Form, Switch, Button, notification } from 'antd';
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

const ResourcesForm: React.FC<ResourcesFormProps> = ({ networkId, onClose, fetchACLRules }) => {
  const [form] = Form.useForm();
  const [isPolicyEnabled, setIsPolicyEnabled] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [notify, notifyCtx] = notification.useNotification();
  const [tagsList, setTagsList] = useState<Tag[]>([]);

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

  const convertItemToTypeValue = useCallback((item: Item): SourceTypeValue | DestinationTypeValue => {
    return {
      id: 'tag',
      value: item.id,
    };
  }, []);

  const handleSubmit = async (values: any) => {
    try {
      if (!networkId) {
        setError('Network ID is required');
        return;
      }

      setIsSubmitting(true);
      setError(null);
      setIsSuccess(false);

      const payload: CreateACLRuleDto = {
        name: values.name,
        network_id: networkId,
        policy_type: 'device-policy',
        src_type: (values.source || []).map((item: Item) => convertItemToTypeValue(item)),
        dst_type: (values.destination || []).map((item: Item) => convertItemToTypeValue(item)),
        allowed_traffic_direction: 1,
        enabled: isPolicyEnabled,
      };

      await ACLService.createACLRule(payload, networkId);
      notify.success({ message: `Policy created` });
      form.resetFields();
      setIsPolicyEnabled(true);
      fetchACLRules?.();
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
      <Form form={form} className="w-full" onFinish={handleSubmit}>
        <Form.Item name="name" rules={[{ required: true, message: 'Please enter a rule name' }]}>
          <div className="flex flex-col w-full gap-2">
            <label htmlFor="rule-name" className="block text-sm font-semibold text-text-primary">
              Rule name
            </label>
            <input
              type="text"
              id="rule-name"
              placeholder="e.g. api-gateway-access"
              className="w-full p-2 text-sm border rounded-lg bg-bg-default border-stroke-default"
            />
          </div>
        </Form.Item>

        <div className="flex w-full gap-7">
          <Form.Item name="source" className="w-full" rules={[{ required: true, message: 'Please select source' }]}>
            <div className="flex flex-col w-full gap-2">
              <label className="block text-sm font-semibold text-text-primary">Source</label>
              <TagSelectDropdown
                value={form.getFieldValue('source') || []}
                onChange={(value) => form.setFieldsValue({ source: value })}
                placeholder="Select source"
                tags={tagsList}
              />
            </div>
          </Form.Item>

          <div className="flex flex-col items-center justify-center w-2/3 gap-2">
            <img
              src="/arrow-bidirectional.svg"
              className="w-full px-4 py-2 text-sm border rounded-lg bg-bg-default border-stroke-default"
              alt="Bidirectional arrow"
            />
          </div>

          <Form.Item
            name="destination"
            className="w-full"
            rules={[{ required: true, message: 'Please select destination' }]}
          >
            <div className="flex flex-col w-full gap-2">
              <label className="block text-sm font-semibold text-text-primary">Destination</label>
              <TagSelectDropdown
                value={form.getFieldValue('destination') || []}
                onChange={(value) => form.setFieldsValue({ destination: value })}
                placeholder="Select destination"
                tags={tagsList}
              />
            </div>
          </Form.Item>
        </div>

        <Form.Item>
          <div className="flex w-full gap-2 p-4 mt-2 border rounded-md border-stroke-default">
            <div className="flex flex-col w-full gap-1">
              <h3 className="text-base font-semibold text-text-primary">Enable Policy</h3>
              <p className="text-text-secondary">Use to enable or disable policy.</p>
            </div>
            <Switch checked={isPolicyEnabled} onChange={setIsPolicyEnabled} />
          </div>
        </Form.Item>

        <div className="flex justify-end w-full gap-4 pt-4">
          <Button type="primary" htmlType="submit" loading={isSubmitting} className="px-4">
            Save Policy
          </Button>
        </div>
      </Form>
      {notifyCtx}
    </div>
  );
};

export default ResourcesForm;
