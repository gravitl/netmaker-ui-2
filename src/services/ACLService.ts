import { ApiRoutes } from '@/constants/ApiRoutes';
import { axiosService } from './BaseService';
import { GenericResponseDto } from './dtos/GenericDto';
import { Network } from '@/models/Network';
import { ACLRule, CreateACLRuleDto } from './dtos/ACLDtos';

// ACL Service functions
function getACLRules(networkId: Network['netid']) {
  return axiosService.get<GenericResponseDto<ACLRule[]>>(
    `${ApiRoutes.ACL_V1}?network=${encodeURIComponent(networkId)}`,
  );
}

function createACLRule(payload: CreateACLRuleDto, networkId: Network['netid']) {
  return axiosService.post<ACLRule>(`${ApiRoutes.ACL_V1}?network=${encodeURIComponent(networkId)}`, payload);
}

function deleteACLRule(aclRuleId: ACLRule['id'], networkId: Network['netid']) {
  return axiosService.delete<void>(
    `${ApiRoutes.ACL_V1}?acl_id=${encodeURIComponent(aclRuleId)}&network=${encodeURIComponent(networkId)}`,
  );
}

function toggleEnabeledACLRule(policy: ACLRule, newEnabled: boolean, networkId: Network['netid']) {
  const payload = {
    ...policy,
    enabled: newEnabled,
  };

  return axiosService.put<void>(`${ApiRoutes.ACL_V1}?network=${encodeURIComponent(networkId)}`, payload);
}

function updateACLRule(payload: ACLRule, networkId: Network['netid']) {
  return axiosService.put<ACLRule>(`${ApiRoutes.ACL_V1}?network=${encodeURIComponent(networkId)}`, payload);
}

export const ACLService = {
  getACLRules,
  createACLRule,
  deleteACLRule,
  toggleEnabeledACLRule,
  updateACLRule,
};
