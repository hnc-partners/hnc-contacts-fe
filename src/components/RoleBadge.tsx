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
    bg: 'bg-blue-100 dark:bg-blue-900/50',
    text: 'text-blue-600 dark:text-blue-400',
  },
  partner: {
    label: 'Partner',
    icon: Handshake,
    bg: 'bg-green-100 dark:bg-green-900/50',
    text: 'text-green-600 dark:text-green-400',
  },
  hnc_member: {
    label: 'HNC Member',
    icon: Briefcase,
    bg: 'bg-amber-100 dark:bg-amber-900/50',
    text: 'text-amber-600 dark:text-amber-400',
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
