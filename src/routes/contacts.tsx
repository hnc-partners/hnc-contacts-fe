import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Layout } from '@/components/Layout';
import { Modal, ConfirmModal } from '@/components/Modal';
import { ContactForm } from '@/components/ContactForm';
import { RoleBadge } from '@/components/RoleBadge';
import { RoleForm } from '@/components/RoleForm';
import { FilterDropdown } from '@/components/FilterDropdown';
import { contactsApi, rolesApi } from '@/services/contacts-api';
import type { Contact, ContactWithDetails, ContactType, ContactStatus, CreateContactDto, UpdateContactDto, RoleType, Player, Partner, HncMember, CreatePlayerDto, CreatePartnerDto, CreateHncMemberDto, UpdatePlayerDto, UpdatePartnerDto, UpdateHncMemberDto } from '@/types/contacts';
import { STATUS_COLORS } from '@/types/contacts';
import {
  Loader2,
  Users,
  MoreVertical,
  Copy,
  Pencil,
  Trash2,
  X,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
  SlidersHorizontal,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Check,
  User,
  Building2,
  GripVertical,
  Home,
  Plus,
} from 'lucide-react';
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

// Status options for filtering
const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

// Type options for filtering
const TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'All Types' },
  { value: 'person', label: 'Person' },
  { value: 'organization', label: 'Organization' },
];

// Rows per page options
const ROWS_PER_PAGE_OPTIONS = [10, 20, 50];

export const Route = createFileRoute('/contacts')({
  component: ContactsPage,
});

/**
 * Contacts Page
 *
 * Manage contacts - list with side panel details, search, filters.
 * Design per FES-01.
 */
function ContactsPage() {
  const queryClient = useQueryClient();

  // UI State
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [selectedContactDetails, setSelectedContactDetails] = useState<ContactWithDetails | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<ContactWithDetails | null>(null);
  const [deletingContact, setDeletingContact] = useState<Contact | null>(null);

  // Filter/Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<ContactStatus | ''>('');
  const [filterType, setFilterType] = useState<ContactType | ''>('');
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Sorting State
  type SortField = 'displayName' | null;
  type SortDirection = 'asc' | 'desc';
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  // Fetch contacts
  const { data: contactsResponse, isLoading, error } = useQuery({
    queryKey: ['contacts', filterStatus, filterType, searchQuery],
    queryFn: () => contactsApi.getAll({
      isActive: filterStatus === 'active' ? true : filterStatus === 'inactive' ? false : undefined,
      contactType: filterType || undefined,
      search: searchQuery || undefined,
      limit: 500,
    }),
  });

  // Fetch contact details when a contact is selected
  const { data: contactDetails, isLoading: isDetailsLoading } = useQuery({
    queryKey: ['contact', selectedContact?.id],
    queryFn: () => selectedContact ? contactsApi.getById(selectedContact.id) : null,
    enabled: !!selectedContact,
  });

  useEffect(() => {
    if (contactDetails) {
      setSelectedContactDetails(contactDetails);
    }
  }, [contactDetails]);

  // Create contact mutation
  const createContactMutation = useMutation({
    mutationFn: (data: CreateContactDto) => contactsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      setIsCreateModalOpen(false);
      toast.success('Contact created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create contact: ${error.message}`);
    },
  });

  const handleCreateContact = (data: CreateContactDto | UpdateContactDto) => {
    // In create mode, data will always have contactType
    createContactMutation.mutate(data as CreateContactDto);
  };

  // Update contact mutation
  const updateContactMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateContactDto }) => contactsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      // Also invalidate the specific contact query to refresh side panel
      if (editingContact) {
        queryClient.invalidateQueries({ queryKey: ['contact', editingContact.id] });
      }
      setEditingContact(null);
      toast.success('Contact updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update contact: ${error.message}`);
    },
  });

  const handleUpdateContact = (data: CreateContactDto | UpdateContactDto) => {
    if (editingContact) {
      updateContactMutation.mutate({ id: editingContact.id, data: data as UpdateContactDto });
    }
  };

  // Delete contact mutation
  const deleteContactMutation = useMutation({
    mutationFn: (id: string) => contactsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      setDeletingContact(null);
      setSelectedContact(null);
      setSelectedContactDetails(null);
      toast.success('Contact deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete contact: ${error.message}`);
    },
  });

  const handleDeleteConfirm = () => {
    if (deletingContact) {
      deleteContactMutation.mutate(deletingContact.id);
    }
  };

  // Open edit modal - use existing details if available, otherwise fetch
  const handleOpenEditModal = async (contact: Contact) => {
    // If we already have full details from the side panel, use them
    if (selectedContactDetails && selectedContactDetails.id === contact.id) {
      setEditingContact(selectedContactDetails);
    } else {
      // Otherwise, fetch the contact details first
      try {
        const details = await contactsApi.getById(contact.id);
        setEditingContact(details);
      } catch (error) {
        toast.error(`Failed to load contact details: ${(error as Error).message}`);
      }
    }
  };

  // Client-side isActive filter as workaround for API boolean coercion bug
  // (API treats "false" string as true). Safe to remove once API is redeployed.
  const rawContacts = contactsResponse?.data || [];
  const filteredContacts = filterStatus
    ? rawContacts.filter(c => filterStatus === 'active' ? c.isActive : !c.isActive)
    : rawContacts;

  // Client-side sorting
  const allContacts = [...filteredContacts].sort((a, b) => {
    if (!sortField) return 0;
    let aValue: string | boolean = a[sortField] ?? '';
    let bValue: string | boolean = b[sortField] ?? '';
    if (typeof aValue === 'string') aValue = aValue.toLowerCase();
    if (typeof bValue === 'string') bValue = bValue.toLowerCase();
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Client-side pagination
  const totalItems = allContacts.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, totalItems);
  const paginatedContacts = allContacts.slice(startIndex, endIndex);

  const clearFilters = () => {
    setSearchQuery('');
    setFilterStatus('');
    setFilterType('');
    setCurrentPage(1);
  };

  const hasActiveFilters = searchQuery || filterStatus || filterType;

  // Keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Escape - close side panel
    if (e.key === 'Escape' && selectedContact) {
      setSelectedContact(null);
      setSelectedContactDetails(null);
      return;
    }

    // Arrow keys - navigate between rows (only when side panel is open)
    if (selectedContact && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      e.preventDefault();
      const currentIndex = paginatedContacts.findIndex(c => c.id === selectedContact.id);
      if (currentIndex === -1) return;

      let newIndex: number;
      if (e.key === 'ArrowUp') {
        newIndex = currentIndex > 0 ? currentIndex - 1 : paginatedContacts.length - 1;
      } else {
        newIndex = currentIndex < paginatedContacts.length - 1 ? currentIndex + 1 : 0;
      }

      setSelectedContact(paginatedContacts[newIndex]);
      setSelectedContactDetails(null);
    }
  }, [selectedContact, paginatedContacts]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Content area ref for scroll-to-top on page change
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0 });
  }, [currentPage]);

  // Side panel width state for resizing
  const [sidePanelWidth, setSidePanelWidth] = useState(420);
  const isResizing = useRef(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing.current) return;
    const newWidth = window.innerWidth - e.clientX;
    setSidePanelWidth(Math.min(Math.max(newWidth, 300), 700)); // min 300, max 700
  };

  const handleMouseUp = () => {
    isResizing.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  return (
    <Layout>
      <div className="flex h-[calc(100vh-56px)]">
        {/* Main Content */}
        <div
          ref={contentRef}
          className="flex-1 flex flex-col overflow-y-auto transition-all duration-300"
          style={{ marginRight: selectedContact ? sidePanelWidth : 0 }}
        >
          <div className="py-6 px-4 sm:px-6 lg:px-8">
              {/* Header Row - Title and Add Button */}
              <div className="flex items-center justify-between mb-2">
                <h1 className="text-2xl font-semibold text-foreground">Contacts</h1>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-teal-400 text-white text-sm font-medium hover:bg-teal-500 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Add Contact
                </button>
              </div>

              {/* Breadcrumb */}
              <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4">
                <a
                  href="/"
                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                >
                  <Home className="h-4 w-4" />
                </a>
                <span>/</span>
                <span className="text-foreground">Contacts</span>
              </nav>

              {/* Toolbar Row - Filters + Rows left, Search right */}
              <div className="flex items-center justify-between gap-4 mb-3">
                {/* Left side - Filters toggle, Rows select */}
                <div className="flex items-center gap-3">
                  {/* Filters Toggle */}
                  <button
                    onClick={() => setFiltersExpanded(!filtersExpanded)}
                    className={`inline-flex items-center gap-2 h-9 px-3 rounded-md border text-sm font-medium transition-colors ${
                      filtersExpanded || hasActiveFilters
                        ? 'border-foreground/30 bg-accent text-foreground'
                        : 'border-input bg-background text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                    Filters
                    {hasActiveFilters && (
                      <span className="px-1.5 py-0.5 text-xs bg-teal-400/80 text-white rounded-full">
                        {(filterStatus ? 1 : 0) + (filterType ? 1 : 0)}
                      </span>
                    )}
                    <ChevronDown className={`h-4 w-4 transition-transform ${filtersExpanded ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Rows per page */}
                  <div className="relative">
                    <select
                      value={rowsPerPage}
                      onChange={(e) => {
                        setRowsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="h-9 rounded-md border border-input bg-background pl-3 pr-8 text-sm appearance-none cursor-pointer"
                    >
                      {ROWS_PER_PAGE_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>

                {/* Search Box - Right side */}
                <div className="relative w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full h-9 pl-9 pr-3 rounded-md border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground/50 placeholder:italic focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              {/* Filters Row */}
              {filtersExpanded && (
                <div className="flex items-center gap-3 mb-3">
                  {/* Type Filter */}
                  <FilterDropdown
                    label="Type"
                    value={filterType}
                    options={TYPE_OPTIONS}
                    onChange={(v) => { setFilterType(v as ContactType | ''); setCurrentPage(1); }}
                  />

                  {/* Status Filter */}
                  <FilterDropdown
                    label="Status"
                    value={filterStatus}
                    options={STATUS_OPTIONS}
                    onChange={(v) => { setFilterStatus(v as ContactStatus | ''); setCurrentPage(1); }}
                  />

                  {/* Clear All Button */}
                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="inline-flex items-center gap-1.5 h-8 px-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                      Clear all
                    </button>
                  )}
                </div>
              )}

              {/* Loading State */}
              {isLoading && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
                  <p>Error loading contacts: {(error as Error).message}</p>
                </div>
              )}

              {/* Empty State */}
              {!isLoading && !error && allContacts.length === 0 && (
                <div className="rounded-lg border bg-card p-12 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                    <Users className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="mt-4 text-lg font-medium text-foreground">No contacts found</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {hasActiveFilters
                      ? 'No contacts match your search or filters. Try adjusting them.'
                      : 'No contacts have been created yet.'}
                  </p>
                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="mt-4 text-sm text-foreground hover:text-muted-foreground underline"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              )}

              {/* Contacts Table */}
              {!isLoading && !error && allContacts.length > 0 && (
                <>
                  <div className="rounded-lg border border-border overflow-hidden">
                    <table className="w-full divide-y divide-border table-fixed">
                    <thead className="bg-muted/80 border-b border-border">
                      <tr>
                        <th className="w-[80%] px-4 py-2.5 text-left">
                          <button
                            onClick={() => handleSort('displayName')}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-foreground/70 uppercase tracking-wider hover:text-foreground transition-colors"
                          >
                            Name
                            {sortField === 'displayName' ? (
                              sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                            ) : (
                              <ArrowUpDown className="h-3 w-3 opacity-50" />
                            )}
                          </button>
                        </th>
                        <th className="w-[20%] px-4 py-2.5 text-right">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {paginatedContacts.map((contact, index) => (
                        <tr
                          key={contact.id}
                          data-index={index}
                          onClick={() => {
                            if (selectedContact?.id === contact.id) {
                              setSelectedContact(null);
                              setSelectedContactDetails(null);
                            } else {
                              setSelectedContact(contact);
                              setSelectedContactDetails(null);
                            }
                          }}
                          className={`transition-colors hover:bg-muted/50 cursor-pointer ${
                            selectedContact?.id === contact.id
                              ? 'bg-accent'
                              : index % 2 === 0
                                ? 'bg-background'
                                : 'bg-muted/30'
                          }`}
                        >
                          <td className="px-4 py-2 whitespace-nowrap">
                            <span className="text-sm font-medium text-foreground">{contact.displayName}</span>
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-right">
                            <ActionsDropdown
                              onView={() => {
                                setSelectedContact(contact);
                                setSelectedContactDetails(null);
                              }}
                              onCopy={async () => {
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
                              }}
                              onEdit={() => {
                                handleOpenEditModal(contact);
                              }}
                              onDelete={() => {
                                setDeletingContact(contact);
                              }}
                            />
                          </td>
                        </tr>
                      ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  <div className="mt-3 flex items-center justify-between px-2 text-sm">
                    {/* Left - Showing range */}
                    <div className="text-muted-foreground">
                      Showing {startIndex + 1}-{endIndex} of {totalItems}
                    </div>

                    {/* Right - Navigation controls */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-input bg-background hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="First page"
                      >
                        <ChevronsLeft className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-input bg-background hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Previous page"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>

                      <span className="mx-2 text-sm text-muted-foreground">
                        Page {currentPage} of {totalPages}
                      </span>

                      <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages || totalPages === 0}
                        className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-input bg-background hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Next page"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages || totalPages === 0}
                        className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-input bg-background hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Last page"
                      >
                        <ChevronsRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </>
              )}
          </div>
        </div>

        {/* Side Panel with Resize Handle - Always rendered for animation */}
        <div
          className={`fixed right-0 top-14 bottom-0 bg-background border-l border-border shadow-lg flex z-30 transition-transform duration-300 ease-out ${
            selectedContact ? 'translate-x-0' : 'translate-x-full'
          }`}
          style={{ width: sidePanelWidth }}
        >
          {/* Resize Handle */}
          <div
            onMouseDown={handleMouseDown}
            className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-teal-400/50 active:bg-teal-400 transition-colors group flex items-center justify-center"
          >
            <div className="absolute left-[-6px] w-4 h-8 flex items-center justify-center rounded-sm border border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-800 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
              <GripVertical className="h-3 w-3 text-zinc-400 dark:text-zinc-500" />
            </div>
          </div>
          {/* Panel Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {selectedContact && (
              <SidePanelContent
                contact={selectedContact}
                contactDetails={selectedContactDetails}
                isLoading={isDetailsLoading}
                onClose={() => {
                  setSelectedContact(null);
                  setSelectedContactDetails(null);
                }}
                onEdit={() => {
                  // Side panel already has full contact details
                  if (selectedContactDetails) {
                    setEditingContact(selectedContactDetails);
                  }
                }}
                onDelete={() => {
                  setDeletingContact(selectedContact);
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Create Contact Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Contact"
        accentColor="teal"
      >
        <ContactForm
          onSubmit={handleCreateContact}
          onCancel={() => setIsCreateModalOpen(false)}
          isSubmitting={createContactMutation.isPending}
        />
      </Modal>

      {/* Edit Contact Modal */}
      <Modal
        isOpen={editingContact !== null}
        onClose={() => setEditingContact(null)}
        title="Edit Contact"
        accentColor="teal"
      >
        {editingContact && (
          <ContactForm
            onSubmit={handleUpdateContact}
            onCancel={() => setEditingContact(null)}
            isSubmitting={updateContactMutation.isPending}
            contact={editingContact}
            isEditMode={true}
          />
        )}
      </Modal>

      {/* Delete Contact Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingContact}
        onClose={() => setDeletingContact(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Contact"
        message="Are you sure you want to delete this contact? This action cannot be undone."
        itemDetails={[
          { label: 'Name', value: deletingContact?.displayName || '' },
          { label: 'Type', value: deletingContact?.contactType === 'person' ? 'Person' : 'Organization' },
        ]}
        confirmText="Delete"
        variant="danger"
        isLoading={deleteContactMutation.isPending}
      />
    </Layout>
  );
}

// ===== Status Badge Component =====

interface StatusBadgeProps {
  status: ContactStatus;
}

const STATUS_ICONS: Record<ContactStatus, React.ReactNode> = {
  active: <Check className="h-3.5 w-3.5" />,
  inactive: <X className="h-3.5 w-3.5" />,
};

function StatusBadge({ status }: StatusBadgeProps) {
  const colors = STATUS_COLORS[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${colors.text}`}>
      {STATUS_ICONS[status]}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

// ===== Actions Dropdown Component =====

interface ActionsDropdownProps {
  onView: () => void;
  onCopy: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function ActionsDropdown({ onView, onCopy, onEdit, onDelete }: ActionsDropdownProps) {
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
              <DropdownMenuItem onSelect={() => toast.info('View All - coming soon')}>
                View All
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => toast.info('Add New - coming soon')}>
                Add New
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Deals</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onSelect={() => toast.info('Manage Deals - coming soon')}>
                Manage Deals
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => toast.info('Add Deal - coming soon')}>
                Add Deal
              </DropdownMenuItem>
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
        <DropdownMenuItem onSelect={onDelete} className="text-destructive focus:text-destructive">
          Deactivate
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ===== Side Panel Tab Types =====
type SidePanelTab = 'details' | 'status' | 'notes';

// ===== Side Panel Content Component =====

interface SidePanelContentProps {
  contact: Contact;
  contactDetails: ContactWithDetails | null;
  isLoading: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function SidePanelContent({
  contact,
  contactDetails,
  isLoading,
  onClose,
  onEdit,
  onDelete,
}: SidePanelContentProps) {
  const [activeTab, setActiveTab] = useState<SidePanelTab>('details');
  const [notesValue, setNotesValue] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [isAddRoleModalOpen, setIsAddRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<{
    type: RoleType;
    role: Player | Partner | HncMember;
  } | null>(null);
  const [removingRole, setRemovingRole] = useState<{
    type: RoleType;
    role: Player | Partner | HncMember;
  } | null>(null);
  const queryClient = useQueryClient();

  // Create role mutations
  const createPlayerMutation = useMutation({
    mutationFn: (data: CreatePlayerDto) => rolesApi.createPlayer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-roles', contact.id] });
      setIsAddRoleModalOpen(false);
      toast.success('Player role added successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add player role: ${error.message}`);
    },
  });

  const createPartnerMutation = useMutation({
    mutationFn: (data: CreatePartnerDto) => rolesApi.createPartner(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-roles', contact.id] });
      setIsAddRoleModalOpen(false);
      toast.success('Partner role added successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add partner role: ${error.message}`);
    },
  });

  const createHncMemberMutation = useMutation({
    mutationFn: (data: CreateHncMemberDto) => rolesApi.createHncMember(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-roles', contact.id] });
      setIsAddRoleModalOpen(false);
      toast.success('HNC Member role added successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add HNC member role: ${error.message}`);
    },
  });

  const isAddingRole = createPlayerMutation.isPending || createPartnerMutation.isPending || createHncMemberMutation.isPending;

  const handleAddRole = (roleType: RoleType, data: CreatePlayerDto | CreatePartnerDto | CreateHncMemberDto) => {
    switch (roleType) {
      case 'player':
        createPlayerMutation.mutate(data as CreatePlayerDto);
        break;
      case 'partner':
        createPartnerMutation.mutate(data as CreatePartnerDto);
        break;
      case 'hnc_member':
        createHncMemberMutation.mutate(data as CreateHncMemberDto);
        break;
    }
  };

  // Update role mutations
  const updatePlayerMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePlayerDto }) => rolesApi.updatePlayer(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-roles', contact.id] });
      setEditingRole(null);
      toast.success('Player role updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update player role: ${error.message}`);
    },
  });

  const updatePartnerMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePartnerDto }) => rolesApi.updatePartner(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-roles', contact.id] });
      setEditingRole(null);
      toast.success('Partner role updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update partner role: ${error.message}`);
    },
  });

  const updateHncMemberMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateHncMemberDto }) => rolesApi.updateHncMember(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-roles', contact.id] });
      setEditingRole(null);
      toast.success('HNC Member role updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update HNC member role: ${error.message}`);
    },
  });

  const isUpdatingRole = updatePlayerMutation.isPending || updatePartnerMutation.isPending || updateHncMemberMutation.isPending;

  const handleUpdateRole = (roleType: RoleType, data: any) => {
    if (!editingRole) return;
    const roleId = editingRole.role.id;
    switch (roleType) {
      case 'player':
        updatePlayerMutation.mutate({ id: roleId, data: data as UpdatePlayerDto });
        break;
      case 'partner':
        updatePartnerMutation.mutate({ id: roleId, data: data as UpdatePartnerDto });
        break;
      case 'hnc_member':
        updateHncMemberMutation.mutate({ id: roleId, data: data as UpdateHncMemberDto });
        break;
    }
  };

  // Delete role mutations
  const deletePlayerMutation = useMutation({
    mutationFn: (id: string) => rolesApi.deletePlayer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-roles', contact.id] });
      setRemovingRole(null);
      toast.success('Player role removed successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to remove player role: ${error.message}`);
    },
  });

  const deletePartnerMutation = useMutation({
    mutationFn: (id: string) => rolesApi.deletePartner(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-roles', contact.id] });
      setRemovingRole(null);
      toast.success('Partner role removed successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to remove partner role: ${error.message}`);
    },
  });

  const deleteHncMemberMutation = useMutation({
    mutationFn: (id: string) => rolesApi.deleteHncMember(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-roles', contact.id] });
      setRemovingRole(null);
      toast.success('HNC Member role removed successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to remove HNC member role: ${error.message}`);
    },
  });

  const isRemovingRole = deletePlayerMutation.isPending || deletePartnerMutation.isPending || deleteHncMemberMutation.isPending;

  const handleRemoveRole = () => {
    if (!removingRole) return;
    const { type, role } = removingRole;
    switch (type) {
      case 'player':
        deletePlayerMutation.mutate(role.id);
        break;
      case 'partner':
        deletePartnerMutation.mutate(role.id);
        break;
      case 'hnc_member':
        deleteHncMemberMutation.mutate(role.id);
        break;
    }
  };

  // Fetch roles when Details tab is active (roles are shown in Details tab)
  const { data: roles, isLoading: isRolesLoading } = useQuery({
    queryKey: ['contact-roles', contact.id],
    queryFn: () => rolesApi.getAllRolesForContact(contact.id),
    enabled: activeTab === 'details',
  });

  const hasRoles = roles && (
    roles.players.length > 0 ||
    roles.partners.length > 0 ||
    roles.hncMembers.length > 0
  );

  const existingRoleTypes: RoleType[] = [
    ...(roles?.players.length ? ['player' as const] : []),
    ...(roles?.partners.length ? ['partner' as const] : []),
    ...(roles?.hncMembers.length ? ['hnc_member' as const] : []),
  ];

  // Sync notes from contactDetails when loaded
  useEffect(() => {
    if (contactDetails) {
      const notes = contactDetails.personDetails?.notes || contactDetails.organizationDetails?.notes || '';
      setNotesValue(notes);
    }
  }, [contactDetails]);

  // Reset to details tab when contact changes
  useEffect(() => {
    setActiveTab('details');
  }, [contact.id]);

  // Notes save handler (auto-save on blur)
  const handleNotesSave = async () => {
    if (!contactDetails) return;

    const currentNotes = contactDetails.personDetails?.notes || contactDetails.organizationDetails?.notes || '';
    if (notesValue === currentNotes) return; // No changes

    setIsSavingNotes(true);
    try {
      await contactsApi.update(contact.id, { notes: notesValue || null });
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['contact', contact.id] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    } catch (error) {
      console.error('Failed to save notes:', error);
      // Reset to original value on error
      setNotesValue(currentNotes);
    } finally {
      setIsSavingNotes(false);
    }
  };

  // Status change state
  const [pendingStatus, setPendingStatus] = useState<string>('');
  const [isStatusChanging, setIsStatusChanging] = useState(false);

  const confirmStatusChange = async () => {
    if (!pendingStatus) return;
    setIsStatusChanging(true);
    try {
      await contactsApi.update(contact.id, { isActive: pendingStatus === 'active' });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['contact', contact.id] });
      toast.success(`Contact ${pendingStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
      setPendingStatus('');
    } catch (error) {
      toast.error('Failed to update status');
    } finally {
      setIsStatusChanging(false);
    }
  };

  const tabs: { id: SidePanelTab; label: string }[] = [
    { id: 'details', label: 'Details' },
    { id: 'status', label: 'Status' },
    { id: 'notes', label: 'Notes' },
  ];

  return (
    <div className="h-full bg-background border-l border-border flex flex-col">
      {/* Header with contact name and close button */}
      <div className="flex items-center justify-between px-4 py-4 bg-muted/50 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-900/30">
            {contact.contactType === 'person' ? (
              <User className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            ) : (
              <Building2 className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            )}
          </div>
          <h3 className="text-lg font-semibold text-foreground">{contact.displayName}</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Tab Bar */}
      <div className="flex border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-foreground border-b-2 border-teal-400'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Details Tab */}
            {activeTab === 'details' && (
              <div className="p-4 space-y-4">
                {/* Roles Section at Top */}
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Roles
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    {isRolesLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : hasRoles ? (
                      <>
                        {roles?.players.map((p) => (
                          <div key={p.id} className="group relative inline-flex items-center">
                            <RoleBadge type="player" />
                            <div className="hidden group-hover:flex items-center gap-0.5 ml-1">
                              <button
                                onClick={() => setEditingRole({ type: 'player', role: p })}
                                className="p-0.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                title="Edit player role"
                              >
                                <Pencil className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => setRemovingRole({ type: 'player', role: p })}
                                className="p-0.5 rounded text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                title="Remove player role"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                        {roles?.partners.map((p) => (
                          <div key={p.id} className="group relative inline-flex items-center">
                            <RoleBadge type="partner" />
                            <div className="hidden group-hover:flex items-center gap-0.5 ml-1">
                              <button
                                onClick={() => setEditingRole({ type: 'partner', role: p })}
                                className="p-0.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                title="Edit partner role"
                              >
                                <Pencil className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => setRemovingRole({ type: 'partner', role: p })}
                                className="p-0.5 rounded text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                title="Remove partner role"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                        {roles?.hncMembers.map((m) => (
                          <div key={m.id} className="group relative inline-flex items-center">
                            <RoleBadge type="hnc_member" />
                            <div className="hidden group-hover:flex items-center gap-0.5 ml-1">
                              <button
                                onClick={() => setEditingRole({ type: 'hnc_member', role: m })}
                                className="p-0.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                title="Edit HNC member role"
                              >
                                <Pencil className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => setRemovingRole({ type: 'hnc_member', role: m })}
                                className="p-0.5 rounded text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                title="Remove HNC member role"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </>
                    ) : (
                      <span className="text-sm text-muted-foreground italic">No roles assigned</span>
                    )}
                    <button
                      onClick={() => setIsAddRoleModalOpen(true)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full border border-dashed border-teal-400 text-teal-500 hover:bg-teal-400/10 transition-colors"
                    >
                      <Plus className="h-3 w-3" />
                      Add
                    </button>
                  </div>
                </div>

                {/* Person Details */}
                {contactDetails?.personDetails && (
                  <div className="border-t border-border pt-4">
                    <h4 className="text-sm font-medium text-foreground mb-3">Person Details</h4>
                    <div className="space-y-3">
                      <DetailRow label="First Name" value={contactDetails.personDetails.firstName} />
                      <DetailRow label="Last Name" value={contactDetails.personDetails.lastName || '—'} />
                      <DetailRow label="Email" value={contactDetails.personDetails.email || '—'} />
                      <DetailRow label="Mobile" value={contactDetails.personDetails.mobileNumber || '—'} />
                      <DetailRow label="Country" value={contactDetails.personDetails.country || '—'} />
                      <DetailRow label="Area" value={contactDetails.personDetails.area || '—'} />
                    </div>
                  </div>
                )}

                {/* Organization Details */}
                {contactDetails?.organizationDetails && (
                  <div className="border-t border-border pt-4">
                    <h4 className="text-sm font-medium text-foreground mb-3">Organization Details</h4>
                    <div className="space-y-3">
                      <DetailRow label="Legal Name" value={contactDetails.organizationDetails.legalName} />
                      <DetailRow label="Registration #" value={contactDetails.organizationDetails.registrationNumber || '—'} />
                      <DetailRow label="Tax ID" value={contactDetails.organizationDetails.taxId || '—'} />
                      <DetailRow label="Country" value={contactDetails.organizationDetails.country || '—'} />
                    </div>
                  </div>
                )}

                {/* Role Modals */}
                <Modal
                  isOpen={isAddRoleModalOpen}
                  onClose={() => setIsAddRoleModalOpen(false)}
                  title="Add Role"
                  accentColor="teal"
                >
                  <RoleForm
                    contactId={contact.id}
                    contactName={contact.displayName}
                    existingRoleTypes={existingRoleTypes}
                    onSubmit={handleAddRole}
                    onCancel={() => setIsAddRoleModalOpen(false)}
                    isLoading={isAddingRole}
                  />
                </Modal>

                <Modal
                  isOpen={!!editingRole}
                  onClose={() => setEditingRole(null)}
                  title="Edit Role"
                  accentColor="teal"
                >
                  {editingRole && (
                    <RoleForm
                      contactId={contact.id}
                      existingRoleTypes={existingRoleTypes}
                      isEditMode={true}
                      editRoleType={editingRole.type}
                      editRole={editingRole.role}
                      onSubmit={handleUpdateRole}
                      onCancel={() => setEditingRole(null)}
                      isLoading={isUpdatingRole}
                    />
                  )}
                </Modal>

                <ConfirmModal
                  isOpen={!!removingRole}
                  onClose={() => setRemovingRole(null)}
                  onConfirm={handleRemoveRole}
                  title="Remove Role"
                  message={`Are you sure you want to remove the ${removingRole?.type === 'hnc_member' ? 'HNC Member' : removingRole?.type === 'player' ? 'Player' : 'Partner'} role? This action cannot be undone.`}
                  confirmText="Remove"
                  variant="danger"
                  isLoading={isRemovingRole}
                />
              </div>
            )}

            {/* Status Tab */}
            {activeTab === 'status' && (
              <div className="p-4 space-y-4">
                {/* Current Status Display */}
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Current Status
                  </label>
                  <div className="p-3 rounded-md bg-muted/30 border border-border">
                    <StatusBadge status={(contactDetails?.isActive ?? contact.isActive) ? 'active' : 'inactive'} />
                  </div>
                </div>

                {/* Change Status */}
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Change Status
                  </label>
                  <div className="relative">
                    <select
                      value={pendingStatus || ''}
                      onChange={(e) => setPendingStatus(e.target.value as 'active' | 'inactive' | '')}
                      disabled={isStatusChanging}
                      className="w-full h-10 rounded-md border border-input bg-background pl-3 pr-8 text-sm appearance-none cursor-pointer disabled:opacity-50"
                    >
                      <option value="">Select new status...</option>
                      {(contactDetails?.isActive ?? contact.isActive) ? (
                        <option value="inactive">Inactive</option>
                      ) : (
                        <option value="active">Active</option>
                      )}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>

                {/* Inline confirmation */}
                {pendingStatus && (
                  <div className="p-3 rounded-md bg-muted/50 border border-border">
                    <p className="text-sm text-foreground mb-3">
                      Change status to <StatusBadge status={pendingStatus as 'active' | 'inactive'} />?
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={confirmStatusChange}
                        disabled={isStatusChanging}
                        className="flex-1 h-9 rounded-md bg-teal-400/80 text-white text-sm font-medium hover:bg-teal-400 transition-colors disabled:opacity-50"
                      >
                        {isStatusChanging ? (
                          <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                        ) : (
                          'Confirm'
                        )}
                      </button>
                      <button
                        onClick={() => setPendingStatus('')}
                        disabled={isStatusChanging}
                        className="flex-1 h-9 rounded-md border border-input text-foreground text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Notes Tab */}
            {activeTab === 'notes' && (
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Internal Notes
                  </label>
                  <textarea
                    value={notesValue}
                    onChange={(e) => setNotesValue(e.target.value)}
                    onBlur={handleNotesSave}
                    placeholder="Add notes about this contact..."
                    className="w-full min-h-[200px] rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 placeholder:italic focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  />
                </div>
                {isSavingNotes ? (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Saving...
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Changes are saved automatically when you click away.
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer with Edit and Delete buttons */}
      <div className="border-t border-border p-4 flex gap-2">
        <button
          onClick={onEdit}
          className="flex-1 inline-flex items-center justify-center gap-2 h-9 rounded-md bg-teal-400/80 text-white text-sm font-medium hover:bg-teal-400 transition-colors"
        >
          <Pencil className="h-4 w-4" />
          Edit
        </button>
        <button
          onClick={onDelete}
          className="flex-1 inline-flex items-center justify-center gap-2 h-9 rounded-md border border-input text-muted-foreground text-sm font-medium hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:hover:bg-red-900/20 dark:hover:text-red-400 dark:hover:border-red-800 transition-colors"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </button>
      </div>
    </div>
  );
}

// ===== Detail Row Component =====

interface DetailRowProps {
  label: string;
  value?: string;
  children?: React.ReactNode;
  isUrl?: boolean;
}

function DetailRow({ label, value, children, isUrl }: DetailRowProps) {
  return (
    <div>
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm text-foreground">
        {children || (isUrl && value && value !== '—' ? (
          <a
            href={value.startsWith('http') ? value : `https://${value}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground underline hover:text-muted-foreground"
          >
            {value}
          </a>
        ) : (
          value
        ))}
      </dd>
    </div>
  );
}
