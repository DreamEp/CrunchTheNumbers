import { HTMLAttributes, forwardRef } from 'react';

interface SectionHeaderProps extends HTMLAttributes<HTMLDivElement> {
  icon?: string;
  title: string;
}

const SectionHeader = forwardRef<HTMLDivElement, SectionHeaderProps>(
  ({ icon, title, className = '', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`flex items-center gap-2.5 mb-6 ${className}`}
        {...props}
      >
        {icon && <span className="text-lg">{icon}</span>}
        <h2 className="text-base font-semibold text-text">{title}</h2>
      </div>
    );
  }
);

SectionHeader.displayName = 'SectionHeader';

export { SectionHeader };
export type { SectionHeaderProps };
