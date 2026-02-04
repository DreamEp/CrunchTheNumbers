import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`
          w-full
          bg-overlay border border-border rounded-lg
          px-4 py-2.5
          text-sm text-text
          placeholder:text-muted
          transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent
          disabled:opacity-50 disabled:cursor-not-allowed
          ${className}
        `}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ className = '', children, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={`
          block text-xs font-medium text-subtext mb-1.5
          ${className}
        `}
        {...props}
      >
        {children}
      </label>
    );
  }
);

Label.displayName = 'Label';

interface FormGroupProps extends React.HTMLAttributes<HTMLDivElement> {}

const FormGroup = forwardRef<HTMLDivElement, FormGroupProps>(
  ({ className = '', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`flex flex-col ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

FormGroup.displayName = 'FormGroup';

export { Input, Label, FormGroup };
export type { InputProps, LabelProps, FormGroupProps };
