import { StateCreator } from 'zustand';
import { Network } from '../models/Network';

export type NetworkUsecaseString = 'remote_access_multiple_users' | 'egress_to_cloud_vpc';

interface NetworksUsecase {
  [key: Network['netid']]: NetworkUsecaseString;
}

export interface UsecaseQuestionAndAnswer {
  index: number;
  questionKey: string;
  answer: string | string[];
  answer2?: string | string[];
}

interface NetworksUsecaseQuestionAndAnswer {
  [key: Network['netid']]: UsecaseQuestionAndAnswer[];
}

export interface INetworksUsecaseSlice {
  networksUsecase: NetworksUsecase;
  networksUsecaseQuestionAndAnswer: NetworksUsecaseQuestionAndAnswer;
  setNetworksUsecase: (networks: NetworksUsecase) => void;
  setNetworksUsecaseQuestionAndAnswer: (networks: NetworksUsecaseQuestionAndAnswer) => void;
  updateNetworkUsecase: (networkId: Network['netid'], newNetworkUsecase: NetworkUsecaseString) => void;
  updateNetworkUsecaseQuestionAndAnswer: (
    networkId: Network['netid'],
    newNetworkUsecaseQuestionAndAnswer: UsecaseQuestionAndAnswer[],
  ) => void;
  deleteNetworkUsecase: (networkId: Network['netid']) => void;
  deleteNetworkUsecaseQuestionAndAnswer: (networkId: Network['netid']) => void;
}

const createNetworkUsecaseSlice: StateCreator<INetworksUsecaseSlice, [], [], INetworksUsecaseSlice> = (set) => ({
  networksUsecase: {},
  networksUsecaseQuestionAndAnswer: {},
  setNetworksUsecase: (networksUsecase: NetworksUsecase) => set(() => ({ networksUsecase })),
  setNetworksUsecaseQuestionAndAnswer: (networksUsecaseQuestionAndAnswer: NetworksUsecaseQuestionAndAnswer) =>
    set(() => ({ networksUsecaseQuestionAndAnswer })),
  updateNetworkUsecase(networkId, newNetworkUsecase) {
    set((state) => ({
      networksUsecase: {
        ...state.networksUsecase,
        [networkId]: newNetworkUsecase,
      },
    }));
  },
  updateNetworkUsecaseQuestionAndAnswer(networkId, newNetworkUsecaseQuestionAndAnswer) {
    set((state) => ({
      networksUsecaseQuestionAndAnswer: {
        ...state.networksUsecaseQuestionAndAnswer,
        [networkId]: newNetworkUsecaseQuestionAndAnswer,
      },
    }));
  },
  deleteNetworkUsecase(networkId) {
    set((state) => ({
      networksUsecase: Object.keys(state.networksUsecase).reduce((acc, key) => {
        if (key !== networkId) {
          acc[key] = state.networksUsecase[key];
        }
        return acc;
      }, {} as NetworksUsecase),
    }));
  },
  deleteNetworkUsecaseQuestionAndAnswer(networkId) {
    set((state) => ({
      networksUsecaseQuestionAndAnswer: Object.keys(state.networksUsecaseQuestionAndAnswer).reduce((acc, key) => {
        if (key !== networkId) {
          acc[key] = state.networksUsecaseQuestionAndAnswer[key];
        }
        return acc;
      }, {} as NetworksUsecaseQuestionAndAnswer),
    }));
  },
});

export const NetworksUsecaseSlice = {
  createNetworkUsecaseSlice,
};
