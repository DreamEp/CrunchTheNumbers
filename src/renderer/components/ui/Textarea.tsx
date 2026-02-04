import { TextareaHTMLAttributes, forwardRef } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={`
          w-full
          bg-overlay border border-border rounded-lg
          px-4 py-2.5
          text-sm text-text
          placeholder:text-muted
          transition-all duration-200
          resize-y min-h-[80px]
          focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent
          disabled:opacity-50 disabled:cursor-not-allowed
          ${className}
        `}
        {...props}
      />
    );
  }
);

Textarea.displayName = 'Textarea';

export { Textarea };
export type { TextareaProps };
