import { HTMLAttributes, forwardRef } from 'react';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'negative' | 'muted' | 'accent';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  pulse?: boolean;
}

const variantClasses: Record<BadgeVariant, string> = {
  success: 'bg-green/20 text-green',
  warning: 'bg-yellow/20 text-yellow',
  danger: 'bg-red/20 text-red',
  negative: 'bg-red/40 text-red border-2 border-red font-bold',
  muted: 'bg-overlay text-subtext',
  accent: 'bg-accentMuted text-accent',
};

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = 'muted', pulse = false, className = '', children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={`
          inline-flex items-center
          px-3 py-1
          text-xs font-semibold
          rounded-full
          ${variantClasses[variant]}
          ${pulse ? 'animate-pulse-alert' : ''}
          ${className}
        `}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export { Badge };
export type { BadgeProps, BadgeVariant };
