import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  /** Optional accent color for the header bar */
  accentColor?: 'cyan' | 'amber' | 'emerald' | 'red' | 'violet' | 'neutral' | 'teal';
}

/**
 * Reusable Modal Component
 *
 * Features:
 * - Backdrop click to close
 * - Escape key to close
 * - Focus trap
 * - Accent color bar at top
 */
export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // Focus modal when opened
  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop - does not close on click */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div
        ref={modalRef}
        tabIndex={-1}
        className="relative w-full max-w-md mx-4 bg-card rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          {children}
        </div>
      </div>
    </div>
  );
}

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  /** Optional details to show about the item being deleted */
  itemDetails?: {
    label: string;
    value: string;
  }[];
  confirmText?: string;
  variant?: 'danger' | 'warning';
  isLoading?: boolean;
}

/**
 * Confirmation Modal for delete/destructive actions
 * Uses same structure as Modal for consistency
 */
export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  itemDetails,
  confirmText = 'Confirm',
  variant = 'danger',
  isLoading = false,
}: ConfirmModalProps) {
  const buttonColors = {
    danger: 'text-red-600 hover:bg-muted',
    warning: 'text-amber-600 hover:bg-muted',
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      accentColor={variant === 'danger' ? 'red' : 'amber'}
    >
      <p className="text-sm text-muted-foreground mb-4">{message}</p>

      {/* Item Details */}
      {itemDetails && itemDetails.length > 0 && (
        <div className="mb-6 rounded-lg border border-border bg-secondary/50 dark:bg-secondary p-3 space-y-3">
          {itemDetails.map((detail, index) => (
            <div key={index} className="text-left">
              <div className="text-xs text-muted-foreground uppercase tracking-wide">{detail.label}</div>
              <div className="text-sm font-medium text-foreground">{detail.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end">
        <button
          onClick={onConfirm}
          disabled={isLoading}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors disabled:opacity-50 ${buttonColors[variant]}`}
        >
          {isLoading ? 'Deleting...' : confirmText}
        </button>
      </div>
    </Modal>
  );
}
