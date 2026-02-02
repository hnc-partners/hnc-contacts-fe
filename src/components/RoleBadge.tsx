import { Gamepad2, Handshake, Briefcase } from 'lucide-react';
import type { RoleType } from '@/types/contacts';

interface RoleBadgeProps {
  type: RoleType;
  size?: 'sm' | 'md';
}

const ROLE_CONFIG: Record<RoleType, {
  label: string;
  icon: typeof Gamepad2;
  bg: string;
  text: string;
}> = {
  player: {
    label: 'Player',
    icon: Gamepad2,
    bg: 'bg-info/15 dark:bg-info/20',
    text: 'text-info',
  },
  partner: {
    label: 'Partner',
    icon: Handshake,
    bg: 'bg-success/15 dark:bg-success/20',
    text: 'text-success',
  },
  hnc_member: {
    label: 'HNC Member',
    icon: Briefcase,
    bg: 'bg-warning/15 dark:bg-warning/20',
    text: 'text-warning',
  },
};

export function RoleBadge({ type, size = 'md' }: RoleBadgeProps) {
  const config = ROLE_CONFIG[type];
  const Icon = config.icon;
  const sizeClasses = size === 'sm'
    ? 'px-2 py-0.5 text-xs gap-1'
    : 'px-2.5 py-1 text-sm gap-1.5';
  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';

  return (
    <span className={`inline-flex items-center ${sizeClasses} rounded-full font-medium ${config.bg} ${config.text}`}>
      <Icon className={iconSize} />
      {config.label}
    </span>
  );
}
