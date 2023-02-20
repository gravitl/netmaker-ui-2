import { Host } from '../models/Host';
import { AppRoutes } from '../routes';

// Get host route from host obj or ID
export function getHostRoute(hostOrId: Host | Host['id']): string {
  if (typeof hostOrId === 'string') return `${AppRoutes.HOST_ROUTE.replace(':id', hostOrId)}`;
  return `${AppRoutes.HOST_ROUTE.replace(':id', hostOrId.id)}`;
}
