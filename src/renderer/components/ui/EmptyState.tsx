import { HTMLAttributes, forwardRef } from 'react';

interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  icon?: string;
  message: string;
}

const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ icon, message, className = '', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`
          flex flex-col items-center justify-center
          py-12 px-6
          text-center text-muted text-sm
          ${className}
        `}
        {...props}
      >
        {icon && (
          <span className="text-4xl mb-3 opacity-50">{icon}</span>
        )}
        <span>{message}</span>
      </div>
    );
  }
);

EmptyState.displayName = 'EmptyState';

export { EmptyState };
export type { EmptyStateProps };
