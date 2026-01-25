/**
 * StatusBadge Component
 *
 * Displays contact active/inactive status with icon and color.
 */

import { Check, X } from 'lucide-react';
import type { ContactStatus } from '../types';
import { STATUS_COLORS } from '@/types/contacts';

interface StatusBadgeProps {
  status: ContactStatus;
}

const STATUS_ICONS: Record<ContactStatus, React.ReactNode> = {
  active: <Check className="h-3.5 w-3.5" />,
  inactive: <X className="h-3.5 w-3.5" />,
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const colors = STATUS_COLORS[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${colors.text}`}>
      {STATUS_ICONS[status]}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
