import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ToggleProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

const Toggle = forwardRef<HTMLButtonElement, ToggleProps>(
  ({ active = false, className = '', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        className={`
          inline-flex items-center gap-2
          px-3 py-1.5
          text-sm font-medium
          rounded-full
          border
          cursor-pointer
          transition-all duration-200
          ${
            active
              ? 'bg-accentMuted text-accent border-accent/30'
              : 'bg-overlay text-muted border-border hover:bg-surface hover:text-subtext hover:border-muted'
          }
          ${className}
        `}
        {...props}
      >
        <span
          className={`
            w-1.5 h-1.5 rounded-full
            transition-all duration-200
            ${active ? 'bg-accent shadow-[0_0_4px_rgba(148,226,213,0.5)]' : 'bg-muted'}
          `}
        />
        {children}
      </button>
    );
  }
);

Toggle.displayName = 'Toggle';

export { Toggle };
export type { ToggleProps };
