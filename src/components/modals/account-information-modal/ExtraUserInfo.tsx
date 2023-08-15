import { useState, useEffect } from 'react';
import { Col, Form, FormInstance, Input, Row, Select, Tooltip, Typography } from 'antd';
import {
  validateEmailField,
  validateFirstNameField,
  validateLastNameField,
  validatePlainTextFieldWithNumbersButNotRequired,
} from '../../../utils/Utils';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { ExtraUserInfoForm } from '@/services/dtos/UserDtos';

interface ExtraUserInfoProps {
  updateUserInfo: () => void;
  extraUserInfoForm: FormInstance<ExtraUserInfoForm>;
  isUpdatingUserInformation: boolean;
  displayButton?: boolean;
}

export default function ExtraUserInfo({ updateUserInfo, extraUserInfoForm }: ExtraUserInfoProps) {
  const [isCompanyPopulated, setIsCompanyPopulated] = useState(false);
  const [useCases] = useState<string[]>(['Remote Access', 'Site-to-site', 'Overlay Network', 'Other']);
  const [primaryInfraOptions] = useState<string[]>(['IoT-Edge', 'Cloud-Data-Center', 'Office-General-IT', 'Other']);
  const ranges = ['1-9', '10-49', '50-249', '250+'];
  const roles = [
    'Engineering',
    'IT Specialist',
    'Executive',
    'Product Management',
    'Security',
    'QA',
    'Sales',
    'Finance',
    'HR',
    'Other',
  ];
  const handleFormValuesChange = (changedValues: any, allValues: any) => {
    setIsCompanyPopulated(!!allValues.company_name);
  };

  useEffect(() => {
    if (isCompanyPopulated) {
      const timeoutId = setTimeout(() => {
        const companySizeInput = document.getElementById('company_size') as HTMLInputElement;
        const roleInCompanyInput = document.getElementById('role_in_company') as HTMLInputElement;
        companySizeInput.classList.add('visible');
        roleInCompanyInput.classList.add('visible');
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [isCompanyPopulated]);

  return (
    <Form
      form={extraUserInfoForm}
      layout="vertical"
      onFinish={updateUserInfo}
      style={{ marginTop: '20px' }}
      onValuesChange={handleFormValuesChange}
    >
      <Typography.Text
        style={{
          fontSize: '12px',
          display: 'block',
          margin: '10px 0px',
        }}
      >
        Please complete this optional survey to help us improve the Netmaker experience for everyone.
      </Typography.Text>
      <Form.Item
        name="primary_use_case"
        label="What is your primary use case? [remote access, site-to-site, overlay network, other]"
      >
        <Select
          placeholder="Select a primary use case"
          size="large"
          options={useCases.map((item) => ({ label: item, value: item }))}
        />
      </Form.Item>
      <Form.Item
        name="infrastructure_group"
        label="What is the primary infrastructure you are managing? [IoT, Cloud / Data Center, General IT / Office]"
      >
        <Select
          placeholder="Select a primary infrastructure"
          size="large"
          options={primaryInfraOptions.map((item) => ({
            label: item,
            value: item,
          }))}
        />
      </Form.Item>
      <Row gutter={20}>
        <Col span={11}>
          <Form.Item
            name="machine_estimate"
            label={
              <Tooltip title="How many machines do you plan to add to your network(s)?">
                Estimated number of machines <QuestionCircleOutlined style={{ marginLeft: '5px' }} />
              </Tooltip>
            }
          >
            <Select
              placeholder="Select a range"
              size="large"
              options={ranges.map((item) => ({ label: item, value: item }))}
            />
          </Form.Item>
        </Col>
      </Row>
      <Typography.Text
        style={{
          fontSize: '12px',
          display: 'block',
          margin: '10px 0px',
        }}
      >
        Contact Information
      </Typography.Text>
      <Row>
        <Col span={24}>
          <Form.Item name="email" label="Email" rules={validateEmailField}>
            <Input size="large" placeholder="Email" />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={20}>
        <Col span={12}>
          <Form.Item name="first_name" label="First Name" rules={validateFirstNameField}>
            <Input size="large" placeholder="First name" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="last_name" label="Last Name" rules={validateLastNameField}>
            <Input size="large" placeholder="Last name" />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={20}>
        <Col span={24}>
          <Form.Item name="company_name" label="Company" rules={validatePlainTextFieldWithNumbersButNotRequired}>
            <Input size="large" placeholder="Company" />
          </Form.Item>
        </Col>
      </Row>
      {isCompanyPopulated && (
        <>
          <Typography.Text
            style={{
              fontSize: '12px',
              display: 'block',
              margin: '10px 0px',
            }}
          >
            Company Information
          </Typography.Text>
          <Row gutter={20}>
            <>
              <Col span={9}>
                <Form.Item name="primary_role" label="Role at company">
                  <Select
                    placeholder="Select a range"
                    size="large"
                    options={roles.map((item) => ({
                      label: item,
                      value: item,
                    }))}
                  />
                </Form.Item>
              </Col>
              <Col span={9}>
                <Form.Item name="company_size_reported" label="Company Size">
                  <Select
                    placeholder="Select a range"
                    size="large"
                    options={ranges.map((item) => ({
                      label: item,
                      value: item,
                    }))}
                  />
                </Form.Item>
              </Col>
            </>
          </Row>
        </>
      )}
    </Form>
  );
}
