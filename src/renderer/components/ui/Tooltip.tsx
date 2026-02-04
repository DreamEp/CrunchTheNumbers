import { HTMLAttributes, forwardRef, useState, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps extends Omit<HTMLAttributes<HTMLDivElement>, 'content'> {
  content: React.ReactNode;
  children: React.ReactNode;
  disabled?: boolean;
}

const Tooltip = forwardRef<HTMLDivElement, TooltipProps>(
  ({ content, children, disabled = false, className = '', ...props }, ref) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isPositioned, setIsPositioned] = useState(false);
    const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({
      position: 'fixed',
      left: -9999,
      top: -9999,
      zIndex: 9999,
    });
    const [position, setPosition] = useState<'top' | 'bottom'>('top');
    const triggerRef = useRef<HTMLDivElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);

    // Use useLayoutEffect to calculate position before paint
    useLayoutEffect(() => {
      if (isVisible && triggerRef.current && tooltipRef.current) {
        const triggerRect = triggerRef.current.getBoundingClientRect();
        const tooltipHeight = tooltipRef.current.offsetHeight;
        const tooltipWidth = tooltipRef.current.offsetWidth;

        // Check if tooltip would go off the top of the screen
        const shouldShowBelow = triggerRect.top - tooltipHeight - 8 < 0;
        setPosition(shouldShowBelow ? 'bottom' : 'top');

        // Calculate position
        const left = triggerRect.left + triggerRect.width / 2 - tooltipWidth / 2;
        const top = shouldShowBelow
          ? triggerRect.bottom + 8
          : triggerRect.top - tooltipHeight - 8;

        // Adjust if tooltip goes off screen horizontally
        const adjustedLeft = Math.max(8, Math.min(left, window.innerWidth - tooltipWidth - 8));

        setTooltipStyle({
          position: 'fixed',
          left: adjustedLeft,
          top: top,
          zIndex: 9999,
        });

        setIsPositioned(true);
      } else if (!isVisible) {
        setIsPositioned(false);
        // Reset style to off-screen position for next hover
        setTooltipStyle({
          position: 'fixed',
          left: -9999,
          top: -9999,
          zIndex: 9999,
        });
      }
    }, [isVisible]);

    if (disabled || !content) {
      return <>{children}</>;
    }

    return (
      <div
        ref={ref}
        className={`relative inline-block ${className}`}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        {...props}
      >
        <div ref={triggerRef}>
          {children}
        </div>

        {isVisible && createPortal(
          <div
            ref={tooltipRef}
            style={{
              ...tooltipStyle,
              visibility: isPositioned ? 'visible' : 'hidden',
              opacity: isPositioned ? 1 : 0,
            }}
            className={`
              px-3 py-2
              bg-surface border border-border
              rounded-lg shadow-xl shadow-black/40
              text-xs text-text
              pointer-events-none
              transition-opacity duration-150
            `}
          >
            {content}
            {/* Arrow */}
            <div
              className={`
                absolute left-1/2 -translate-x-1/2
                w-2 h-2 bg-surface border-border rotate-45
                ${position === 'top'
                  ? 'bottom-0 translate-y-1/2 border-r border-b'
                  : 'top-0 -translate-y-1/2 border-l border-t'
                }
              `}
            />
          </div>,
          document.body
        )}
      </div>
    );
  }
);

Tooltip.displayName = 'Tooltip';

// Component for participant info tooltip content
interface ParticipantTooltipContentProps {
  email?: string;
  age?: number;
  notes?: string;
}

const ParticipantTooltipContent = ({ email, age, notes }: ParticipantTooltipContentProps) => {
  if (!email && !age && !notes) return null;

  return (
    <div className="flex flex-col gap-1 max-w-xs whitespace-normal">
      {email && (
        <div className="flex items-center gap-2">
          <span className="text-muted">📧</span>
          <span className="text-accent">{email}</span>
        </div>
      )}
      {age && (
        <div className="flex items-center gap-2">
          <span className="text-muted">Âge:</span>
          <span className="text-text">{age} ans</span>
        </div>
      )}
      {notes && (
        <div className="flex flex-col gap-0.5">
          <span className="text-muted">Notes:</span>
          <span className="text-subtext whitespace-pre-wrap">{notes}</span>
        </div>
      )}
    </div>
  );
};

export { Tooltip, ParticipantTooltipContent };
export type { TooltipProps, ParticipantTooltipContentProps };
