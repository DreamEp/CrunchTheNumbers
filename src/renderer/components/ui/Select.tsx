import { SelectHTMLAttributes, forwardRef } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={`
          w-full
          bg-overlay border border-border rounded-lg
          px-4 py-2.5 pr-10
          text-sm text-text
          cursor-pointer
          appearance-none
          bg-[url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236c7086' d='M6 8L1 3h10z'/%3E%3C/svg%3E")]
          bg-no-repeat bg-[right_0.75rem_center]
          transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent
          disabled:opacity-50 disabled:cursor-not-allowed
          ${className}
        `}
        {...props}
      >
        {children}
      </select>
    );
  }
);

Select.displayName = 'Select';

export { Select };
export type { SelectProps };
