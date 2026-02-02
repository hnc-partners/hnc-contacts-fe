import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
} from '@hnc-partners/ui-components';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  /** Optional accent color for the header bar */
  accentColor?: 'cyan' | 'amber' | 'emerald' | 'red' | 'violet' | 'neutral' | 'teal';
  /** Modal width size */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

const SIZE_CLASSES: Record<NonNullable<ModalProps['size']>, string> = {
  xs: 'sm:max-w-[360px]',
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
  xl: 'sm:max-w-xl',
};

/**
 * Reusable Modal Component
 *
 * Now uses Radix Dialog from ui-components for proper accessibility,
 * keyboard handling, and focus management.
 */
export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={SIZE_CLASSES[size]}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
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
 * Uses Dialog from ui-components for proper accessibility.
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
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[360px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{message}</DialogDescription>
        </DialogHeader>

        {/* Item Details */}
        {itemDetails && itemDetails.length > 0 && (
          <div className="rounded-lg border border-border bg-secondary/50 dark:bg-secondary p-3 space-y-3">
            {itemDetails.map((detail, index) => (
              <div key={index} className="text-left">
                <div className="text-xs text-muted-foreground uppercase tracking-wide">
                  {detail.label}
                </div>
                <div className="text-sm font-medium text-foreground">
                  {detail.value}
                </div>
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button
            variant={variant === 'danger' ? 'destructive' : 'ghost'}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Deleting...' : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
