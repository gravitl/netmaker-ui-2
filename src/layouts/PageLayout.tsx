import { ReactNode } from 'react';

interface PageLayoutProps {
  title: string;
  description?: string | ReactNode;
  icon?: ReactNode;
  children?: ReactNode;
  isFullScreen?: boolean;
  className?: string;
}

const PageLayout = ({ title, description, icon, children, isFullScreen = false, className = '' }: PageLayoutProps) => {
  return (
    <main className={`relative h-full ${className}`}>
      <div className={`${isFullScreen ? 'px-8 py-6' : ''}`}>
        <div className="flex flex-col gap-2 mb-8">
          <div className="flex items-center gap-2 text-text-primary">
            {icon}
            <h1 className="text-lg font-semibold">{title}</h1>
          </div>
          {description && <p className="text-base text-text-secondary">{description}</p>}
        </div>
        {children}
      </div>
    </main>
  );
};

export default PageLayout;
