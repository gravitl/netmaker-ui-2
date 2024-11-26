import { Fragment } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import NetworkSelector from './NetworkSelector';

interface BreadcrumbItem {
  label: string;
  path: string;
  isLast: boolean;
}

interface BreadcrumbProps {
  className?: string;
}

const getReadableName = (segment: string): string => {
  // Handle parameter segments (e.g., :networkId)
  if (segment.startsWith(':')) {
    return '';
  }

  // Convert kebab-case to Title Case
  return segment
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const buildBreadcrumbs = (pathname: string): BreadcrumbItem[] => {
  const paths = pathname.split('/').filter(Boolean);

  return paths.map((path, index) => {
    const isLast = index === paths.length - 1;
    const currentPath = '/' + paths.slice(0, index + 1).join('/');

    return {
      label: path,
      path: currentPath,
      isLast,
    };
  });
};

const replaceParams = (items: BreadcrumbItem[], params: Record<string, string | undefined>): BreadcrumbItem[] => {
  return items.map((item) => ({
    ...item,
    label: Object.entries(params).reduce((label, [param, value]) => {
      if (label === param.replace(':', '') && value !== undefined) {
        return value;
      }
      return label;
    }, item.label),
  }));
};

const Breadcrumb = ({ className = '' }: BreadcrumbProps) => {
  const location = useLocation();
  const params = useParams();

  const rawBreadcrumbs = buildBreadcrumbs(location.pathname);
  const breadcrumbs = replaceParams(rawBreadcrumbs, params);

  // Don't render if we're at the root or if there's only one path segment
  if (location.pathname === '/' || breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav className={`flex items-center space-x-2 mb-6 text-sm text-text-secondary min-h-11 z-10 ${className}`}>
      {breadcrumbs.map((breadcrumb, index) => (
        <Fragment key={breadcrumb.path}>
          {index > 0 && <ChevronRight className="w-4 h-4" />}
          {params.networkId && breadcrumb.label === params.networkId ? (
            <NetworkSelector />
          ) : breadcrumb.isLast ? (
            <span className="font-medium text-text-primary">{getReadableName(breadcrumb.label)}</span>
          ) : (
            <Link to={breadcrumb.path} className="transition-colors hover:text-text-primary">
              {getReadableName(breadcrumb.label)}
            </Link>
          )}
        </Fragment>
      ))}
    </nav>
  );
};

export default Breadcrumb;
