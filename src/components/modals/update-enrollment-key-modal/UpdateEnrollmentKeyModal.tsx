import { ExternalLinks } from '@/constants/LinkAndImageConstants';
import { NULL_NODE_ID } from '@/constants/Types';
import { EnrollmentKey } from '@/models/EnrollmentKey';
import { ExtendedNode } from '@/models/Node';
import { Tag } from '@/models/Tags';
import { EnrollmentKeysService } from '@/services/EnrollmentKeysService';
import { TagsService } from '@/services/TagsService';
import { CreateEnrollmentKeyReqDto } from '@/services/dtos/CreateEnrollmentKeyReqDto';
import { useStore } from '@/store/store';
import { Modify } from '@/types/react-app-env';
import { getExtendedNode, isNodeRelay } from '@/utils/NodeUtils';
import { extractErrorMsg } from '@/utils/ServiceUtils';
import { useServerLicense } from '@/utils/Utils';
import { Button, Col, Divider, Form, Input, Modal, Row, Select, Typography, notification } from 'antd';
import { Dayjs } from 'dayjs';
import { MouseEvent, useCallback, useEffect, useMemo, useState } from 'react';

interface UpdateEnrollmentKeyModalProps {
  isOpen: boolean;
  enrollmentKey: EnrollmentKey;
  onUpdateKey: (key: EnrollmentKey) => any;
  onCancel?: (e: MouseEvent<HTMLButtonElement>) => void;
}

type UpdateEnrollmentKeyFormData = Modify<CreateEnrollmentKeyReqDto, { expiration: Dayjs }>;

export default function UpdateEnrollmentKeyModal({
  isOpen,
  enrollmentKey,
  onUpdateKey,
  onCancel,
}: UpdateEnrollmentKeyModalProps) {
  const [form] = Form.useForm<UpdateEnrollmentKeyFormData>();
  const store = useStore();
  const { isServerEE } = useServerLicense();
  const [tags, setTags] = useState<Tag[]>([]);

  const resetModal = () => {
    form.resetFields();
    setTags([]);
  };

  const relays = useMemo<ExtendedNode[]>(() => {
    const relayNodes = store.nodes
      .filter((node) => isNodeRelay(node) && enrollmentKey.networks.includes(node.network))
      .map((node) => getExtendedNode(node, store.hostsCommonDetails));
    if (!isServerEE) {
      return [];
    }
    return relayNodes;
  }, [isServerEE, store.hostsCommonDetails, store.nodes, enrollmentKey]);

  const filteredTags = useMemo<Tag[]>(() => {
    const _tags = tags.filter((t) => enrollmentKey.networks?.includes(t.network));
    if (!isServerEE) {
      return [];
    }
    return _tags;
  }, [enrollmentKey.networks, isServerEE, tags]);

  const loadTags = useCallback(async () => {
    try {
      const availableTags: Tag[] = [];
      const res = await Promise.allSettled(enrollmentKey.networks?.map((n) => TagsService.getTagsPerNetwork(n)) ?? []);
      res.forEach((r) => {
        if (r.status === 'fulfilled') {
          availableTags.push(...r.value.data.Response);
        }
      });
      setTags(availableTags);
    } catch (err) {
      notification.error({
        message: 'Failed to load tags',
        description: extractErrorMsg(err as any),
      });
    }
  }, [enrollmentKey.networks]);

  const updateEnrollmentKey = async () => {
    try {
      const values = await form.validateFields();
      const payload: CreateEnrollmentKeyReqDto = {
        ...values,
        expiration: values.expiration?.unix(),
        tags: values.tags.map((tag) => tag.trim()),
      };
      const updatedKey = (await EnrollmentKeysService.updateEnrollmentKey(enrollmentKey.value, payload)).data;
      notification.success({
        message: `Enrollment key with name ${updatedKey.tags.join(', ')} updated successfully`,
      });
      onUpdateKey(updatedKey);
      resetModal();
    } catch (err) {
      notification.error({
        message: `Failed to update key`,
        description: extractErrorMsg(err as any),
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadTags();
    }
  }, [isOpen, loadTags]);

  return (
    <Modal
      title={<span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Update Key</span>}
      open={isOpen}
      onCancel={(ev) => {
        resetModal();
        onCancel && onCancel(ev);
      }}
      footer={null}
      centered
      className="CustomModal"
    >
      <Divider style={{ margin: '0px 0px 2rem 0px' }} />
      <div className="CustomModalBody">
        <Form name="add-enrollment-key-form" form={form} layout="vertical" initialValues={enrollmentKey}>
          <Form.Item
            label="Name"
            name="tags"
            rules={[{ required: true }]}
            data-nmui-intercom="update-enrollment-key-form_tags"
          >
            {/* <Select mode="tags" style={{ width: '100%' }} placeholder="Tags" /> */}
            <Input placeholder="Name" disabled />
          </Form.Item>

          {isServerEE && (
            <Form.Item name="relay" label="Relay" data-nmui-intercom="update-enrollment-key-form_relays">
              <Select
                placeholder="Select relay to join with key"
                allowClear
                style={{ width: '100%' }}
                options={[
                  { label: 'Select relay to join with key', value: NULL_NODE_ID, disabled: true },
                  ...relays.map((node) => {
                    const network = store.networks.find((n) => n.netid === node.network);
                    return {
                      label: `${node.name} (${network?.name || node.network})`,
                      value: node.id,
                    };
                  }),
                ]}
              />
            </Form.Item>
          )}

          {isServerEE && (
            <Row>
              <Col xs={24}>
                <Form.Item
                  name="groups"
                  label="Tags"
                  data-nmui-intercom="add-enrollment-key-form_tags"
                  tooltip={
                    <Typography.Text>
                      Tags help to group hosts.{' '}
                      <a target="_blank" href={ExternalLinks.TAGS_DOCS_URL} rel="noreferrer">
                        Learn more
                      </a>
                    </Typography.Text>
                  }
                  extra={
                    <Typography.Text disabled>
                      Hosts that join with this key will automatically be given these tags
                    </Typography.Text>
                  }
                >
                  <Select
                    placeholder="Select tags to assign to hosts"
                    allowClear
                    mode="multiple"
                    style={{ width: '100%' }}
                    options={filteredTags.map((tag) => {
                      const network = store.networks.find((n) => n.netid === tag.network);
                      return {
                        label: `${tag.tag_name} (${network?.name || tag.network})`,
                        value: tag.id,
                      };
                    })}
                    disabled={enrollmentKey.networks?.length === 0}
                  />
                </Form.Item>
              </Col>
            </Row>
          )}

          <Row>
            <Col xs={24} style={{ textAlign: 'right' }}>
              <Form.Item data-nmui-intercom="update-enrollment-key-form_submit">
                <Button type="primary" onClick={updateEnrollmentKey}>
                  Update Key
                </Button>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </div>
    </Modal>
  );
}
