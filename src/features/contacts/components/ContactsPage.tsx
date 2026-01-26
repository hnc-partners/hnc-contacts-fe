/**
 * ContactsPage Component
 *
 * Main page orchestrator for contacts management.
 * Handles list view, side panel, modals, and all UI state.
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@hnc-partners/ui-components';
import { Layout } from '@/components/Layout';
import { FilterDropdown } from '@/components/FilterDropdown';
import { CustomSelect } from '@/components/ui/custom-select';
import { contactsApi } from '@/services/contacts-api';
import { formatDate, getJoinDateRange } from '@/lib/utils';
import {
  Loader2,
  Users,
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
  GripVertical,
  Home,
  Plus,
  X,
} from 'lucide-react';

import { ActionsDropdown } from './ActionsDropdown';
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
  ROWS_PER_PAGE_OPTIONS,
} from '../types';

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
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Sorting State
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Side panel width state for resizing
  const [sidePanelWidth, setSidePanelWidth] = useState(420);
  const isResizing = useRef(false);

  // Content area ref for scroll-to-top on page change
  const contentRef = useRef<HTMLDivElement>(null);

  // Compute join date range from filter value
  const joinDateRange = useMemo(() => getJoinDateRange(joinDateFilter), [joinDateFilter]);

  // Query hooks
  const { data: contactsResponse, isLoading, error } = useContacts({
    isActive:
      filterStatus === 'active' ? true : filterStatus === 'inactive' ? false : undefined,
    contactType: filterType || undefined,
    search: searchQuery || undefined,
    limit: 500,
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

  // Scroll to top on page change
  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0 });
  }, [currentPage]);

  // Handlers
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

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
    setCurrentPage(1);
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

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedContact) {
        setSelectedContact(null);
        setSelectedContactDetails(null);
        return;
      }

      if (selectedContact && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
        e.preventDefault();
        const currentIndex = paginatedContacts.findIndex(
          (c) => c.id === selectedContact.id
        );
        if (currentIndex === -1) return;

        let newIndex: number;
        if (e.key === 'ArrowUp') {
          newIndex =
            currentIndex > 0 ? currentIndex - 1 : paginatedContacts.length - 1;
        } else {
          newIndex =
            currentIndex < paginatedContacts.length - 1 ? currentIndex + 1 : 0;
        }

        setSelectedContact(paginatedContacts[newIndex]);
        setSelectedContactDetails(null);
      }
    },
    [selectedContact, paginatedContacts]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Resize handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing.current) return;
    const newWidth = window.innerWidth - e.clientX;
    setSidePanelWidth(Math.min(Math.max(newWidth, 300), 700));
  };

  const handleMouseUp = () => {
    isResizing.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  return (
    <Layout>
      <div className="flex h-full relative">
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
              <Button
                size="sm"
                onClick={() => setIsCreateModalOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Add Contact
              </Button>
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFiltersExpanded(!filtersExpanded)}
                  className={filtersExpanded || hasActiveFilters
                    ? 'border-foreground/30 bg-accent text-foreground'
                    : ''}
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  Filters
                  {hasActiveFilters && (
                    <span className="px-1.5 py-0.5 text-xs bg-teal-400/80 text-white rounded-full">
                      {(filterStatus ? 1 : 0) +
                        (filterType ? 1 : 0) +
                        (joinDateFilter ? 1 : 0)}
                    </span>
                  )}
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${
                      filtersExpanded ? 'rotate-180' : ''
                    }`}
                  />
                </Button>

                {/* Rows per page */}
                <div className="w-[80px]">
                  <CustomSelect
                    value={String(rowsPerPage)}
                    onChange={(v) => {
                      setRowsPerPage(Number(v));
                      setCurrentPage(1);
                    }}
                    options={ROWS_PER_PAGE_OPTIONS.map((n) => ({
                      value: String(n),
                      label: String(n),
                    }))}
                  />
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
                  onChange={(v) => {
                    setFilterType(v as ContactType | '');
                    setCurrentPage(1);
                  }}
                />

                {/* Status Filter */}
                <FilterDropdown
                  label="Status"
                  value={filterStatus}
                  options={STATUS_OPTIONS}
                  onChange={(v) => {
                    setFilterStatus(v as ContactStatus | '');
                    setCurrentPage(1);
                  }}
                />

                {/* Join Date Filter */}
                <FilterDropdown
                  label="Join Date"
                  value={joinDateFilter}
                  options={JOIN_DATE_OPTIONS}
                  onChange={(v) => {
                    setJoinDateFilter(v);
                    setCurrentPage(1);
                  }}
                />

                {/* Clear All Button */}
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                    Clear all
                  </Button>
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
                <h3 className="mt-4 text-lg font-medium text-foreground">
                  No contacts found
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {hasActiveFilters
                    ? 'No contacts match your search or filters. Try adjusting them.'
                    : 'No contacts have been created yet.'}
                </p>
                {hasActiveFilters && (
                  <Button
                    variant="link"
                    onClick={clearFilters}
                    className="mt-4"
                  >
                    Clear filters
                  </Button>
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
                        <th className="w-[25%] px-4 py-2.5 text-left">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSort('displayName')}
                            className="h-auto p-0 inline-flex items-center gap-1 text-xs font-semibold text-foreground/70 uppercase tracking-wider hover:text-foreground hover:bg-transparent"
                          >
                            Name
                            {sortField === 'displayName' ? (
                              sortDirection === 'asc' ? (
                                <ArrowUp className="h-3 w-3" />
                              ) : (
                                <ArrowDown className="h-3 w-3" />
                              )
                            ) : (
                              <ArrowUpDown className="h-3 w-3 opacity-50" />
                            )}
                          </Button>
                        </th>
                        {!selectedContact && (
                          <th className="w-[15%] px-4 py-2.5 text-left">
                            <span className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">
                              First Name
                            </span>
                          </th>
                        )}
                        {!selectedContact && (
                          <th className="w-[15%] px-4 py-2.5 text-left">
                            <span className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">
                              Last Name
                            </span>
                          </th>
                        )}
                        <th className="w-[15%] px-4 py-2.5 text-left">
                          <span className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">
                            Join Date
                          </span>
                        </th>
                        <th className="w-[15%] px-4 py-2.5 text-right">
                          <span className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">
                            Balance
                          </span>
                        </th>
                        <th className="w-[15%] px-4 py-2.5 text-right">
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
                              setSidePanelTab('details');
                              setSelectedContact(contact);
                              setSelectedContactDetails(null);
                            }
                          }}
                          className={`transition-colors hover:bg-muted/50 cursor-pointer ${
                            selectedContact?.id === contact.id
                              ? 'bg-accent'
                              : 'bg-muted/30'
                          }`}
                        >
                          <td className="px-4 py-2 whitespace-nowrap">
                            <span className="text-sm font-medium text-foreground">
                              {contact.displayName}
                            </span>
                          </td>
                          {!selectedContact && (
                            <td className="px-4 py-2 whitespace-nowrap">
                              <span className="text-sm text-muted-foreground">
                                {contact.personDetails?.firstName || '\u2014'}
                              </span>
                            </td>
                          )}
                          {!selectedContact && (
                            <td className="px-4 py-2 whitespace-nowrap">
                              <span className="text-sm text-muted-foreground">
                                {contact.personDetails?.lastName || '\u2014'}
                              </span>
                            </td>
                          )}
                          <td className="px-4 py-2 whitespace-nowrap">
                            <span className="text-sm text-muted-foreground">
                              {formatDate(contact.joinDate) || '\u2014'}
                            </span>
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-right">
                            <span className="text-sm text-muted-foreground">
                              {'\u2014'}
                            </span>
                          </td>
                          <td
                            className="px-4 py-2 whitespace-nowrap text-right"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ActionsDropdown
                              onView={() => {
                                setSidePanelTab('details');
                                setSelectedContact(contact);
                                setSelectedContactDetails(null);
                              }}
                              onDelete={() => {
                                setDeletingContact(contact);
                              }}
                              onCopy={async () => {
                                try {
                                  await navigator.clipboard.writeText(
                                    contact.displayName
                                  );
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
                              isActive={contact.isActive}
                              onToggleActive={async () => {
                                try {
                                  const newStatus = !contact.isActive;
                                  await contactsApi.update(contact.id, {
                                    isActive: newStatus,
                                  });
                                  queryClient.invalidateQueries({
                                    queryKey: contactsKeys.all,
                                  });
                                  queryClient.invalidateQueries({
                                    queryKey: contactsKeys.detail(contact.id),
                                  });
                                  toast.success(
                                    `Contact ${
                                      newStatus ? 'activated' : 'deactivated'
                                    } successfully`
                                  );
                                } catch (error) {
                                  toast.error(
                                    `Failed to update contact status: ${
                                      (error as Error).message
                                    }`
                                  );
                                }
                              }}
                              onGamingAccounts={() => {
                                setSidePanelTab('gaming-accounts');
                                setSelectedContact(contact);
                                setSelectedContactDetails(null);
                              }}
                              onDeals={() => {
                                setSidePanelTab('deals');
                                setSelectedContact(contact);
                                setSelectedContactDetails(null);
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
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="h-8 w-8"
                      title="First page"
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="h-8 w-8"
                      title="Previous page"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <span className="mx-2 text-sm text-muted-foreground">
                      Page {currentPage} of {totalPages}
                    </span>

                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages || totalPages === 0}
                      className="h-8 w-8"
                      title="Next page"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages || totalPages === 0}
                      className="h-8 w-8"
                      title="Last page"
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Side Panel with Resize Handle - Always rendered for animation */}
        <div
          className={`absolute right-0 top-0 bottom-0 bg-background border-l border-border shadow-lg flex z-30 transition-transform duration-300 ease-out ${
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
    </Layout>
  );
}
