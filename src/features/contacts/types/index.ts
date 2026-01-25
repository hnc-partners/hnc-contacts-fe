/**
 * Contacts Feature Types
 *
 * Re-exports from central types plus feature-specific types.
 */

// Re-export all types from the central types file
export * from '@/types/contacts';

// ===== FEATURE-SPECIFIC TYPES =====

// Side Panel Tab Type
export type SidePanelTab = 'details' | 'gaming-accounts' | 'deals' | 'status' | 'notes';

// Sort Types
export type SortField = 'displayName' | null;
export type SortDirection = 'asc' | 'desc';

// Filter Options
export interface FilterOption {
  value: string;
  label: string;
}

// ===== CONSTANTS =====

// Status options for filtering
export const STATUS_OPTIONS: FilterOption[] = [
  { value: '', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

// Type options for filtering
export const TYPE_OPTIONS: FilterOption[] = [
  { value: '', label: 'All Types' },
  { value: 'person', label: 'Person' },
  { value: 'organization', label: 'Organization' },
];

// Join Date filter options
export const JOIN_DATE_OPTIONS: FilterOption[] = [
  { value: '', label: 'All' },
  { value: 'last_30_days', label: 'Last 30 Days' },
  { value: 'last_90_days', label: 'Last 90 Days' },
  { value: 'this_year', label: 'This Year' },
  { value: 'last_year', label: 'Last Year' },
];

// Rows per page options
export const ROWS_PER_PAGE_OPTIONS = [10, 20, 50];
