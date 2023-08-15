import { Row, Col, Form, Modal, Button } from 'antd';
import { useState } from 'react';
import ExtraUserInfo from './ExtraUserInfo';
import { ExtraUserInfoForm } from '@/services/dtos/UserDtos';
import { extractErrorMsg } from '@/utils/ServiceUtils';
import { NotificationInstance } from 'antd/es/notification/interface';

interface AccountInformationModalProps {
  isModalOpen: boolean;
  setIsModalOpen: (isOpen: boolean) => void;
  notify: NotificationInstance;
}

export default function AccountInformationModal({ isModalOpen, setIsModalOpen, notify }: AccountInformationModalProps) {
  const [form] = Form.useForm<ExtraUserInfoForm>();
  const [isUploadingUserInfo, setIsUploadingUserInfo] = useState(false);

  const handleUploadUserInfo = async () => {
    try {
      await form.validateFields();
      setIsUploadingUserInfo(true);
      // await UsersService.uploadUserInformation(formInfo);
      setIsUploadingUserInfo(false);
      setIsModalOpen(false);
    } catch (error: any) {
      setIsUploadingUserInfo(false);
      notify.error({
        message: 'Failed to upload user information',
        description: extractErrorMsg(error),
      });
    }
  };

  return (
    <Modal
      title="Help us make Netmaker Better!"
      open={isModalOpen}
      width={1070}
      onCancel={() => setIsModalOpen(false)}
      footer={
        <Button onClick={handleUploadUserInfo} loading={isUploadingUserInfo} type="primary">
          Submit
        </Button>
      }
    >
      <Row>
        <Col span={24}>
          <ExtraUserInfo
            updateUserInfo={handleUploadUserInfo}
            extraUserInfoForm={form}
            isUpdatingUserInformation={isUploadingUserInfo}
            displayButton={true}
          />
        </Col>
      </Row>
    </Modal>
  );
}
