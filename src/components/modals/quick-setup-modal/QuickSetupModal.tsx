import { CloseOutlined, LockOutlined, PlusOutlined, SelectOutlined } from '@ant-design/icons';
import {
  Col,
  Row,
  Image,
  Typography,
  Button,
  Tooltip,
  Modal,
  Space,
  Radio,
  RadioChangeEvent,
  Select,
  Input,
  Form,
} from 'antd';
import EgressImg from '../../../assets/egress.webp';
import RagImg from '../../../assets/rag.webp';
import NetImg from '../../../assets/network.webp';
import { useStore } from '@/store/store';
import { useMemo, useState } from 'react';
import {
  UsecaseQuestionsAll,
  UsecaseQuestions,
  UsecaseAnswer,
  UsecaseQuestionKey,
  PrimaryUsecaseQuestions,
  UsecaseKeyStringToTextMap,
} from '@/constants/NetworkUseCases';
import { getExtendedNode } from '@/utils/NodeUtils';
import { ExtendedNode, Node } from '@/models/Node';
import AddNetworkModal from '../add-network-modal/AddNetworkModal';
import NewHostModal from '../new-host-modal/NewHostModal';
import { NodesService } from '@/services/NodesService';
import { extractErrorMsg } from '@/utils/ServiceUtils';
import { NotificationInstance } from 'antd/es/notification/interface';
import AddEgressModal from '../add-egress-modal/AddEgressModal';
import { isValidIpCidr } from '@/utils/NetworkUtils';
import { INTERNET_RANGE_IPV4, INTERNET_RANGE_IPV6 } from '@/constants/AppConstants';
import { UsecaseQuestionAndAnswer } from '@/store/networkusecase';

interface ModalProps {
  isModalOpen: boolean;
  handleCancel: () => void;
  notify: NotificationInstance;
  handleUpgrade: () => void;
}

interface RangesFormFields {
  ranges: Node['egressgatewayranges'];
}

const RemoteAccessUsecaseQuestions: UsecaseQuestionKey[] = [
  'primary_usecase',
  'usecase',
  'networks',
  'hosts',
  'remote_access_gateways',
  'users',
];

const RemoteAccessUsecaseWithEgressQuestions: UsecaseQuestionKey[] = [
  'primary_usecase',
  'usecase',
  'networks',
  'hosts',
  'remote_access_gateways',
  'users',
  'egress',
  'ranges',
];

export default function QuickSetupModal(props: ModalProps) {
  const store = useStore();
  const { currentTheme } = store;
  const [promoText, setPromoText] = useState(
    'Keep using for free under the usage limit, and access additional features',
  );

  const [userQuestionsAsked, setUserQuestionsAsked] = useState<UsecaseQuestionAndAnswer[]>([]);
  const [userQuestions, setUserQuestions] = useState<UsecaseQuestions[]>(PrimaryUsecaseQuestions);
  const [currentQuestion, setCurrentQuestion] = useState<UsecaseQuestions>(PrimaryUsecaseQuestions[0]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [networkId, setNetworkId] = useState<string>('');
  const [isAddNetworkModalOpen, setIsAddNetworkModalOpen] = useState<boolean>(false);
  const [isAddNewHostModalOpen, setIsAddNewHostModalOpen] = useState<boolean>(false);
  const [isNextLoading, setIsNextLoading] = useState<boolean>(false);
  const [egressNodeId, setEgressNodeId] = useState<string>('');
  const [form] = Form.useForm<RangesFormFields>();

  const refPlaceholder = null;

  const networkNodes = useMemo(
    () =>
      store.nodes
        .map((node) => getExtendedNode(node, store.hostsCommonDetails))
        .filter((node) => node.network === networkId),
    [store.nodes, store.hostsCommonDetails, networkId],
  );

  const clientGateways = useMemo<ExtendedNode[]>(() => {
    return networkNodes
      .filter((node) => node.isingressgateway)
      .map((node) => getExtendedNode(node, store.hostsCommonDetails));
  }, [networkNodes, store.hostsCommonDetails]);

  const egresses = useMemo<ExtendedNode[]>(() => {
    return networkNodes
      .filter((node) => node.isegressgateway)
      .map((node) => getExtendedNode(node, store.hostsCommonDetails));
  }, [networkNodes, store.hostsCommonDetails]);

  const handleQuestionAnswer = (answer: string) => {
    // if current question is null return
    if (!currentQuestion) return;
    // add answer to userQuestionsAsked
    setUserQuestionsAsked([
      ...userQuestionsAsked,
      { index: currentQuestionIndex, questionKey: currentQuestion.key, answer },
    ]);

    // check if current question index is 1
    if (currentQuestion.key === 'usecase') {
      if (answer === 'specific_machines') {
        const questions = UsecaseQuestionsAll.filter((question) =>
          RemoteAccessUsecaseQuestions.includes(question.key as UsecaseQuestionKey),
        );
        setUserQuestions(questions);
      } else {
        const questions = UsecaseQuestionsAll.filter((question) =>
          RemoteAccessUsecaseWithEgressQuestions.includes(question.key as UsecaseQuestionKey),
        );
        setUserQuestions(questions);
      }
    }

    // add answer to current question
    setCurrentQuestion({ ...currentQuestion, selectedAnswer: answer });
  };

  const handleNextQuestion = async () => {
    // if current question has no answer return and notify user
    if (!currentQuestion.selectedAnswer && currentQuestion.key !== 'ranges') {
      props.notify.error({ message: 'Please select an answer' });
      return;
    }

    if (currentQuestion.key === 'networks') {
      // get network id
      const networkId = currentQuestion.selectedAnswer;
      // set network id
      if (networkId) {
        setNetworkId(networkId);
      }
    } else if (currentQuestion.key === 'remote_access_gateways') {
      const answer = currentQuestion.selectedAnswer as Node['id'];
      const isAnswerARemoteAccessGateway = clientGateways.find((gateway) => gateway.id === answer);
      if (!isAnswerARemoteAccessGateway) {
        try {
          setIsNextLoading(true);
          const ingressNode = (
            await NodesService.createIngressNode(answer, networkId, {
              extclientdns: '',
              is_internet_gw: false,
            })
          ).data;
          props.notify.success({ message: `Remote access gateway created` });
        } catch (err) {
          props.notify.error({
            message: 'Failed to create remote access gateway',
            description: extractErrorMsg(err as any),
          });
        } finally {
          setIsNextLoading(false);
          store.fetchNodes();
        }
      }
    } else if (currentQuestion.key === 'egress') {
      const answer = currentQuestion.selectedAnswer as Node['id'];
      setEgressNodeId(answer);
    } else if (currentQuestion.key === 'ranges') {
      let egressNode: Node;
      const isAnswerAnEgress = egresses.find((gateway) => gateway.id === egressNodeId);
      const formData = await form.validateFields();
      const newRanges = new Set(formData.ranges);

      if (isAnswerAnEgress) {
        egressNode = (await NodesService.deleteEgressNode(egressNodeId, networkId)).data;
      }

      try {
        setIsNextLoading(true);
        egressNode = (
          await NodesService.createEgressNode(egressNodeId, networkId, {
            natEnabled: 'yes',
            ranges: [...newRanges],
          })
        ).data;
        props.notify.success({ message: `Egress gateway created` });
      } catch (err) {
        props.notify.error({
          message: 'Failed to create egress gateway',
          description: extractErrorMsg(err as any),
        });
      } finally {
        setIsNextLoading(false);
        store.fetchNodes();
      }
    }

    // if current question index is the last question
    if (currentQuestionIndex === userQuestions.length - 1) {
      store.updateNetworkUsecaseQuestionAndAnswer(networkId, userQuestionsAsked);
      props.notify.success({ message: 'Network setup complete' });
      props.handleCancel();
      return;
    }

    // get next question
    const nextQuestionIndex = currentQuestionIndex + 1;
    setCurrentQuestion(userQuestions[nextQuestionIndex]);
    setCurrentQuestionIndex(nextQuestionIndex);
  };

  const handlePreviousQuestion = () => {
    // get previous question
    const previousQuestionIndex = currentQuestionIndex - 1;
    const previousQuestion = userQuestions[previousQuestionIndex];

    previousQuestion.selectedAnswer =
      userQuestionsAsked.find((question) => question.index === previousQuestionIndex)?.answer || '';
    setCurrentQuestion(previousQuestion);
    setCurrentQuestionIndex(previousQuestionIndex);
  };

  const onChange = (e: RadioChangeEvent) => {
    const radioValue = e.target.value;
    handleQuestionAnswer(radioValue);
  };

  const selectDropdownOptions = useMemo(() => {
    const initialOptions = [
      {
        label: `Add new ${UsecaseKeyStringToTextMap[currentQuestion.key] ?? currentQuestion.key}`,
        value: 'add_new',
      },
    ];

    if (currentQuestion.key === 'networks') {
      const networkOptions = store.networks.map((network) => ({
        label: network.netid,
        value: network.netid,
      }));
      initialOptions.push(...networkOptions);
    } else if (currentQuestion.key === 'remote_access_gateways') {
      const networkOptions = networkNodes.map((node) => ({
        label: node.name ?? node.id,
        value: node.id,
      }));
      initialOptions.push(...networkOptions);
    } else if (currentQuestion.key === 'hosts') {
      const networkOptions = networkNodes.map((node) => ({
        label: node.name ?? node.id,
        value: node.id,
      }));
      initialOptions.push(...networkOptions);
    } else if (currentQuestion.key === 'egress') {
      const networkOptions = networkNodes.map((node) => ({
        label: node.name ?? node.id,
        value: node.id,
      }));
      initialOptions.push(...networkOptions);
    }

    return initialOptions;
  }, [currentQuestion.key, store.networks, clientGateways, networkNodes, egresses]);

  const handleSelectChange = (value: string) => {
    if (value === 'add_new') {
      if (currentQuestion.key === 'networks') {
        setIsAddNetworkModalOpen(true);
      } else {
        setIsAddNewHostModalOpen(true);
      }
    } else {
      handleQuestionAnswer(value);
    }
  };

  const handleRangeChange = async () => {
    const formData = await form.validateFields();
    const newRanges = new Set(formData.ranges);
    setCurrentQuestion({ ...currentQuestion, selectedAnswer: JSON.stringify([...newRanges]) });
  };

  const getRangesDisplay = () => {
    if (typeof currentQuestion.selectedAnswer === 'string') {
      const ranges = JSON.parse(currentQuestion.selectedAnswer);
      return ranges;
    }
    return [];
  };

  const getCurrentQuestionImage = useMemo(() => {
    let img = null;
    if (currentQuestion.key === 'egress') {
      img = EgressImg;
    } else if (currentQuestion.key === 'remote_access_gateways') {
      img = RagImg;
    } else if (currentQuestion.key === 'networks') {
      img = NetImg;
    } else {
      return <></>;
    }

    return <Image src={img} alt="egress" width={400} height={400} preview={false} style={{ borderRadius: '8px' }} />;
  }, [currentQuestion]);

  return (
    <>
      <Modal
        open={props.isModalOpen}
        onCancel={props.handleCancel}
        className="upgrade-modal"
        width={1196}
        bodyStyle={{
          background:
            currentTheme === 'dark'
              ? 'linear-gradient(to right, #1f1f1f 0%, #1f1f1f 50%, #141414 50%, #141414 100%)'
              : 'linear-gradient(to right, #FFFFFF 0%, #FFFFFF 50%, #F5F5F5 50%, #F5F5F5 100%)',
          height: '740px',
          padding: '0px',
        }}
        style={{
          background:
            currentTheme === 'dark'
              ? 'linear-gradient(to right, #1f1f1f 0%, #1f1f1f 50%, #141414 50%, #141414 100%)'
              : 'linear-gradient(to right, #FFFFFF 0%, #FFFFFF 50%, #F5F5F5 50%, #F5F5F5 100%)',
          padding: '0px',
          // height: "740px",
        }}
        footer={null}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              width: '50%',
              height: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Space direction="vertical" size="large" style={{ width: '362px' }}>
              <div>
                <Typography.Title level={4}>{currentQuestion.descriptionTitle}</Typography.Title>

                <Typography.Text
                  style={{
                    fontWeight: 400,
                    fontSize: 14,
                    lineHeight: '24px',
                    color: currentTheme === 'dark' ? '#FFFFFFA6' : '#00000073',
                  }}
                >
                  {currentQuestion.description}
                </Typography.Text>

                {getCurrentQuestionImage}
              </div>
            </Space>
          </div>

          <div
            style={{
              width: '50%',
              height: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                // marginTop: "auto",
              }}
            >
              <Space direction="vertical" size="large" style={{ width: '362px' }}>
                <div>
                  <Typography.Title level={4}>{currentQuestion.question}</Typography.Title>

                  {currentQuestion && currentQuestion.type === 'radio' && (
                    <Radio.Group onChange={onChange} value={currentQuestion.selectedAnswer}>
                      <Space direction="vertical">
                        {currentQuestion.answers.map((answer, i) => (
                          <Radio value={answer} key={i}>
                            {UsecaseKeyStringToTextMap[answer] ?? answer}
                          </Radio>
                        ))}
                      </Space>
                    </Radio.Group>
                  )}
                </div>

                {currentQuestion && currentQuestion.type === 'select' && (
                  <Select
                    options={selectDropdownOptions}
                    value={currentQuestion.selectedAnswer}
                    style={{ width: '100%' }}
                    onChange={handleSelectChange}
                  />
                )}

                {currentQuestion && currentQuestion.type === 'ranges' && (
                  <Form form={form}>
                    <Form.List
                      name="ranges"
                      initialValue={getRangesDisplay()}
                      data-nmui-intercom="update-egress-form_ranges"
                    >
                      {(fields, { add, remove }, { errors }) => (
                        <>
                          {fields.map((field, index) => (
                            <Form.Item
                              label={index === 0 ? 'Input range' : ''}
                              key={field.key}
                              required={false}
                              style={{ marginBottom: '.5rem' }}
                            >
                              <Form.Item
                                {...field}
                                validateTrigger={['onBlur']}
                                rules={[
                                  {
                                    required: true,
                                    validator(_, value) {
                                      if (!isValidIpCidr(value)) {
                                        return Promise.reject('Invalid CIDR');
                                      } else {
                                        if (
                                          value.includes(INTERNET_RANGE_IPV4) ||
                                          value.includes(INTERNET_RANGE_IPV6)
                                        ) {
                                          return Promise.reject(
                                            'Visit the Remote Access tab to create an internet gateway',
                                          );
                                        }
                                        return Promise.resolve();
                                      }
                                    },
                                  },
                                ]}
                                noStyle
                              >
                                <Input
                                  placeholder="CIDR range (eg: 10.0.0.0/8 or a123:4567::/16)"
                                  style={{ width: '100%' }}
                                  onChange={handleRangeChange}
                                  prefix={
                                    <Tooltip title="Remove">
                                      <Button
                                        danger
                                        type="link"
                                        icon={<CloseOutlined />}
                                        onClick={() => remove(index)}
                                        size="small"
                                      />
                                    </Tooltip>
                                  }
                                />
                              </Form.Item>
                            </Form.Item>
                          ))}
                          <Form.Item>
                            <Button onClick={() => add()} icon={<PlusOutlined />}>
                              Add range
                            </Button>
                            <Form.ErrorList errors={errors} />
                          </Form.Item>
                        </>
                      )}
                    </Form.List>
                  </Form>
                )}

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    width: '100%',
                    marginTop: '10px',
                  }}
                >
                  {currentQuestionIndex > 0 && (
                    <Button type="primary" size="middle" onClick={handlePreviousQuestion}>
                      Previous
                    </Button>
                  )}
                  <Button
                    type="primary"
                    size="middle"
                    onClick={handleNextQuestion}
                    loading={isNextLoading}
                    style={{ marginLeft: '10px' }}
                  >
                    {currentQuestionIndex == 1 || currentQuestionIndex < userQuestions.length - 1 ? 'Next' : 'Finish'}
                  </Button>
                </div>
              </Space>
            </div>
          </div>
        </div>
      </Modal>

      {/* modals */}
      <AddNetworkModal
        isOpen={isAddNetworkModalOpen}
        onCreateNetwork={() => {
          setIsAddNetworkModalOpen(false);
        }}
        onCancel={() => setIsAddNetworkModalOpen(false)}
        autoFillButtonRef={undefined} // Assign a valid ref object or undefined
        networkNameInputRef={undefined} // Assign a valid ref object or undefined
        ipv4InputRef={undefined}
        ipv6InputRef={undefined}
        defaultAclInputRef={undefined}
        submitButtonRef={undefined}
      />

      <NewHostModal
        isOpen={isAddNewHostModalOpen}
        onFinish={() => setIsAddNewHostModalOpen(false)}
        onCancel={() => setIsAddNewHostModalOpen(false)}
        networkId={networkId}
        connectHostModalEnrollmentKeysTabRef={undefined}
        connectHostModalSelectOSTabRef={undefined}
        connectHostModalJoinNetworkTabRef={undefined}
        isTourOpen={false}
        tourStep={0}
        page="network-details"
      />
    </>
  );
}
