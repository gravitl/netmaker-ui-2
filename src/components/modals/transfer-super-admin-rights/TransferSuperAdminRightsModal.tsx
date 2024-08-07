import { useCallback, useEffect, useState } from 'react';
import { Button, Col, Divider, Modal, notification, Row, Select, Typography } from 'antd';
import { User } from '@/models/User';
import { extractErrorMsg } from '@/utils/ServiceUtils';
import { UsersService } from '@/services/UsersService';
import { isAdminUserOrRole } from '@/utils/UserMgmtUtils';

interface TransferSuperAdminRightsModalProps {
  isOpen: boolean;
  onCancel?: () => void;
  onTransferSuccessful?: () => void;
}

export default function TransferSuperAdminRightsModal({
  isOpen,
  onCancel,
  onTransferSuccessful,
}: TransferSuperAdminRightsModalProps) {
  const [notify, notifyCtx] = notification.useNotification();
  const [isTransferLoading, setIsTransferLoading] = useState(false);
  const [admins, setAdmins] = useState<User[]>([]);
  const [selectedAdmin, setSelectedAdmin] = useState<User | null>(null);

  const loadUsers = useCallback(async () => {
    try {
      const users = (await UsersService.getUsers()).data;
      setAdmins(users.filter((user) => isAdminUserOrRole(user) && user.platform_role_id !== 'super-admin'));
    } catch (err) {
      notify.error({
        message: 'Failed to load users',
        description: extractErrorMsg(err as any),
      });
    }
  }, [notify]);

  const handleChange = (value: string) => {
    setSelectedAdmin(admins.find((admin) => admin.username === value) || null);
  };

  const handleTransfer = useCallback(async () => {
    if (!selectedAdmin) {
      notification.info({
        message: 'Please select an admin',
      });
      return;
    }
    try {
      setIsTransferLoading(true);
      await UsersService.transferSuperAdminRights(selectedAdmin.username);
      onTransferSuccessful?.();
      notify.success({
        message: 'Super admin rights transferred',
      });
      onCancel?.();
    } catch (err) {
      notify.error({
        message: 'Failed to transfer super admin rights',
        description: extractErrorMsg(err as any),
      });
    } finally {
      setIsTransferLoading(false);
    }
  }, [notify, selectedAdmin, onCancel, onTransferSuccessful]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers, isOpen]);

  return (
    <Modal
      title={<span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Transfer Super Admin Rights</span>}
      open={isOpen}
      onCancel={() => {
        onCancel?.();
      }}
      footer={null}
      className="CustomModal"
      style={{ minWidth: '50vw', minHeight: '20vh' }}
    >
      <Row className="" style={{ padding: '20px 24px' }}>
        <Col xs={24}>
          <Typography.Paragraph style={{ marginBottom: '7px' }}>
            Select an admin to transfer rights to
          </Typography.Paragraph>
          <Select
            style={{ width: '100%' }}
            placeholder="Select an admin"
            onChange={handleChange}
            options={admins.map((admin) => ({ value: admin.username, label: admin.username }))}
          />
        </Col>
      </Row>
      <Divider style={{ margin: '0px 0px 2rem 0px' }} />
      <div className="CustomModalBody">
        <Row>
          <Col xs={24} style={{ textAlign: 'right' }}>
            <Button size="middle" onClick={handleTransfer} danger loading={isTransferLoading}>
              Transfer
            </Button>
          </Col>
        </Row>
      </div>
      {notifyCtx}
    </Modal>
  );
}
