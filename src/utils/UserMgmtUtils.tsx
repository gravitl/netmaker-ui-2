import { User, UserRole, UserRoleType } from '@/models/User';

/**
 * Utility funciton that determines the type of user role: whether it is a network role or platform access level (role).
 *
 * @param role role to determine type of
 * @returns whether role is a network role or platform access level (platform role)
 */
export function deriveUserRoleType(role: UserRole): UserRoleType {
  return role.network_id ? 'network-role' : 'platform-role';
}

/**
 * Determine whether a role or user is admin or not
 *
 * @param userOrRole user or role object
 * @returns whether user or role is admin or not
 */
export function isAdminUserOrRole(userOrRole: Partial<UserRole & User>): boolean {
  if (userOrRole?.platform_role_id === undefined) {
    return (
      (userOrRole as UserRole)?.id === 'admin' ||
      (userOrRole as UserRole)?.id === 'super-admin' ||
      (userOrRole as UserRole)?.id === 'super_admin'
    );
  }
  return (
    (userOrRole as User)?.platform_role_id === 'admin' ||
    (userOrRole as User)?.platform_role_id === 'super-admin' ||
    (userOrRole as User)?.platform_role_id === 'super_admin'
  );
}
