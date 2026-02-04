/**
 * ContactsPage Component
 *
 * Main page orchestrator for contacts management.
 * Handles list view, side panel, modals, and all UI state.
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  DataTable,
  FilterDropdown,
  EmptyState,
  ErrorState,
  PageToolbar,
  useResizeObserver,
  useResponsiveColumns,
  useKeyboardNavigation,
  usePanelResize,
  PANEL_DEFAULTS,
  type SortingState,
  type ColumnBreakpoint,
} from '@hnc-partners/ui-components';
// Note: No Layout import - shell provides the layout when used as MF
import { contactsApi } from '../api/contacts-api';
import { getJoinDateRange } from '@/lib/utils';
import {
  Loader2,
  Users,
  Home,
  Plus,
} from 'lucide-react';

import { createColumns } from './columns';
import { SidePanel } from './SidePanel';
import { DeleteContactModal } from './DeleteContactModal';
import { ContactFormModal } from './forms/ContactFormModal';
import {
  useContacts,
  useContact,
  useCreateContact,
  useUpdateContact,
  useDeleteContact,
  contactsKeys,
} from '../hooks/use-contacts';
import type {
  Contact,
  ContactWithDetails,
  ContactType,
  ContactStatus,
  CreateContactDto,
  UpdateContactDto,
  SidePanelTab,
  SortField,
  SortDirection,
} from '../types';
import {
  STATUS_OPTIONS,
  TYPE_OPTIONS,
  JOIN_DATE_OPTIONS,
} from '../types';

// Responsive column breakpoints for contacts table
const CONTACTS_COLUMN_BREAKPOINTS: ColumnBreakpoint[] = [
  { maxWidth: 700, columns: ['balance'] },
  { maxWidth: 600, columns: ['joinDate'] },
  { maxWidth: 500, columns: ['actions'] },
  { maxWidth: 400, columns: ['lastName'] },
  { maxWidth: 300, columns: ['firstName'] },
];

export function ContactsPage() {
  const queryClient = useQueryClient();

  // UI State
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [selectedContactDetails, setSelectedContactDetails] =
    useState<ContactWithDetails | null>(null);
  const [sidePanelTab, setSidePanelTab] = useState<SidePanelTab>('details');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<ContactWithDetails | null>(null);
  const [deletingContact, setDeletingContact] = useState<Contact | null>(null);

  // Filter/Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<ContactStatus | ''>('');
  const [filterType, setFilterType] = useState<ContactType | ''>('');
  const [joinDateFilter, setJoinDateFilter] = useState('');
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  // Pagination State
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [resetPageTrigger, setResetPageTrigger] = useState(0);

  // Sorting State
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Side panel width state for resizing
  const [sidePanelWidth, setSidePanelWidth] = useState<number>(PANEL_DEFAULTS.defaultWidth);
  const { handleMouseDown } = usePanelResize({
    setWidth: setSidePanelWidth,
    minWidth: PANEL_DEFAULTS.minWidth,
    maxWidth: PANEL_DEFAULTS.maxWidth,
  });

  const contentRef = useRef<HTMLDivElement>(null);

  // Compute join date range from filter value
  const joinDateRange = useMemo(() => getJoinDateRange(joinDateFilter), [joinDateFilter]);

  // Query hooks
  const { data: contactsResponse, isLoading, error } = useContacts({
    isActive:
      filterStatus === 'active' ? true : filterStatus === 'inactive' ? false : undefined,
    contactType: filterType || undefined,
    search: searchQuery || undefined,
    limit: 100,
    ...joinDateRange,
  });

  const { data: contactDetails, isLoading: isDetailsLoading } = useContact(
    selectedContact?.id
  );

  // Mutations
  const createContactMutation = useCreateContact({
    onSuccess: () => setIsCreateModalOpen(false),
  });

  const updateContactMutation = useUpdateContact({
    onSuccess: () => {
      if (editingContact) {
        queryClient.invalidateQueries({
          queryKey: contactsKeys.detail(editingContact.id),
        });
      }
      setEditingContact(null);
    },
  });

  const deleteContactMutation = useDeleteContact({
    onSuccess: () => {
      setDeletingContact(null);
      setSelectedContact(null);
      setSelectedContactDetails(null);
    },
  });

  // Sync contact details from query
  useEffect(() => {
    if (contactDetails) {
      setSelectedContactDetails(contactDetails);
    }
  }, [contactDetails]);

  // Track table container width for responsive column visibility
  const containerWidth = useResizeObserver(contentRef);

  // Responsive column visibility based on container width
  const columnVisibility = useResponsiveColumns(containerWidth, CONTACTS_COLUMN_BREAKPOINTS);

  // Memoized column definitions with callbacks
  const tableColumns = useMemo(() => createColumns({
    onView: (contact) => {
      setSidePanelTab('details');
      setSelectedContact(contact);
      setSelectedContactDetails(null);
    },
    onEdit: (contact) => handleOpenEditModal(contact),
    onCopy: async (contact) => {
      try {
        await navigator.clipboard.writeText(contact.displayName);
        toast.success('Name copied to clipboard');
      } catch {
        const textarea = document.createElement('textarea');
        textarea.value = contact.displayName;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        toast.success('Name copied to clipboard');
      }
    },
    onDelete: (contact) => setDeletingContact(contact),
  }), []);  // Empty deps - callbacks use closures over state setters which are stable

  // Handlers
  const handleCreateContact = (data: CreateContactDto | UpdateContactDto) => {
    createContactMutation.mutate(data as CreateContactDto);
  };

  const handleUpdateContact = (data: CreateContactDto | UpdateContactDto) => {
    if (editingContact) {
      updateContactMutation.mutate({
        id: editingContact.id,
        data: data as UpdateContactDto,
      });
    }
  };

  const handleDeleteConfirm = () => {
    if (deletingContact) {
      deleteContactMutation.mutate(deletingContact.id);
    }
  };

  const handleOpenEditModal = async (contact: Contact) => {
    if (selectedContactDetails && selectedContactDetails.id === contact.id) {
      setEditingContact(selectedContactDetails);
    } else {
      try {
        const details = await contactsApi.getById(contact.id);
        setEditingContact(details);
      } catch (error) {
        toast.error(`Failed to load contact details: ${(error as Error).message}`);
      }
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilterStatus('');
    setFilterType('');
    setJoinDateFilter('');
    setResetPageTrigger(p => p + 1);
  };

  const hasActiveFilters = searchQuery || filterStatus || filterType || joinDateFilter;

  // Client-side isActive filter as workaround for API boolean coercion bug
  const rawContacts = contactsResponse?.data || [];
  const filteredContacts = filterStatus
    ? rawContacts.filter((c) =>
        filterStatus === 'active' ? c.isActive : !c.isActive
      )
    : rawContacts;

  // Client-side sorting
  const allContacts = [...filteredContacts].sort((a, b) => {
    if (!sortField) return 0;

    let aValue: string;
    let bValue: string;

    switch (sortField) {
      case 'firstName':
        aValue = (a.personDetails?.firstName ?? '').toLowerCase();
        bValue = (b.personDetails?.firstName ?? '').toLowerCase();
        break;
      case 'lastName':
        aValue = (a.personDetails?.lastName ?? '').toLowerCase();
        bValue = (b.personDetails?.lastName ?? '').toLowerCase();
        break;
      case 'joinDate':
        // Compare as ISO date strings (lexicographic works for ISO dates)
        aValue = a.joinDate ?? '';
        bValue = b.joinDate ?? '';
        break;
      case 'displayName':
      default:
        aValue = (a.displayName ?? '').toLowerCase();
        bValue = (b.displayName ?? '').toLowerCase();
        break;
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Keyboard navigation
  useKeyboardNavigation({
    selectedItem: selectedContact,
    items: allContacts,
    onSelect: (contact) => {
      setSelectedContact(contact);
      setSelectedContactDetails(null);
    },
    onEscape: () => {
      setSelectedContact(null);
      setSelectedContactDetails(null);
    },
    getId: (c) => c.id,
  });

  // Note: No Layout wrapper - shell provides the layout when used as MF
  return (
    <>
      <div className="flex flex-col h-full w-full overflow-hidden">
        {/* Page Header - OUTSIDE the flex row so panel aligns with filter bar */}
        <div className="px-4 sm:px-6 lg:px-8 pt-6">
          {/* Header Row - Title and Add Button */}
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-semibold text-foreground">Contacts</h1>
            <Button
              size="sm"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Add Contact
            </Button>
          </div>

          {/* Breadcrumb */}
          <Breadcrumb className="mb-4">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">
                  <Home className="h-4 w-4" />
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Contacts</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Content Row - Filter/Table + Side Panel (panel aligns with filter bar) */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Main Content */}
          <div
            ref={contentRef}
            className="flex-1 min-w-0 flex flex-col overflow-hidden transition-all duration-300"
          >
            <div className="px-4 sm:px-6 lg:px-8 pb-6 overflow-y-auto flex-1">
            <PageToolbar
              searchValue={searchQuery}
              onSearchChange={(v) => {
                setSearchQuery(v);
                setResetPageTrigger(p => p + 1);
              }}
              filtersExpanded={filtersExpanded}
              onToggleFilters={() => setFiltersExpanded(!filtersExpanded)}
              activeFilterCount={
                (filterStatus ? 1 : 0) +
                (filterType ? 1 : 0) +
                (joinDateFilter ? 1 : 0)
              }
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(v) => {
                setRowsPerPage(v);
                setResetPageTrigger(p => p + 1);
              }}
              onClearFilters={clearFilters}
              filters={
                <>
                  <FilterDropdown
                    label="Type"
                    value={filterType}
                    options={TYPE_OPTIONS}
                    onChange={(v) => {
                      setFilterType(v as ContactType | '');
                      setResetPageTrigger(p => p + 1);
                    }}
                  />
                  <FilterDropdown
                    label="Status"
                    value={filterStatus}
                    options={STATUS_OPTIONS}
                    onChange={(v) => {
                      setFilterStatus(v as ContactStatus | '');
                      setResetPageTrigger(p => p + 1);
                    }}
                  />
                  <FilterDropdown
                    label="Join Date"
                    value={joinDateFilter}
                    options={JOIN_DATE_OPTIONS}
                    onChange={(v) => {
                      setJoinDateFilter(v);
                      setResetPageTrigger(p => p + 1);
                    }}
                  />
                </>
              }
            />

            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}

            {/* Error State */}
            {error && (
              <ErrorState
                message={`Error loading contacts: ${(error as Error).message}`}
                onRetry={() => window.location.reload()}
              />
            )}

            {/* Empty State */}
            {!isLoading && !error && allContacts.length === 0 && (
              <EmptyState
                icon={Users}
                title="No contacts found"
                description={
                  hasActiveFilters
                    ? 'No contacts match your search or filters. Try adjusting them.'
                    : 'Get started by creating your first contact.'
                }
                action={
                  hasActiveFilters ? (
                    <Button
                      variant="link"
                      onClick={clearFilters}
                    >
                      Clear filters
                    </Button>
                  ) : (
                    <Button onClick={() => setIsCreateModalOpen(true)}>
                      <Plus className="h-4 w-4" />
                      Add Contact
                    </Button>
                  )
                }
              />
            )}

            {/* Contacts Table */}
            {!isLoading && !error && allContacts.length > 0 && (
                <DataTable
                  columns={tableColumns}
                  data={allContacts}
                  manualSorting
                  sorting={sortField ? [{ id: sortField, desc: sortDirection === 'desc' }] : []}
                  onSortingChange={(newSorting: SortingState) => {
                    if (newSorting.length === 0) {
                      setSortField(null);
                    } else {
                      setSortField(newSorting[0].id as SortField);
                      setSortDirection(newSorting[0].desc ? 'desc' : 'asc');
                    }
                    setResetPageTrigger(p => p + 1);
                  }}
                  columnVisibility={columnVisibility}
                  selectedRowId={selectedContact?.id ?? null}
                  rowClassName={(contact) =>
                    selectedContact?.id === contact.id
                      ? 'bg-mf-accent/10'
                      : 'bg-muted/30'
                  }
                  onRowClick={(contact) => {
                    if (selectedContact?.id === contact.id) {
                      setSelectedContact(null);
                      setSelectedContactDetails(null);
                    } else {
                      setSidePanelTab('details');
                      setSelectedContact(contact);
                      setSelectedContactDetails(null);
                    }
                  }}
                  pagination
                  paginationStyle="compact"
                  pageSize={rowsPerPage}
                  resetPageDep={resetPageTrigger}
                  sortable
                  searchable={false}
                  loading={false}
                />
            )}
            </div>
          </div>

          {/* Side Panel Container - Always rendered for animation, width animates */}
          <div
            className="flex-shrink-0 transition-all duration-300 ease-out"
            style={{ width: selectedContact ? sidePanelWidth : 0 }}
          >
            {selectedContact && (
              <div
                className="relative bg-background shadow-panel flex h-full"
                style={{ width: sidePanelWidth }}
              >
                {/* Resize Handle */}
                <div
                  onMouseDown={handleMouseDown}
                  className="absolute left-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-border active:bg-border transition-colors group flex items-center justify-center z-10"
                >
                </div>
                {/* Panel Content */}
                <div className="flex-1 flex flex-col overflow-hidden">
                  <SidePanel
                    contact={selectedContact}
                    contactDetails={selectedContactDetails}
                    isLoading={isDetailsLoading}
                    activeTab={sidePanelTab}
                    onTabChange={setSidePanelTab}
                    onClose={() => {
                      setSelectedContact(null);
                      setSelectedContactDetails(null);
                    }}
                    onEdit={() => {
                      if (selectedContactDetails) {
                        setEditingContact(selectedContactDetails);
                      }
                    }}
                    onDelete={() => {
                      setDeletingContact(selectedContact);
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Contact Modal */}
      <ContactFormModal
        mode="create"
        isOpen={isCreateModalOpen}
        isSubmitting={createContactMutation.isPending}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateContact}
      />

      {/* Edit Contact Modal */}
      <ContactFormModal
        mode="edit"
        isOpen={editingContact !== null}
        contact={editingContact}
        isSubmitting={updateContactMutation.isPending}
        onClose={() => setEditingContact(null)}
        onSubmit={handleUpdateContact}
      />

      {/* Delete Contact Confirmation Modal */}
      <DeleteContactModal
        contact={deletingContact}
        isOpen={!!deletingContact}
        isLoading={deleteContactMutation.isPending}
        onClose={() => setDeletingContact(null)}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}

export default ContactsPage;
