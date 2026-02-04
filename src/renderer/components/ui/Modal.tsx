import { HTMLAttributes, forwardRef, useEffect } from 'react';

interface ModalProps extends HTMLAttributes<HTMLDivElement> {
  open: boolean;
  onClose?: () => void;
  maxWidth?: 'sm' | 'md' | 'lg';
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
};

const Modal = forwardRef<HTMLDivElement, ModalProps>(
  ({ open, onClose, maxWidth = 'md', className = '', children, ...props }, ref) => {
    useEffect(() => {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && onClose) {
          onClose();
        }
      };

      if (open) {
        document.addEventListener('keydown', handleEscape);
        document.body.style.overflow = 'hidden';
      }

      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = '';
      };
    }, [open, onClose]);

    if (!open) return null;

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget && onClose) {
            onClose();
          }
        }}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

        {/* Content */}
        <div
          ref={ref}
          className={`
            relative
            w-full ${maxWidthClasses[maxWidth]}
            bg-surface border border-border rounded-2xl
            p-6
            shadow-2xl shadow-black/50
            animate-in fade-in zoom-in-95 duration-200
            ${className}
          `}
          {...props}
        >
          {children}
        </div>
      </div>
    );
  }
);

Modal.displayName = 'Modal';

interface ModalTitleProps extends HTMLAttributes<HTMLHeadingElement> {}

const ModalTitle = forwardRef<HTMLHeadingElement, ModalTitleProps>(
  ({ className = '', children, ...props }, ref) => {
    return (
      <h3
        ref={ref}
        className={`text-lg font-semibold text-text mb-4 ${className}`}
        {...props}
      >
        {children}
      </h3>
    );
  }
);

ModalTitle.displayName = 'ModalTitle';

interface ModalDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {}

const ModalDescription = forwardRef<HTMLParagraphElement, ModalDescriptionProps>(
  ({ className = '', children, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={`text-subtext mb-6 ${className}`}
        {...props}
      >
        {children}
      </p>
    );
  }
);

ModalDescription.displayName = 'ModalDescription';

interface ModalActionsProps extends HTMLAttributes<HTMLDivElement> {}

const ModalActions = forwardRef<HTMLDivElement, ModalActionsProps>(
  ({ className = '', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`flex justify-end gap-3 mt-6 ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

ModalActions.displayName = 'ModalActions';

export { Modal, ModalTitle, ModalDescription, ModalActions };
export type { ModalProps, ModalTitleProps, ModalDescriptionProps, ModalActionsProps };
