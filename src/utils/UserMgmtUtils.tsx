import { UserRole, UserRoleType } from '@/models/User';

/**
 * Utility funciton that determines the type of user role: whether it is a network role or platform access level (role).
 *
 * @param role role to determine type of
 * @returns whether role is a network role or platform access level (platform role)
 */
export function deriveUserRoleType(role: UserRole): UserRoleType {
  return role.network_id ? 'network-role' : 'platform-role';
}
