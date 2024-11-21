import { Network } from '@/models/Network';

// Types for ACL rules
export type PolicyType = 'device-policy' | 'user-policy';
export type SourceGroupType = 'user' | 'user-group' | 'tag';
export type DestinationGroupType = 'tag';

// Base TypeValue interfaces
export interface SourceTypeValue {
  id: SourceGroupType;
  value: string;
}

export interface DestinationTypeValue {
  id: DestinationGroupType;
  value: string;
}

export interface ACLRule {
  id: string;
  default: boolean;
  meta_data: string;
  name: string;
  network_id: Network['netid'];
  policy_type: PolicyType;
  src_type: SourceTypeValue[];
  dst_type: DestinationTypeValue[];
  Proto: string | null;
  Port: string | null;
  allowed_traffic_direction: 0 | 1; // 0 for unidirectional, 1 for bidirectional
  enabled: boolean;
  created_by: string;
  created_at: string;
}

export interface CreateACLRuleDto {
  name: string;
  meta_data?: string;
  network_id: Network['netid'];
  policy_type: PolicyType;
  src_type: SourceTypeValue[];
  dst_type: DestinationTypeValue[];
  Proto?: string | null;
  Port?: string | null;
  allowed_traffic_direction?: 0 | 1;
  enabled?: boolean;
}

export interface ToggleEnabledACLRuleDto {
  id: ACLRule['id'];
  network_id: Network['netid'];
  enabled: boolean;
}

export interface ACLTypesResponse {
  policy_types: PolicyType[];
  src_grp_types: SourceGroupType[];
  dst_grp_types: DestinationGroupType[];
}
