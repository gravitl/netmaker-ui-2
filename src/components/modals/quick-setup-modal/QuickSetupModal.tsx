import { CloseOutlined, PlusOutlined } from '@ant-design/icons';
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
  Timeline,
} from 'antd';
import { useStore } from '@/store/store';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  UsecaseQuestionsAll,
  UsecaseQuestions,
  UsecaseQuestionKey,
  PrimaryUsecaseQuestions,
  UsecaseKeyStringToTextMap,
  UsecaseKeyStringToTextMapForAnswers,
  UsecaseKeyStringToTextMapForReview,
} from '@/constants/NetworkUseCases';
import { getExtendedNode } from '@/utils/NodeUtils';
import { ExtendedNode, Node } from '@/models/Node';
import AddNetworkModal from '../add-network-modal/AddNetworkModal';
import NewHostModal from '../new-host-modal/NewHostModal';
import { NodesService } from '@/services/NodesService';
import { extractErrorMsg } from '@/utils/ServiceUtils';
import { NotificationInstance } from 'antd/es/notification/interface';
import { isPrivateIpCidr, isValidIpCidr } from '@/utils/NetworkUtils';
import { INTERNET_RANGE_IPV4, INTERNET_RANGE_IPV6 } from '@/constants/AppConstants';
import { UsecaseQuestionAndAnswer } from '@/store/networkusecase';
import AddHostsToNetworkModal from '../add-hosts-to-network-modal/AddHostsToNetworkModal';
import { ExternalLinks, AppImages } from '@/constants/LinkAndImageConstants';
import { ServerConfigService } from '@/services/ServerConfigService';
import { isSaasBuild } from '@/services/BaseService';
import { use } from 'i18next';
import { TourType } from '@/pages/DashboardPage';
import { ExternalClient } from '@/models/ExternalClient';
import { User } from '@/models/User';
import { UsersService } from '@/services/UsersService';
import AddUserModal from '../add-user-modal/AddUserModal';
import { useServerLicense } from '@/utils/Utils';

interface ModalProps {
  isModalOpen: boolean;
  handleCancel: () => void;
  notify: NotificationInstance;
  handleUpgrade: () => void;
  networkId?: string;
  jumpToTourStep: (step: TourType, netId?: string) => void;
}

interface RangesFormFields {
  ranges: Node['egressgatewayranges'];
}

const RemoteAccessUsecaseQuestionsWithVpnConfig: UsecaseQuestionKey[] = [
  'primary_usecase',
  'usecase',
  'networks',
  'remote_access_gateways',
  'users',
  // 'remote_access_gateways_with_ext_client',
  'hosts',
  'review',
];

const RemoteAccessUsecaseWithEgressQuestionsWithVpnConfig: UsecaseQuestionKey[] = [
  'primary_usecase',
  'usecase',
  'networks',
  'remote_access_gateways',
  'users',
  // 'remote_access_gateways_with_ext_client',
  'egress',
  'ranges',
  'review',
];

const RemoteAccessUsecaseQuestionsWithUsers: UsecaseQuestionKey[] = [
  'primary_usecase',
  'usecase',
  'networks',
  'remote_access_gateways',
  'users',
  'gateway_users',
  'hosts',
  'review',
];

const RemoteAccessUsecaseWithEgressQuestionsWithUsers: UsecaseQuestionKey[] = [
  'primary_usecase',
  'usecase',
  'networks',
  'remote_access_gateways',
  'users',
  'gateway_users',
  'egress',
  'ranges',
  'review',
];

const InternetGatewayUsecaseQuestions: UsecaseQuestionKey[] = [
  'primary_usecase',
  'networks',
  'internet_gateway',
  'review',
];

const ConnectToSiteUsecaseQuestions: UsecaseQuestionKey[] = [
  'primary_usecase',
  'connect_to_site',
  'networks',
  'review',
];

const ConnectToSiteUsecaseQuestionsWithExtClient: UsecaseQuestionKey[] = [
  'primary_usecase',
  'connect_to_site',
  'networks',
  'router',
  'review',
];

const ConnectToSiteUsecaseQuestionsWithNetclient: UsecaseQuestionKey[] = [
  'primary_usecase',
  'connect_to_site',
  'networks',
  'egress',
  'ranges',
  'review',
];

const NodeSelectDropdownChecks = [
  'remote_access_gateways',
  'egress',
  'internet_gateway',
  'router',
  'hosts',
  'netclient',
  'review',
];

const NodeSelectDropdownChecks2 = ['gateway_users'];

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
  const [ingressNodeId, setIngressNodeId] = useState<string>('');
  const [egressNodeId, setEgressNodeId] = useState<string>('');
  const [tourType, setTourType] = useState<TourType>('remoteaccess_specificmachines_our_rac');
  const { isServerEE } = useServerLicense();
  const [users, setUsers] = useState<User[]>([]);
  const [ingressUsers, setIngressUsers] = useState<User[]>([]);
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [isAddNewUserModalOpen, setIsAddNewUserModalOpen] = useState(false);

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

  const internetGateways = useMemo<ExtendedNode[]>(() => {
    return networkNodes
      .filter((node) => node.isinternetgateway)
      .map((node) => getExtendedNode(node, store.hostsCommonDetails));
  }, [networkNodes, store.hostsCommonDetails]);

  const loadUsers = useCallback(
    async (nodeId: string) => {
      try {
        setIsUsersLoading(true);
        const users = (await UsersService.getUsers()).data;
        const usersAttachedToIngress = (await UsersService.getIngressUsers(nodeId)).data.users;
        // remove admins and the superadmin from the list
        const filteredUsers = users.filter((user) => !user.isadmin && !user.issuperadmin);
        setUsers(filteredUsers);
        setIngressUsers(usersAttachedToIngress ?? []);
      } catch (err) {
        props.notify.error({
          message: 'Failed to load users',
          description: extractErrorMsg(err as any),
        });
      } finally {
        setIsUsersLoading(false);
      }
    },
    [props.notify],
  );

  const handleAddToAlreadyAskedQuestions = (answer: string | string[], isSecondAnswer = false) => {
    const questionsAskedMinusCurrentQuestion = userQuestionsAsked.filter(
      (ques) => ques.questionKey !== currentQuestion.key,
    );
    const previousAnswer = currentQuestion.selectedAnswer ? currentQuestion.selectedAnswer : '';
    setUserQuestionsAsked([
      ...questionsAskedMinusCurrentQuestion,
      {
        index: currentQuestionIndex,
        questionKey: currentQuestion.key,
        answer: isSecondAnswer ? previousAnswer : answer,
        answer2: isSecondAnswer ? answer : [],
      },
    ]);
  };

  const resetModal = () => {
    setUserQuestionsAsked([]);
    setUserQuestions(UsecaseQuestionsAll);
    setCurrentQuestion(PrimaryUsecaseQuestions[0]);
    setCurrentQuestionIndex(0);
    setNetworkId('');
    setEgressNodeId('');
    setUsers([]);
    setIngressUsers([]);
    setIngressNodeId('');
    form.resetFields();
  };

  const handleQuestionAnswer = (answer: string | string[], secondAnswer = false) => {
    // if current question is null return
    if (!currentQuestion) return;
    handleAddToAlreadyAskedQuestions(answer, secondAnswer);

    // if current question is primary usecase, set next question based on answer
    if (currentQuestion.key === 'primary_usecase') {
      if (answer === 'remote_access') {
        const questions = UsecaseQuestionsAll.filter((question) =>
          RemoteAccessUsecaseQuestionsWithUsers.includes(question.key as UsecaseQuestionKey),
        ).sort(
          (a, b) =>
            RemoteAccessUsecaseQuestionsWithUsers.indexOf(a.key as UsecaseQuestionKey) -
            RemoteAccessUsecaseQuestionsWithUsers.indexOf(b.key as UsecaseQuestionKey),
        );

        setUserQuestions(questions);
      } else if (answer === 'internet_gateway') {
        const questions = UsecaseQuestionsAll.filter((question) =>
          InternetGatewayUsecaseQuestions.includes(question.key as UsecaseQuestionKey),
        ).sort(
          (a, b) =>
            InternetGatewayUsecaseQuestions.indexOf(a.key as UsecaseQuestionKey) -
            InternetGatewayUsecaseQuestions.indexOf(b.key as UsecaseQuestionKey),
        );
        setTourType('internetgateway');
        setUserQuestions(questions);
      } else if (answer === 'connect_to_site') {
        const questions = UsecaseQuestionsAll.filter((question) =>
          ConnectToSiteUsecaseQuestions.includes(question.key as UsecaseQuestionKey),
        ).sort(
          (a, b) =>
            ConnectToSiteUsecaseQuestions.indexOf(a.key as UsecaseQuestionKey) -
            ConnectToSiteUsecaseQuestions.indexOf(b.key as UsecaseQuestionKey),
        );
        setUserQuestions(questions);
      }
    }

    if (currentQuestion.key === 'users') {
      const answerForUsecase = userQuestionsAsked.find((ques) => ques.questionKey === 'usecase')?.answer;

      if (answer === 'our_rac') {
        if (answerForUsecase === 'specific_machines') {
          const questions = UsecaseQuestionsAll.filter((question) =>
            RemoteAccessUsecaseQuestionsWithUsers.includes(question.key as UsecaseQuestionKey),
          ).sort(
            (a, b) =>
              RemoteAccessUsecaseQuestionsWithUsers.indexOf(a.key as UsecaseQuestionKey) -
              RemoteAccessUsecaseQuestionsWithUsers.indexOf(b.key as UsecaseQuestionKey),
          );
          setTourType('remoteaccess_specificmachines_our_rac');
          setUserQuestions(questions);
        } else {
          const questions = UsecaseQuestionsAll.filter((question) =>
            RemoteAccessUsecaseWithEgressQuestionsWithUsers.includes(question.key as UsecaseQuestionKey),
          ).sort(
            (a, b) =>
              RemoteAccessUsecaseWithEgressQuestionsWithUsers.indexOf(a.key as UsecaseQuestionKey) -
              RemoteAccessUsecaseWithEgressQuestionsWithUsers.indexOf(b.key as UsecaseQuestionKey),
          );
          setTourType('remoteaccess_withegress_our_rac');
          setUserQuestions(questions);
        }
      } else {
        if (answerForUsecase === 'specific_machines') {
          const questions = UsecaseQuestionsAll.filter((question) =>
            RemoteAccessUsecaseQuestionsWithVpnConfig.includes(question.key as UsecaseQuestionKey),
          ).sort(
            (a, b) =>
              RemoteAccessUsecaseQuestionsWithVpnConfig.indexOf(a.key as UsecaseQuestionKey) -
              RemoteAccessUsecaseQuestionsWithVpnConfig.indexOf(b.key as UsecaseQuestionKey),
          );
          setTourType('remoteaccess_specificmachines_vpn_config');
          setUserQuestions(questions);
        } else {
          const questions = UsecaseQuestionsAll.filter((question) =>
            RemoteAccessUsecaseWithEgressQuestionsWithVpnConfig.includes(question.key as UsecaseQuestionKey),
          ).sort(
            (a, b) =>
              RemoteAccessUsecaseWithEgressQuestionsWithVpnConfig.indexOf(a.key as UsecaseQuestionKey) -
              RemoteAccessUsecaseWithEgressQuestionsWithVpnConfig.indexOf(b.key as UsecaseQuestionKey),
          );
          setTourType('remoteaccess_withegress_vpn_config');
          setUserQuestions(questions);
        }
      }
    }

    if (currentQuestion.key === 'connect_to_site') {
      if (answer === 'router') {
        const questions = UsecaseQuestionsAll.filter((question) =>
          ConnectToSiteUsecaseQuestionsWithExtClient.includes(question.key as UsecaseQuestionKey),
        ).sort(
          (a, b) =>
            ConnectToSiteUsecaseQuestionsWithExtClient.indexOf(a.key as UsecaseQuestionKey) -
            ConnectToSiteUsecaseQuestionsWithExtClient.indexOf(b.key as UsecaseQuestionKey),
        );
        setTourType('connecttosite_router');
        setUserQuestions(questions);
      }
      if (answer === 'route_via_netclient') {
        const questions = UsecaseQuestionsAll.filter((question) =>
          ConnectToSiteUsecaseQuestionsWithNetclient.includes(question.key as UsecaseQuestionKey),
        ).sort(
          (a, b) =>
            ConnectToSiteUsecaseQuestionsWithNetclient.indexOf(a.key as UsecaseQuestionKey) -
            ConnectToSiteUsecaseQuestionsWithNetclient.indexOf(b.key as UsecaseQuestionKey),
        );
        setTourType('connecttosite_netclient');
        setUserQuestions(questions);
      }
    }

    // add answer to current question
    if (secondAnswer) {
      setCurrentQuestion({ ...currentQuestion, selectedAnswer2: answer });
      return;
    }

    setCurrentQuestion({ ...currentQuestion, selectedAnswer: answer, selectedAnswer2: [] });
  };

  const checkIfAnswerIsEmpty = (answer: string | string[] | undefined) => {
    if (!answer) return true;
    if (Array.isArray(answer) && answer.length === 0) {
      return true;
    }
    if (typeof answer === 'string' && answer === '') {
      return true;
    }
    return false;
  };

  const checkIfQuestionIsUnAnswered = (question: UsecaseQuestions) => {
    const questionsWithSingleAnswer: UsecaseQuestionKey[] = [
      'primary_usecase',
      'usecase',
      'networks',
      'remote_access_gateways',
      'users',
      'egress',
      'gateway_users',
    ];

    const questionWithMultipleAnswers: UsecaseQuestionKey[] = ['internet_gateway', 'router'];

    if (questionsWithSingleAnswer.includes(question.key) && !question.selectedAnswer) {
      return true;
    }

    if (
      questionWithMultipleAnswers.includes(question.key) &&
      (checkIfAnswerIsEmpty(question.selectedAnswer) || checkIfAnswerIsEmpty(question.selectedAnswer2))
    ) {
      return true;
    }

    return false;
  };

  const handleNextQuestion = async () => {
    // if current question has no answer return and notify user
    if (checkIfQuestionIsUnAnswered(currentQuestion)) {
      props.notify.error({ message: 'Please select an answer' });
      return;
    }

    if (currentQuestion.key === 'networks') {
      // get network id
      const networkId = currentQuestion.selectedAnswer;
      // set network id
      if (networkId && typeof networkId === 'string') {
        setNetworkId(networkId);
      }
    } else if (currentQuestion.key === 'remote_access_gateways') {
      const answer = currentQuestion.selectedAnswer as Node['id'];
      const isAnswerARemoteAccessGateway = clientGateways.find((gateway) => gateway.id === answer);
      if (!isAnswerARemoteAccessGateway) {
        try {
          setIsNextLoading(true);
          await NodesService.createIngressNode(answer, networkId, {
            extclientdns: '',
            is_internet_gw: false,
            metadata: '',
          });
          props.notify.success({ message: `Remote access gateway created` });
          setIngressNodeId(answer);
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
      setIngressNodeId(answer);
      loadUsers(answer);
    } else if (currentQuestion.key === 'egress') {
      const answer = currentQuestion.selectedAnswer as Node['id'];
      setEgressNodeId(answer);
      // check if ranges are set, if not reset form fields
      const isEgressGatewayRangeSet = userQuestionsAsked.find((ques) => ques.questionKey === 'ranges');
      if (!isEgressGatewayRangeSet) {
        form.resetFields();
      }
    } else if (currentQuestion.key === 'ranges') {
      try {
        const isAnswerAnEgress = egresses.find((gateway) => gateway.id === egressNodeId);
        const formData = await form.validateFields();

        //check if there is an empty range field
        if (formData.ranges.includes('') || formData.ranges.length === 0) {
          props.notify.error({
            message: 'An IP range is required to continue. Please fill in the necessary fields.',
          });
          return;
        }
        const newRanges = new Set(formData.ranges);

        if (isAnswerAnEgress) {
          await NodesService.deleteEgressNode(egressNodeId, networkId);
        }
        setIsNextLoading(true);
        await NodesService.createEgressNode(egressNodeId, networkId, {
          nodeId: egressNodeId,
          natEnabled: tourType === 'connecttosite_netclient' ? 'no' : 'yes',
          ranges: [...newRanges],
        });
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
    } else if (currentQuestion.key === 'internet_gateway') {
      const answer = currentQuestion.selectedAnswer as Node['id'];
      const hostsToConnectToInternetGateway = currentQuestion.selectedAnswer2 as Node['id'][];
      const isAnswerAnInternetGateway = networkNodes.find((gateway) => gateway.id === answer)?.isinternetgateway;

      if (!isAnswerAnInternetGateway) {
        try {
          setIsNextLoading(true);
          const newNode = (
            await NodesService.createInternetGateway(answer, networkId, {
              inet_node_client_ids: hostsToConnectToInternetGateway,
            })
          ).data;
          props.notify.success({ message: `Internet gateway created` });
        } catch (err) {
          props.notify.error({
            message: 'Failed to create internet gateway',
            description: extractErrorMsg(err as any),
          });
          setIsNextLoading(false);
          return;
        } finally {
          setIsNextLoading(false);
          store.fetchNodes();
        }
      }
    } else if (currentQuestion.key === 'router') {
      const answer = currentQuestion.selectedAnswer as Node['id'];
      const isAnswerARemoteAccessGateway = networkNodes.find((gateway) => gateway.id === answer)?.isingressgateway;
      if (isAnswerARemoteAccessGateway) {
        try {
          setIsNextLoading(true);
          await NodesService.createExternalClient(answer, networkId, {
            clientid: '',
            publickey: '',
            address: '',
            address6: '',
            extraallowedips:
              currentQuestion.selectedAnswer2 && Array.isArray(currentQuestion.selectedAnswer2)
                ? currentQuestion.selectedAnswer2
                : [],
          });
          props.notify.success({ message: 'External client created' });
        } catch (err) {
          props.notify.error({
            message: 'Failed to create external client',
            description: extractErrorMsg(err as any),
          });
          setIsNextLoading(false);
          return;
        } finally {
          setIsNextLoading(false);
          store.fetchNodes();
        }
      } else {
        try {
          setIsNextLoading(true);
          await NodesService.createIngressNode(answer, networkId, {
            extclientdns: '',
            is_internet_gw: false,
            metadata: '',
          });
          await NodesService.createExternalClient(answer, networkId, {
            clientid: '',
            publickey: '',
            address: '',
            address6: '',
            extraallowedips:
              currentQuestion.selectedAnswer2 && Array.isArray(currentQuestion.selectedAnswer2)
                ? currentQuestion.selectedAnswer2
                : [],
          });
          props.notify.success({ message: `External client and client gateway created` });
        } catch (err) {
          props.notify.error({
            message: 'Failed to create remote access gateway and external client',
            description: extractErrorMsg(err as any),
          });
          setIsNextLoading(false);
          return;
        } finally {
          setIsNextLoading(false);
          store.fetchNodes();
        }
      }
    } else if (currentQuestion.key === 'gateway_users') {
      const answer = currentQuestion.selectedAnswer as string[];
      const previouslyAddedUsers = ingressUsers.filter((user) => {
        const isAttached = user.remote_gw_ids?.[ingressNodeId];
        return isAttached;
      });
      const newlyAddedUsers = answer.filter(
        (user) => !previouslyAddedUsers.map((user) => user.username).includes(user),
      );
      const usersToRemove = ingressUsers.filter((user) => !answer.includes(user.username));

      for (const user of usersToRemove) {
        try {
          setIsNextLoading(true);
          await UsersService.removeUserFromIngress(user.username, ingressNodeId);
        } catch (err) {
          props.notify.error({
            message: `Failed to remove ${user} from remote access gateway`,
            description: extractErrorMsg(err as any),
          });
          setIsNextLoading(false);
          return;
        } finally {
          setIsNextLoading(false);
        }
      }

      for (const user of newlyAddedUsers) {
        try {
          setIsNextLoading(true);
          await UsersService.attachUserToIngress(user, ingressNodeId);
        } catch (err) {
          props.notify.error({
            message: `Failed to attach ${user} to remote access gateway`,
            description: extractErrorMsg(err as any),
          });
          setIsNextLoading(false);
          return;
        } finally {
          setIsNextLoading(false);
        }
      }
    }

    // if current question index is the last question
    if (currentQuestionIndex === userQuestions.length - 1) {
      store.updateNetworkUsecaseQuestionAndAnswer(networkId, userQuestionsAsked);
      props.notify.success({ message: 'Network setup complete' });
      resetModal();
      props.jumpToTourStep(tourType, networkId);
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
    } else if (NodeSelectDropdownChecks.includes(currentQuestion.key)) {
      const networkOptions = networkNodes.map((node) => ({
        label: node.name ?? node.id,
        value: node.id,
      }));
      initialOptions.push(connectExistingHost, ...networkOptions);
    } else if (currentQuestion.key === 'gateway_users') {
      const userOptions = users.map((user) => ({
        label: user.username,
        value: user.username,
      }));
      initialOptions.push(...userOptions);
    }

    return initialOptions;
  }, [currentQuestion.key, store.networks, networkNodes]);

  const secondSelectDropdownOptions = useMemo(() => {
    const initialOptions = [
      {
        label: `Add new hosts`,
        value: 'add_new',
      },
    ];

    const connectExistingHost = {
      label: `Connect existing host`,
      value: 'add_existing',
    };

    if (currentQuestion.key === 'internet_gateway') {
      //filter out already selected host
      const networkOptions = networkNodes
        .filter((node) => {
          return node.id !== currentQuestion.selectedAnswer;
        })
        .map((node) => ({
          label: node.name ?? node.id,
          value: node.id,
        }));
      initialOptions.push(connectExistingHost, ...networkOptions);
    }

    return initialOptions;
  }, [currentQuestion.key, store.networks, networkNodes, currentQuestion.selectedAnswer]);

  const handleSelectChange = (val: string | string[]) => {
    let value = val;
    if (Array.isArray(val)) {
      // remove add_new and add_existing from the array
      value = val.filter((v) => v !== 'add_new' && v !== 'add_existing');
    }

    if (value === 'add_new') {
      if (currentQuestion.key === 'networks') {
        setIsAddNetworkModalOpen(true);
      } else if (currentQuestion.key === 'gateway_users') {
        setIsAddNewUserModalOpen(true);
      } else {
        setIsAddNewHostModalOpen(true);
      }
    } else if (value === 'add_existing') {
      setIsAddHostsToNetworkModalOpen(true);
    } else {
      // if expected value is an array and value is not an array return
      if (NodeSelectDropdownChecks2.includes(currentQuestion.key) && !Array.isArray(value)) {
        return;
      }
      handleQuestionAnswer(value);
    }
  };

  const handleSelectChange2 = (value: string | string[]) => {
    if (typeof value === 'string' && value === 'add_new') {
      setIsAddNewHostModalOpen(true);
    } else if (typeof value === 'string' && value === 'add_existing') {
      setIsAddHostsToNetworkModalOpen(true);
    } else {
      if (currentQuestion.key === 'internet_gateway' && Array.isArray(value)) {
        handleQuestionAnswer(value, true);
      } else if (currentQuestion.key === 'router' && Array.isArray(value)) {
        handleQuestionAnswer(value, true);
      }
    }
  };

  const handleRangeChange = async () => {
    const formData = await form.validateFields();
    const newRanges = new Set(formData.ranges);
    handleAddToAlreadyAskedQuestions(JSON.stringify([...newRanges]));
    setCurrentQuestion({ ...currentQuestion, selectedAnswer: JSON.stringify([...newRanges]) });
  };

  const getRangesDisplay = () => {
    if (typeof currentQuestion.selectedAnswer === 'string') {
      const ranges = JSON.parse(currentQuestion.selectedAnswer);
      return ranges;
    }
    return [];
  };

  const getAnswerText = useCallback(
    (answer: string | string[] | undefined) => {
      if (!answer) return '';
      if (Array.isArray(answer)) {
        return answer
          .map((ans) => {
            if (UsecaseKeyStringToTextMapForAnswers[ans]) {
              return UsecaseKeyStringToTextMapForAnswers[ans];
            } else {
              const node = networkNodes.find((node) => node.id === ans);
              return node?.name ?? ans;
            }
          })
          .join(', ');
      }
      if (UsecaseKeyStringToTextMap[answer]) {
        return UsecaseKeyStringToTextMap[answer];
      } else {
        // check if answer is a node id and return node name
        const node = networkNodes.find((node) => node.id === answer);
        return node?.name ?? answer;
      }
    },
    [networkNodes],
  );

  const getCurrentQuestionImage = useMemo(() => {
    //return <></> if screen size is less than 768px
    if (window.innerWidth <= 768) return <></>;
    let img = null;
    if (currentQuestion.key === 'egress') {
      img = isSaasBuild ? `/${ServerConfigService.getUiVersion()}${AppImages.EGRESS_IMG}` : AppImages.EGRESS_IMG;
    } else if (currentQuestion.key === 'remote_access_gateways') {
      img = isSaasBuild ? `/${ServerConfigService.getUiVersion()}${AppImages.RAG_IMG}` : AppImages.RAG_IMG;
    } else if (currentQuestion.key === 'networks') {
      img = isSaasBuild ? `/${ServerConfigService.getUiVersion()}${AppImages.NET_IMG}` : AppImages.NET_IMG;
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
          <>
            <Alert
              message={
                <>
                  Visit{' '}
                  <a href={ExternalLinks.RAC_LINK} target="_blank" rel="noreferrer">
                    our docs{' '}
                  </a>{' '}
                  to find out how to use the Remote Access Client
                </>
              }
              type="info"
              showIcon
            />

            <Alert
              message={
                <>
                  Visit this{' '}
                  <a href={ExternalLinks.HOW_TO_ADD_USERS_TO_NETWORK} target="_blank" rel="noreferrer">
                    blog post{' '}
                  </a>{' '}
                  to find out how to add users.
                </>
              }
              type="info"
              style={{ marginTop: '1rem' }}
              showIcon
            />
          </>
        )}
        {currentQuestion.key === 'users' && currentQuestion.selectedAnswer === 'vpn_client' && (
          <Alert
            message={
              <>
                Visit{' '}
                <a href={ExternalLinks.WIREGUARD_LINK} target="_blank" rel="noreferrer">
                  our docs{' '}
                </a>{' '}
                to find out how to use the vpn client with wireguard
              </>
            }
            type="info"
            showIcon
          />
        )}
        {currentQuestion.key === 'connect_to_site' && currentQuestion.selectedAnswer === 'router' && (
          <Alert
            message={
              <>
                Visit{' '}
                <a href={ExternalLinks.INTEGRATING_NON_NATIVE_DEVICES_LINK} target="_blank" rel="noreferrer">
                  our docs{' '}
                </a>{' '}
                to find out how to integrate a router
              </>
            }
            type="info"
            showIcon
          />
        )}
        {currentQuestion.key === 'connect_to_site' && currentQuestion.selectedAnswer === 'route_via_netclient' && (
          <Alert
            message={
              <>
                Visit{' '}
                <a href={ExternalLinks.ROUTE_LOCAL_NETWORK_TRAFFIC_LINK} target="_blank" rel="noreferrer">
                  our docs{' '}
                </a>{' '}
                to find out how to route local network traffic through netclient
              </>
            }
            type="info"
            showIcon
          />
        )}
      </>
    );
  }, [currentQuestion]);

  const getQuickLinkForReview = useCallback(
    (selectedAnswer: string) => {
      return (
        <>
          {selectedAnswer === 'our_rac' && (
            <>
              <Alert
                message={
                  <>
                    Visit{' '}
                    <a href={ExternalLinks.RAC_LINK} target="_blank" rel="noreferrer">
                      our docs{' '}
                    </a>{' '}
                    to find out how to use the Remote Access Client
                  </>
                }
                type="info"
                showIcon
                style={{ marginTop: '1rem' }}
              />
              <Alert
                message={
                  <>
                    Visit this{' '}
                    <a href={ExternalLinks.HOW_TO_ADD_USERS_TO_NETWORK} target="_blank" rel="noreferrer">
                      blog post{' '}
                    </a>{' '}
                    to find out how to add users.
                  </>
                }
                type="info"
                style={{ marginTop: '1rem' }}
                showIcon
              />
            </>
          )}
          {selectedAnswer === 'vpn_client' && (
            <Alert
              message={
                <>
                  Visit{' '}
                  <a href={ExternalLinks.WIREGUARD_LINK} target="_blank" rel="noreferrer">
                    our docs{' '}
                  </a>{' '}
                  to find out how to use the vpn client with wireguard
                </>
              }
              type="info"
              showIcon
              style={{ marginTop: '1rem' }}
            />
          )}
          {selectedAnswer === 'router' && (
            <Alert
              message={
                <>
                  Visit{' '}
                  <a href={ExternalLinks.INTEGRATING_NON_NATIVE_DEVICES_LINK} target="_blank" rel="noreferrer">
                    our docs{' '}
                  </a>{' '}
                  to find out how to integrate a router
                </>
              }
              type="info"
              showIcon
              style={{ marginTop: '1rem' }}
            />
          )}
          {/* {selectedAnswer === 'route_via_netclient' && (
            <Alert
              message={
                <>
                  Visit{' '}
                  <a href={ExternalLinks.ROUTE_LOCAL_NETWORK_TRAFFIC_LINK} target="_blank" rel="noreferrer">
                    our docs{' '}
                  </a>{' '}
                  to find out how to route local network traffic through netclient
                </>
              }
              type="info"
              showIcon
              style={{ marginTop: '1rem' }}
            />
          )} */}
        </>
      );
    },
    [currentQuestion],
  );

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
  }, [window.innerWidth, currentTheme]);

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
        form.resetFields();
      }

      return answer;
    }

    // handle hosts
    if (currentQuestion.key === 'hosts') {
      const answer = networkNodes
        .filter((node) => currentQuestion.selectedAnswer?.includes(node.id))
        .map((node) => node.id);
      return answer;
    }

    if (currentQuestion.key === 'gateway_users') {
      if (currentQuestion.selectedAnswer) {
        const answer = currentQuestion.selectedAnswer;
        return answer;
      }

      const answer = ingressUsers
        .filter((user) => {
          const attached = user?.remote_gw_ids?.[ingressNodeId];
          return attached;
        })
        .map((user) => user.username);
      return answer;
    }
    return currentQuestion.selectedAnswer;
  }, [currentQuestion.selectedAnswer, currentQuestion.key, clientGateways, egresses, ingressNodeId]);

  const selectedAnswer2 = useMemo(() => {
    if (currentQuestion.key === 'internet_gateway' && Array.isArray(currentQuestion.selectedAnswer2)) {
      const answers = networkNodes
        .filter((gateway) => currentQuestion.selectedAnswer2?.includes(gateway.id))
        .map((gateway) => gateway.id);
      // setCurrentQuestion({ ...currentQuestion, selectedAnswer2: answers });
      return answers;
    } else if (currentQuestion.key === 'router' && Array.isArray(currentQuestion.selectedAnswer2)) {
      const answers = currentQuestion.selectedAnswer2;
      return answers;
    }
    return currentQuestion.selectedAnswer2;
  }, [currentQuestion.selectedAnswer2, currentQuestion.key, internetGateways]);

  const reviewItems = useMemo(() => {
    const questionsAskedMinusReview = userQuestionsAsked.filter((ques) => ques.questionKey !== 'review');
    return questionsAskedMinusReview.map((question) => {
      const questionText = UsecaseKeyStringToTextMapForReview[question.questionKey];
      const questionText2 = UsecaseKeyStringToTextMapForReview[`${question.questionKey}_2`];
      let answerText = getAnswerText(question.answer);
      const answerText2 = getAnswerText(question.answer2);

      // if question key is hosts list all hosts
      if (question.questionKey === 'hosts') {
        answerText = networkNodes.map((node) => node.name).join(', ');
      }
      return {
        // label: questionText,
        children: (
          <>
            {questionText && <Typography.Paragraph strong>{questionText}</Typography.Paragraph>}
            {answerText && <Typography.Text>{answerText}</Typography.Text>}
            {typeof question.answer === 'string' && getQuickLinkForReview(question.answer)}
            {questionText2 && (
              <Typography.Paragraph strong style={{ marginTop: '10px' }}>
                {questionText2}
              </Typography.Paragraph>
            )}
            {answerText2 && <Typography.Text>{answerText2}</Typography.Text>}
          </>
        ),
      };
    });
  }, [getAnswerText, getQuickLinkForReview, userQuestionsAsked]);

  const currentQuestionDescription = useMemo(() => {
    if (
      currentQuestion.type === 'radio' &&
      currentQuestion.subDescription &&
      typeof currentQuestion.selectedAnswer === 'string'
    ) {
      const descriptionIndex = currentQuestion.answers.findIndex((answer) => answer === currentQuestion.selectedAnswer);
      return currentQuestion.subDescription[descriptionIndex];
    }
    return currentQuestion.description;
  }, [
    currentQuestion.answers,
    currentQuestion.description,
    currentQuestion.selectedAnswer,
    currentQuestion.subDescription,
    currentQuestion.type,
  ]);

  const nextButtonText = useMemo(() => {
    if (
      currentQuestion.key === 'ranges' ||
      currentQuestion.key === 'internet_gateway' ||
      currentQuestion.key === 'remote_access_gateways'
    ) {
      return 'Create';
    } else {
      return 'Next';
    }
  }, [currentQuestion.key]);

  useEffect(() => {
    if (!currentQuestion.selectedAnswer && currentQuestion.key === 'networks') {
      if (store.networks.length > 0) {
        const answer = store.networks[0].netid;
        handleQuestionAnswer(answer);
      }
    } else if (!currentQuestion.selectedAnswer && NodeSelectDropdownChecks.includes(currentQuestion.key)) {
      if (networkNodes.length > 0) {
        const answer = networkNodes[0].id;
        handleQuestionAnswer(answer);
      }
    }
  }, [currentQuestion.key, store.networks, networkNodes]);

  return (
    <>
      <Modal
        open={props.isModalOpen}
        onCancel={() => {
          resetModal();
          props.handleCancel();
        }}
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
              <div style={{ minHeight: '166px' }}>
                <Typography.Title level={4}>{currentQuestion.descriptionTitle}</Typography.Title>

                <Typography.Text
                  style={{
                    fontWeight: 400,
                    fontSize: 14,
                    lineHeight: '24px',
                    color: currentTheme === 'dark' ? '#FFFFFFA6' : '#00000073',
                  }}
                >
                  {currentQuestionDescription}
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
              <Space
                direction="vertical"
                size="large"
                style={{ width: '400px', maxHeight: '600px', overflowY: 'auto' }}
              >
                {alertIfUsecaseIsSetupAlreadyForNetwork}
                <div>
                  <Typography.Title level={4}>{currentQuestion.question}</Typography.Title>

                  {currentQuestion && currentQuestion.type === 'radio' && (
                    <Radio.Group onChange={onChange} value={currentQuestion.selectedAnswer}>
                      <Space direction="vertical">
                        {currentQuestion.answers.map((answer, i) => (
                          <Radio value={answer} key={i} disabled={answer === 'internet_gateway' && !isServerEE}>
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
                    // defaultValue={currentQuestion.key === 'gateway_users' ? selectedAnswer : undefined}
                    style={{ width: '100%' }}
                    onSelect={handleSelectChange}
                    onChange={handleSelectChange}
                    mode={currentQuestion.selectMode || undefined}
                  />
                )}

                {currentQuestion && currentQuestion.type === 'ranges' && (
                  <Form form={form}>
                    <Form.Item label="Input range" required={true}>
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

                {currentQuestion && currentQuestion.type === 'host_select' && (
                  <Space direction="vertical">
                    <Row>
                      <Col span={24}>
                        <Button type="primary" onClick={() => setIsAddNewHostModalOpen(true)}>
                          Add new host
                        </Button>
                        <Button
                          style={{
                            marginLeft: '10px',
                          }}
                          type="primary"
                          onClick={() => setIsAddHostsToNetworkModalOpen(true)}
                        >
                          Connect existing host
                        </Button>
                      </Col>
                    </Row>
                    <Row style={{ marginTop: '10px' }}>
                      <Col span={24}>
                        <Typography.Title level={5}>Connected Hosts</Typography.Title>
                        <ul>
                          {networkNodes.map((node, i) => (
                            <li key={i}> {node.name}</li>
                          ))}
                        </ul>
                      </Col>
                    </Row>
                  </Space>
                )}

                {currentQuestion && currentQuestion.type === 'double_select' && (
                  <>
                    <Select
                      options={selectDropdownOptions}
                      value={selectedAnswer}
                      style={{ width: '100%' }}
                      onSelect={handleSelectChange}
                      placeholder={currentQuestion.answer1Placeholder}
                    />
                    <Typography.Title level={5}>{currentQuestion.question2}</Typography.Title>

                    <Select
                      options={currentQuestion.secondSelectMode === 'multiple' ? secondSelectDropdownOptions : []}
                      value={selectedAnswer2}
                      style={{ width: '100%' }}
                      onSelect={handleSelectChange2}
                      onChange={handleSelectChange2}
                      placeholder={currentQuestion.answer2Placeholder}
                      mode={currentQuestion.secondSelectMode}
                    />
                  </>
                )}

                {currentQuestion && currentQuestion.key === 'review' && <Timeline items={reviewItems} />}

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
                    {currentQuestionIndex == 1 || currentQuestionIndex < userQuestions.length - 1
                      ? nextButtonText
                      : 'Finish'}
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

      <AddUserModal
        isOpen={isAddNewUserModalOpen}
        onCreateUser={(user) => {
          setUsers([...users, user]);
          setIsAddNewUserModalOpen(false);
        }}
        onCancel={() => {
          setIsAddNewUserModalOpen(false);
        }}
      />
    </>
  );
}
