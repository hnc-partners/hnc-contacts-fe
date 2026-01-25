/**
 * ActionsDropdown Component
 *
 * Row actions dropdown menu for contacts table.
 */

import { toast } from 'sonner';
import { MoreVertical, Copy, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';

interface ActionsDropdownProps {
  onView: () => void;
  onCopy: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
  isActive: boolean;
  onGamingAccounts: () => void;
  onDeals: () => void;
}

export function ActionsDropdown({
  onView,
  onCopy,
  onEdit,
  onDelete,
  onToggleActive,
  isActive,
  onGamingAccounts,
  onDeals,
}: ActionsDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          onClick={(e) => e.stopPropagation()}
          className="p-2 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Contact Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={onView}>View Profile</DropdownMenuItem>
          <DropdownMenuItem onSelect={onEdit}>Edit Details</DropdownMenuItem>
          <DropdownMenuItem onSelect={onCopy}>
            <Copy className="mr-2 h-4 w-4" />
            Copy
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Gaming Accounts</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onSelect={onGamingAccounts}>View All</DropdownMenuItem>
              <DropdownMenuItem onSelect={onGamingAccounts}>Add New</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Deals</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onSelect={onDeals}>Manage Deals</DropdownMenuItem>
              <DropdownMenuItem onSelect={onDeals}>Add Deal</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => toast.info('Transaction History - coming soon')}>
          Transaction History
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => toast.info('Commission Report - coming soon')}>
          Commission Report
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={onToggleActive}
          className={isActive ? 'text-orange-600' : 'text-green-600'}
        >
          {isActive ? 'Deactivate' : 'Activate'}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onDelete} className="text-destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
