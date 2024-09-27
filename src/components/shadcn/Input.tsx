import { cn } from '@/utils/Types';
import { FC, forwardRef, InputHTMLAttributes } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  startIcon?: FC<{ className?: string }>;
  endIcon?: FC<{ className?: string }>;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({ className, type, startIcon, endIcon, ...props }, ref) => {
  const StartIcon = startIcon;
  const EndIcon = endIcon;

  return (
    <div className="w-full relative">
      <input
        type={type}
        className={cn(
          'peer flex h-10 w-full rounded-md border border-input border-stroke-default bg-background py-2 px-4 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50',
          startIcon ? 'pl-8' : '',
          endIcon ? 'pr-8' : '',
          className,
        )}
        ref={ref}
        {...props}
      />
      {StartIcon && (
        <StartIcon className=" absolute left-1.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-default peer-focus:text-text-secondary" />
      )}
      {EndIcon && (
        <EndIcon className=" absolute right-1.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-default peer-focus:text-text-secondary" />
      )}
    </div>
  );
});
Input.displayName = 'Input';

export { Input };
