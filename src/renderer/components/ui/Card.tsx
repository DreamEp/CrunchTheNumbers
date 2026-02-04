import { HTMLAttributes, forwardRef } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  noPadding?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ noPadding = false, className = '', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`
          bg-surface rounded-xl border border-border
          shadow-sm shadow-black/10
          transition-all duration-200
          hover:border-muted hover:shadow-md hover:shadow-black/15
          ${noPadding ? '' : 'p-6'}
          ${className}
        `}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {}

const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className = '', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`
          px-6 py-4
          bg-overlay/50
          border-b border-border
          rounded-t-xl
          ${className}
        `}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardHeader.displayName = 'CardHeader';

interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  count?: number;
}

const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ count, className = '', children, ...props }, ref) => {
    return (
      <h3
        ref={ref}
        className={`font-semibold text-text flex items-center gap-2 ${className}`}
        {...props}
      >
        {children}
        {count !== undefined && (
          <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-overlay text-subtext">
            {count}
          </span>
        )}
      </h3>
    );
  }
);

CardTitle.displayName = 'CardTitle';

export { Card, CardHeader, CardTitle };
export type { CardProps, CardHeaderProps, CardTitleProps };
