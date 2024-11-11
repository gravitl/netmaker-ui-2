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
 * Determine whether a platform role or user is admin or not
 *
 * @param userOrRole user or role object
 * @returns whether user or role is admin or not
 */
export function isAdminUserOrRole(userOrRole: string | Partial<UserRole & User>): boolean {
  if (typeof userOrRole === 'string') {
    return userOrRole === 'super-admin' || userOrRole === 'admin';
  }
  if (userOrRole?.platform_role_id === undefined) {
    return (userOrRole as UserRole)?.id === 'admin' || (userOrRole as UserRole)?.id === 'super-admin';
  }
  return (userOrRole as User)?.platform_role_id === 'admin' || (userOrRole as User)?.platform_role_id === 'super-admin';
}

/**
 * Determine whether roles provide network admin access or not
 *
 * @param roles roles to check
 * @returns whether roles provide network admin access or not
 */
export function hasNetworkAdminPriviledges(
  user: User,
  networkId?: string,
  // TODO: add networkRoles parameter (source from store), then use the commented code below
  // networkRoles: UserRole[]
): boolean {
  // const roles = Object.keys(user.network_roles).map((role) => networkRoles.find((r) => r.id === role));
  // return roles.some((role) => role?.full_access || role?.id === 'global-network-admin');

  return (
    isAdminUserOrRole(user.platform_role_id) ||
    !!user.user_group_ids['global-network-admin-grp'] ||
    (networkId ? !!user.user_group_ids[`${networkId}-network-admin-grp`] : false)
    // Object.keys(user.user_group_ids).some((groupId) => groupId.match(/^\w+-network-admin-grp/))
  );
}
