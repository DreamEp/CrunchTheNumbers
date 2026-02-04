import { HTMLAttributes, ButtonHTMLAttributes, forwardRef } from 'react';

interface TabsProps extends HTMLAttributes<HTMLDivElement> {}

const Tabs = forwardRef<HTMLDivElement, TabsProps>(
  ({ className = '', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`
          inline-flex gap-0.5
          p-1
          bg-overlay rounded-xl
          border border-border
          ${className}
        `}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Tabs.displayName = 'Tabs';

interface TabProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

const Tab = forwardRef<HTMLButtonElement, TabProps>(
  ({ active = false, className = '', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        className={`
          px-3.5 py-2
          text-sm font-medium
          rounded-lg
          whitespace-nowrap
          transition-all duration-200
          ${
            active
              ? 'bg-accent text-base font-semibold'
              : 'text-muted hover:text-text hover:bg-surface'
          }
          ${className}
        `}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Tab.displayName = 'Tab';

interface SubTabsProps extends HTMLAttributes<HTMLDivElement> {}

const SubTabs = forwardRef<HTMLDivElement, SubTabsProps>(
  ({ className = '', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`flex flex-wrap gap-2 ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

SubTabs.displayName = 'SubTabs';

interface SubTabProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

const SubTab = forwardRef<HTMLButtonElement, SubTabProps>(
  ({ active = false, className = '', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        className={`
          px-3.5 py-2
          text-sm font-medium
          rounded-lg
          border
          whitespace-nowrap
          transition-all duration-200
          ${
            active
              ? 'text-accent bg-accentMuted border-accent/30'
              : 'text-subtext bg-transparent border-border hover:text-text hover:bg-surface hover:border-muted'
          }
          ${className}
        `}
        {...props}
      >
        {children}
      </button>
    );
  }
);

SubTab.displayName = 'SubTab';

export { Tabs, Tab, SubTabs, SubTab };
export type { TabsProps, TabProps, SubTabsProps, SubTabProps };
