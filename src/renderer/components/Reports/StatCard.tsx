import { HTMLAttributes, forwardRef, ReactNode } from 'react';
import { Tooltip } from '../ui';

type StatVariant = 'default' | 'cancelled' | 'vacation' | 'sick' | 'success' | 'revenue' | 'accent' | 'warning';

interface StatCardProps extends HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string | number;
  icon?: ReactNode;
  variant?: StatVariant;
  tooltip?: ReactNode;
  tooltipDisabled?: boolean;
}

const variantClasses: Record<StatVariant, string> = {
  default: 'text-accent',
  cancelled: 'text-red',
  vacation: 'text-peach',
  sick: 'text-yellow',
  success: 'text-green',
  revenue: 'text-accent',
  accent: 'text-blue',
  warning: 'text-yellow',
};

const StatCard = forwardRef<HTMLDivElement, StatCardProps>(
  ({ label, value, icon, variant = 'default', tooltip, tooltipDisabled = false, className = '', ...props }, ref) => {
    const showTooltipStyle = tooltip && !tooltipDisabled;
    const content = (
      <div
        ref={ref}
        className={`
          bg-overlay rounded-lg p-4
          flex flex-col items-center justify-center
          min-w-[120px]
          ${showTooltipStyle ? 'cursor-help' : ''}
          ${className}
        `}
        {...props}
      >
        {icon && <div className="text-2xl mb-1">{icon}</div>}
        <div className={`text-2xl font-bold ${variantClasses[variant]}`}>
          {value}
        </div>
        <div className={`text-xs text-subtext text-center mt-1 ${showTooltipStyle ? 'border-b border-dotted border-muted' : ''}`}>
          {label}
        </div>
      </div>
    );

    if (tooltip) {
      return <Tooltip content={tooltip} disabled={tooltipDisabled}>{content}</Tooltip>;
    }

    return content;
  }
);

StatCard.displayName = 'StatCard';

export { StatCard };
export type { StatCardProps, StatVariant };
