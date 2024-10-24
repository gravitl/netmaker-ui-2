import { ApiRoutes } from '@/constants/ApiRoutes';
import { axiosService } from './BaseService';
import { GenericResponseDto } from './dtos/GenericDto';
import { Network } from '@/models/Network';
import { ACLRule, CreateACLRuleDto, ToggleEnabledACLRuleDto } from './dtos/ACLDtos';

// interface UpdateACLRuleDto extends Partial<Omit<CreateACLRuleDto, 'network_id'>> {}

// ACL Service functions
function getACLRules(networkId: Network['netid']) {
  return axiosService.get<GenericResponseDto<ACLRule[]>>(
    `${ApiRoutes.ACL_V1}?network=${encodeURIComponent(networkId)}`,
  );
}

function createACLRule(payload: CreateACLRuleDto) {
  return axiosService.post<ACLRule>(ApiRoutes.ACL_V1, payload);
}

function deleteACLRule(aclRuleId: ACLRule['id']) {
  return axiosService.delete<void>(`${ApiRoutes.ACL_V1}?acl_id=${encodeURIComponent(aclRuleId)}`);
}

function toggleEnabeledACLRule(policy: ACLRule, newEnabled: boolean) {
  const payload = {
    ...policy,
    enabled: newEnabled,
  };

  return axiosService.put<void>(ApiRoutes.ACL_V1, payload);
}

function updateACLRule(payload: ACLRule) {
  return axiosService.put<ACLRule>(ApiRoutes.ACL_V1, payload);
}

export const ACLService = {
  getACLRules,
  createACLRule,
  deleteACLRule,
  toggleEnabeledACLRule,
  updateACLRule,
};
