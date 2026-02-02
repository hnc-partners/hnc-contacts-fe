/**
 * Contacts Table Column Definitions
 *
 * TanStack Table column definitions for the DataTable component.
 * Uses a factory function to inject action callbacks from ContactsPage.
 */

import type { ColumnDef } from '@tanstack/react-table';
import type { Contact } from '../types';
import { ActionsDropdown } from './ActionsDropdown';
import { formatDate } from '@/lib/utils';

export interface ContactsColumnCallbacks {
  onView: (contact: Contact) => void;
  onEdit: (contact: Contact) => void;
  onCopy: (contact: Contact) => void;
  onDelete: (contact: Contact) => void;
  onToggleActive: (contact: Contact) => void;
  onGamingAccounts: (contact: Contact) => void;
  onDeals: (contact: Contact) => void;
}

export function createColumns(callbacks: ContactsColumnCallbacks): ColumnDef<Contact, unknown>[] {
  return [
    {
      accessorKey: 'displayName',
      header: 'Name',
      enableSorting: true,
      cell: ({ row }) => (
        <span className="whitespace-nowrap truncate max-w-[200px] text-sm font-medium text-foreground">
          {row.getValue('displayName')}
        </span>
      ),
    },
    {
      accessorKey: 'firstName',
      header: 'First Name',
      enableSorting: true,
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-sm text-muted-foreground">
          {row.original.personDetails?.firstName || '\u2014'}
        </span>
      ),
    },
    {
      accessorKey: 'lastName',
      header: 'Last Name',
      enableSorting: true,
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-sm text-muted-foreground">
          {row.original.personDetails?.lastName || '\u2014'}
        </span>
      ),
    },
    {
      accessorKey: 'joinDate',
      header: 'Join Date',
      enableSorting: true,
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-sm text-muted-foreground">
          {formatDate(row.original.joinDate) || '\u2014'}
        </span>
      ),
    },
    {
      id: 'balance',
      header: 'Balance',
      enableSorting: true,
      meta: { align: 'right' },
      cell: () => (
        <span className="text-sm text-muted-foreground">{'\u2014'}</span>
      ),
    },
    {
      id: 'actions',
      header: () => <span className="sr-only">Actions</span>,
      enableSorting: false,
      meta: { align: 'right' },
      cell: ({ row }) => (
        <div onClick={(e) => e.stopPropagation()}>
          <ActionsDropdown
            onView={() => callbacks.onView(row.original)}
            onEdit={() => callbacks.onEdit(row.original)}
            onCopy={() => callbacks.onCopy(row.original)}
            onDelete={() => callbacks.onDelete(row.original)}
            isActive={row.original.isActive}
            onToggleActive={() => callbacks.onToggleActive(row.original)}
            onGamingAccounts={() => callbacks.onGamingAccounts(row.original)}
            onDeals={() => callbacks.onDeals(row.original)}
          />
        </div>
      ),
    },
  ];
}
