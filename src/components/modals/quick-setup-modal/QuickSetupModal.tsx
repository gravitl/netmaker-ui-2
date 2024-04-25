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
  Alert,
} from 'antd';
import EgressImg from '../../../assets/egress.webp';
import RagImg from '../../../assets/rag.webp';
import NetImg from '../../../assets/network.webp';
import { useStore } from '@/store/store';
import { useEffect, useMemo, useState } from 'react';
import {
  UsecaseQuestionsAll,
  UsecaseQuestions,
  UsecaseAnswer,
  UsecaseQuestionKey,
  PrimaryUsecaseQuestions,
  UsecaseKeyStringToTextMap,
  UsecaseKeyStringToTextMapForAnswers,
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
import AddHostsToNetworkModal from '../add-hosts-to-network-modal/AddHostsToNetworkModal';

interface ModalProps {
  isModalOpen: boolean;
  handleCancel: () => void;
  notify: NotificationInstance;
  handleUpgrade: () => void;
  networkId?: string;
}

interface RangesFormFields {
  ranges: Node['egressgatewayranges'];
}

const RemoteAccessUsecaseQuestions: UsecaseQuestionKey[] = [
  'primary_usecase',
  'usecase',
  'networks',
  // 'hosts',
  'remote_access_gateways',
  'users',
];

const RemoteAccessUsecaseWithEgressQuestions: UsecaseQuestionKey[] = [
  'primary_usecase',
  'usecase',
  'networks',
  // 'hosts',
  'remote_access_gateways',
  'users',
  'egress',
  'ranges',
];

const RAC_LINK = 'https://docs.netmaker.io/pro/rac.html';
const WIREGUARD_LINK = 'https://docs.netmaker.io/integrating-non-native-devices.html';

export default function QuickSetupModal(props: ModalProps) {
  const store = useStore();
  const { currentTheme } = store;
  const [userQuestionsAsked, setUserQuestionsAsked] = useState<UsecaseQuestionAndAnswer[]>([]);
  const [userQuestions, setUserQuestions] = useState<UsecaseQuestions[]>(UsecaseQuestionsAll);
  const [currentQuestion, setCurrentQuestion] = useState<UsecaseQuestions>(PrimaryUsecaseQuestions[0]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [networkId, setNetworkId] = useState<string>(props.networkId ?? '');
  const [isAddNetworkModalOpen, setIsAddNetworkModalOpen] = useState<boolean>(false);
  const [isAddNewHostModalOpen, setIsAddNewHostModalOpen] = useState<boolean>(false);
  const [isAddHostsToNetworkModalOpen, setIsAddHostsToNetworkModalOpen] = useState<boolean>(false);
  const [isNextLoading, setIsNextLoading] = useState<boolean>(false);
  const [egressNodeId, setEgressNodeId] = useState<string>('');
  const [form] = Form.useForm<RangesFormFields>();

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
    // add answer to userQuestionsAsked, remove question if it exists
    const questionsAskedMinusCurrentQuestion = userQuestionsAsked.filter(
      (ques) => ques.questionKey !== currentQuestion.key,
    );
    setUserQuestionsAsked([
      ...questionsAskedMinusCurrentQuestion,
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
    if (!currentQuestion.selectedAnswer && currentQuestion.key !== 'ranges' && currentQuestion.key !== 'hosts') {
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
          setIsNextLoading(false);
          return;
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
        setIsNextLoading(false);
        return;
      } finally {
        setIsNextLoading(false);
        store.fetchNodes();
      }
    }

    // if current question index is the last question
    if (currentQuestionIndex === userQuestions.length - 1) {
      store.updateNetworkUsecaseQuestionAndAnswer(networkId, userQuestionsAsked);
      props.notify.success({ message: 'Network setup complete' });
      setUserQuestionsAsked([]);
      setUserQuestions(UsecaseQuestionsAll);
      setCurrentQuestion(PrimaryUsecaseQuestions[0]);
      setCurrentQuestionIndex(0);
      setNetworkId('');
      setEgressNodeId('');
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
        label: `Add new ${UsecaseKeyStringToTextMapForAnswers[currentQuestion.key] ?? currentQuestion.key}`,
        value: 'add_new',
      },
    ];

    const connectExistingHost = {
      label: `Connect existing host`,
      value: 'add_existing',
    };

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
      initialOptions.push(connectExistingHost, ...networkOptions);
    } else if (currentQuestion.key === 'hosts') {
      const networkOptions = networkNodes.map((node) => ({
        label: node.name ?? node.id,
        value: node.id,
      }));
      initialOptions.push(connectExistingHost, ...networkOptions);
    } else if (currentQuestion.key === 'egress') {
      const networkOptions = networkNodes.map((node) => ({
        label: node.name ?? node.id,
        value: node.id,
      }));
      initialOptions.push(connectExistingHost, ...networkOptions);
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
    } else if (value === 'add_existing') {
      setIsAddHostsToNetworkModalOpen(true);
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
    //return <></> if screen size is less than 768px
    if (window.innerWidth <= 768) return <></>;
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

    return <Image src={img} alt="netmaker_resource_img" preview={false} style={{ marginTop: '10px' }} />;
  }, [currentQuestion, window.innerWidth]);

  const alertIfUsecaseIsSetupAlreadyForNetwork = useMemo(() => {
    // check if the network has a usecase setup already
    const check = Object.keys(store.networksUsecaseQuestionAndAnswer).find((netId) => {
      return netId === props.networkId || netId === networkId;
    });

    return (
      <>
        {check && (
          <Alert
            message="We noticed you've used this setup for this network before, ignore this message if you still want to proceed"
            type="info"
            showIcon
            style={{ marginBottom: '1rem' }}
          />
        )}
      </>
    );
  }, [networkId]);

  const getQuickLink = useMemo(() => {
    return (
      <>
        {currentQuestion.key === 'users' && currentQuestion.selectedAnswer === 'our_rac' && (
          <Alert
            message={
              <>
                Visit{' '}
                <a href={RAC_LINK} target="_blank" rel="noreferrer">
                  our docs{' '}
                </a>{' '}
                to find out how to use the Remote Access Client
              </>
            }
            type="info"
            showIcon
          />
        )}
        {currentQuestion.key === 'users' && currentQuestion.selectedAnswer === 'vpn_client' && (
          <Alert
            message={
              <>
                Visit{' '}
                <a href={WIREGUARD_LINK} target="_blank" rel="noreferrer">
                  our docs{' '}
                </a>{' '}
                to find out how to use the vpn client with wireguard
              </>
            }
            type="info"
            showIcon
          />
        )}
      </>
    );
  }, [currentQuestion]);

  const getBodyStyle = useMemo(() => {
    if (window.innerWidth <= 768) {
      return {
        background: currentTheme === 'dark' ? '#1f1f1f' : '#F5F5F5',
        padding: '0px',
        minHeight: '400px',
      };
    } else {
      return {
        background:
          currentTheme === 'dark'
            ? 'linear-gradient(to right, #1f1f1f 0%, #1f1f1f 50%, #141414 50%, #141414 100%)'
            : 'linear-gradient(to right, #FFFFFF 0%, #FFFFFF 50%, #F5F5F5 50%, #F5F5F5 100%)',
        padding: '0px',
        height: '747px',
      };
    }
  }, [window.innerWidth]);

  const selectedAnswer = useMemo(() => {
    if (currentQuestion.key === 'remote_access_gateways') {
      const answer = networkNodes.find((gateway) => gateway.id === currentQuestion.selectedAnswer)?.id || '';
      setCurrentQuestion({ ...currentQuestion, selectedAnswer: answer });
      return answer;
    }
    if (currentQuestion.key === 'egress') {
      const answer = networkNodes.find((egress) => egress.id === currentQuestion.selectedAnswer)?.id || '';
      setCurrentQuestion({ ...currentQuestion, selectedAnswer: answer });
      // egress range in already answered question set to empty string array
      const isEgressGatewayRangeSet = userQuestionsAsked.find((ques) => ques.questionKey === 'ranges');
      if (isEgressGatewayRangeSet && answer !== egressNodeId) {
        const questionsAskedMinusEgressRange = userQuestionsAsked.filter((ques) => ques.questionKey !== 'ranges');
        setUserQuestionsAsked([
          ...questionsAskedMinusEgressRange,
          { index: currentQuestionIndex, questionKey: 'ranges', answer: JSON.stringify([]) },
        ]);
      }

      return answer;
    }
    return currentQuestion.selectedAnswer;
  }, [currentQuestion.selectedAnswer, clientGateways, egresses]);

  return (
    <>
      <Modal
        open={props.isModalOpen}
        onCancel={props.handleCancel}
        className="upgrade-modal"
        width={1196}
        styles={{ body: getBodyStyle }}
        // style={{
        //   background:
        //     currentTheme === 'dark'
        //       ? 'linear-gradient(to right, #1f1f1f 0%, #1f1f1f 50%, #141414 50%, #141414 100%)'
        //       : 'linear-gradient(to right, #FFFFFF 0%, #FFFFFF 50%, #F5F5F5 50%, #F5F5F5 100%)',
        //   padding: '0px',
        //   // height: "747px",
        // }}
        footer={null}
      >
        <Row
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Col
            lg={12}
            md={24}
            style={{
              height: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Space direction="vertical" size="large" style={{ width: '400px' }}>
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
          </Col>

          <Col
            lg={12}
            md={24}
            style={{
              display: 'flex',
              height: '100%',
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
              <Space direction="vertical" size="large" style={{ width: '400px' }}>
                {alertIfUsecaseIsSetupAlreadyForNetwork}
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
                    value={selectedAnswer}
                    style={{ width: '100%' }}
                    onChange={handleSelectChange}
                  />
                )}

                {currentQuestion && currentQuestion.type === 'ranges' && (
                  <Form form={form}>
                    <Form.Item label="Input range" required={false}>
                      <Form.List
                        name="ranges"
                        initialValue={getRangesDisplay()}
                        data-nmui-intercom="update-egress-form_ranges"
                      >
                        {(fields, { add, remove }, { errors }) => (
                          <>
                            {fields.map((field, index) => (
                              <Form.Item
                                {...field}
                                validateTrigger={['onBlur']}
                                key={field.key}
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
                                style={{ marginBottom: '.5rem' }}
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
                    </Form.Item>
                  </Form>
                )}

                {getQuickLink}
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
          </Col>
        </Row>
      </Modal>

      {/* modals */}
      <AddNetworkModal
        isOpen={isAddNetworkModalOpen}
        onCreateNetwork={(network) => {
          setIsAddNetworkModalOpen(false);
          handleQuestionAnswer(network.netid);
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

      <AddHostsToNetworkModal
        isOpen={isAddHostsToNetworkModalOpen}
        networkId={networkId}
        onNetworkUpdated={() => {
          store.fetchNetworks();
          setIsAddHostsToNetworkModalOpen(false);
        }}
        onCancel={() => setIsAddHostsToNetworkModalOpen(false)}
      />
    </>
  );
}
