import React, { useState, useEffect, useRef } from 'react';
import {
  Button,
  Col,
  Divider,
  Form,
  FormInstance,
  Input,
  InputNumber,
  InputRef,
  Row,
  Select,
  Space,
  Steps,
  Tooltip,
  Typography,
  notification,
} from 'antd';
import {
  validateEmailField,
  validateFirstNameField,
  validateLastNameField,
  validatePlainTextFieldWithNumbersButNotRequired,
} from '../../../utils/Utils';
import { PlusOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { ExtraUserInfoForm } from '@/services/dtos/UserDtos';

interface ExtraUserInfoProps {
  updateUserInfo: () => void;
  extraUserInfoForm: FormInstance<ExtraUserInfoForm>;
  isUpdatingUserInformation: boolean;
  displayButton?: boolean;
}

type selectType = 'useCase' | 'primaryInfraOption';

export default function ExtraUserInfo({
  updateUserInfo,
  extraUserInfoForm,
  isUpdatingUserInformation,
  displayButton,
}: ExtraUserInfoProps) {
  const [isCompanyPopulated, setIsCompanyPopulated] = useState(false);
  const [useCases, setUseCases] = useState<string[]>(['Remote Access', 'Site-to-site', 'Overlay Network', 'Other']);
  const [primaryInfraOptions, setPrimaryInfraOptions] = useState<string[]>([
    'IoT-Edge',
    'Cloud-Data-Center',
    'Office-General-IT',
    'Other',
  ]);
  const [ranges, setRanges] = useState<string[]>(['1-9', '10-49', '50-249', '250+']);
  const [roles, setRoles] = useState<string[]>([
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
  ]);
  const [newUseCase, setNewUseCase] = useState<string>('');
  const [newPrimaryInfraOption, setNewPrimaryInfraOption] = useState<string>('');
  const useCaseInputRef = useRef<InputRef>(null);
  const primaryInfraOptionInputRef = useRef<InputRef>(null);

  const handleFormValuesChange = (changedValues: any, allValues: any) => {
    setIsCompanyPopulated(!!allValues.company_name);
  };

  const onInputChange = (event: React.ChangeEvent<HTMLInputElement>, inputType: selectType) => {
    const { value } = event.target;
    if (inputType === 'useCase') {
      setNewUseCase(value);
    } else {
      setNewPrimaryInfraOption(value);
    }
  };

  const addItem = (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>, inputType: selectType) => {
    e.preventDefault();
    let inputRef: React.RefObject<InputRef>;
    if (inputType === 'useCase') {
      setUseCases([...useCases, newUseCase]);
      setNewUseCase('');
      inputRef = useCaseInputRef;
    } else {
      setPrimaryInfraOptions([...primaryInfraOptions, newPrimaryInfraOption]);
      setNewPrimaryInfraOption('');
      inputRef = primaryInfraOptionInputRef;
    }

    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
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
          // dropdownRender={(menu) => (
          //   <>
          //     {menu}
          //     <Divider style={{ margin: "8px 0" }} />
          //     <Space style={{ padding: "0 8px 4px" }}>
          //       <Input
          //         placeholder="Please enter item"
          //         ref={useCaseInputRef}
          //         value={newUseCase}
          //         onChange={(e) => onInputChange(e, "useCase")}
          //       />
          //       <Button
          //         type="text"
          //         icon={<PlusOutlined />}
          //         onClick={(e) => addItem(e, "useCase")}
          //       >
          //         Add item
          //       </Button>
          //     </Space>
          //   </>
          // )}
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
          // dropdownRender={(menu) => (
          //   <>
          //     {menu}
          //     <Divider style={{ margin: "8px 0" }} />
          //     <Space style={{ padding: "0 8px 4px" }}>
          //       <Input
          //         placeholder="Please enter item"
          //         ref={primaryInfraOptionInputRef}
          //         value={newPrimaryInfraOption}
          //         onChange={(e) => onInputChange(e, "primaryInfraOption")}
          //       />
          //       <Button
          //         type="text"
          //         icon={<PlusOutlined />}
          //         onClick={(e) => addItem(e, "primaryInfraOption")}
          //       >
          //         Add item
          //       </Button>
          //     </Space>
          //   </>
          // )}
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
