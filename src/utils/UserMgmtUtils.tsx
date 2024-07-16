import { UserRolePermissionTemplate } from '@/models/User';

/**
 * Utility funciton that determines the type of user role: whether it is a network role or platform role.
 *
 * @param role role to determine type of
 * @returns whether role is a network role or platform role
 */
export function deriveUserRoleType(role: UserRolePermissionTemplate): 'network-role' | 'platform-role' {
  return role.network_id ? 'network-role' : 'platform-role';
}
