import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Layout } from '@/components/Layout';
import { contactsApi } from '@/services/contacts-api';
import type { Contact, ContactWithDetails, ContactType, ContactStatus } from '@/types/contacts';
import { STATUS_COLORS } from '@/types/contacts';
import {
  Loader2,
  Users,
  MoreVertical,
  FileSearch2,
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
  UserPlus,
  FileText,
  UserCog,
} from 'lucide-react';

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
  // UI State
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [selectedContactDetails, setSelectedContactDetails] = useState<ContactWithDetails | null>(null);

  // Filter/Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<ContactStatus | ''>('');
  const [filterType, setFilterType] = useState<ContactType | ''>('');
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  // Sorting State
  type SortField = 'displayName' | 'contactType' | 'isActive' | null;
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
    queryKey: ['contacts', filterStatus, filterType, searchQuery, currentPage, rowsPerPage, sortField, sortDirection],
    queryFn: () => contactsApi.getAll({
      isActive: filterStatus === 'active' ? true : filterStatus === 'inactive' ? false : undefined,
      contactType: filterType || undefined,
      search: searchQuery || undefined,
      page: currentPage,
      limit: rowsPerPage,
      sortBy: sortField || undefined,
      sortOrder: sortField ? sortDirection : undefined,
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

  const allContacts = contactsResponse?.data || [];
  const totalItems = contactsResponse?.pagination?.total || 0;
  const totalPages = contactsResponse?.pagination?.totalPages || Math.ceil(totalItems / rowsPerPage);

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
      const currentIndex = allContacts.findIndex(c => c.id === selectedContact.id);
      if (currentIndex === -1) return;

      let newIndex: number;
      if (e.key === 'ArrowUp') {
        newIndex = currentIndex > 0 ? currentIndex - 1 : allContacts.length - 1;
      } else {
        newIndex = currentIndex < allContacts.length - 1 ? currentIndex + 1 : 0;
      }

      setSelectedContact(allContacts[newIndex]);
      setSelectedContactDetails(null);
    }
  }, [selectedContact, allContacts]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

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

  // Pagination info
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, totalItems);

  return (
    <Layout>
      <div className="flex h-[calc(100vh-56px)]">
        {/* Main Content */}
        <div
          className="flex-1 flex flex-col overflow-auto transition-all duration-300"
          style={{ marginRight: selectedContact ? sidePanelWidth : 0 }}
        >
          <div className="py-6 px-4 sm:px-6 lg:px-8">
              {/* Header Row - Title */}
              <div className="flex items-center justify-between mb-2">
                <h1 className="text-2xl font-semibold text-foreground">Contacts</h1>
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

              {/* Collapsible Filters Row with Animation */}
              <div
                className={`grid transition-all duration-200 ease-out ${
                  filtersExpanded ? 'grid-rows-[1fr] opacity-100 mb-3' : 'grid-rows-[0fr] opacity-0'
                }`}
              >
                <div className="overflow-hidden">
                  <div className="flex items-center gap-3 pt-0.5">
                    {/* Type Filter */}
                    <div className="relative">
                      <select
                        value={filterType}
                        onChange={(e) => {
                          setFilterType(e.target.value as ContactType | '');
                          setCurrentPage(1);
                        }}
                        className="h-9 rounded-md border border-input bg-background pl-3 pr-8 text-sm appearance-none cursor-pointer min-w-[150px]"
                      >
                        {TYPE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    </div>

                    {/* Status Filter */}
                    <div className="relative">
                      <select
                        value={filterStatus}
                        onChange={(e) => {
                          setFilterStatus(e.target.value as ContactStatus | '');
                          setCurrentPage(1);
                        }}
                        className="h-9 rounded-md border border-input bg-background pl-3 pr-8 text-sm appearance-none cursor-pointer min-w-[150px]"
                      >
                        {STATUS_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    </div>

                    {/* Clear All Button */}
                    {hasActiveFilters && (
                      <button
                        onClick={clearFilters}
                        className="inline-flex items-center gap-1.5 h-9 px-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                        Clear all
                      </button>
                    )}
                  </div>
                </div>
              </div>

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
                        <th className={`${selectedContact ? 'w-[45%]' : 'w-[40%]'} px-4 py-2.5 text-left`}>
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
                        <th className={`${selectedContact ? 'w-[25%]' : 'w-[20%]'} px-4 py-2.5 text-left`}>
                          <button
                            onClick={() => handleSort('contactType')}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-foreground/70 uppercase tracking-wider hover:text-foreground transition-colors"
                          >
                            Type
                            {sortField === 'contactType' ? (
                              sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                            ) : (
                              <ArrowUpDown className="h-3 w-3 opacity-50" />
                            )}
                          </button>
                        </th>
                        {!selectedContact && (
                          <th className="w-[20%] px-4 py-2.5 text-left">
                            <button
                              onClick={() => handleSort('isActive')}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-foreground/70 uppercase tracking-wider hover:text-foreground transition-colors"
                            >
                              Status
                              {sortField === 'isActive' ? (
                                sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                              ) : (
                                <ArrowUpDown className="h-3 w-3 opacity-50" />
                              )}
                            </button>
                          </th>
                        )}
                        <th className={`${selectedContact ? 'w-[30%]' : 'w-[20%]'} px-4 py-2.5 text-right`}>
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {allContacts.map((contact, index) => (
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
                          <td className="px-4 py-2 whitespace-nowrap">
                            <TypeBadge type={contact.contactType} />
                          </td>
                          {!selectedContact && (
                            <td className="px-4 py-2 whitespace-nowrap">
                              <StatusBadge status={contact.isActive ? 'active' : 'inactive'} />
                            </td>
                          )}
                          <td className="px-4 py-2 whitespace-nowrap text-right">
                            <ActionsDropdown
                              onView={() => {
                                setSelectedContact(contact);
                                setSelectedContactDetails(null);
                              }}
                              onEdit={() => {
                                // TODO: Implement edit modal
                                console.log('Edit contact:', contact.id);
                              }}
                              onDelete={() => {
                                // TODO: Implement delete modal
                                console.log('Delete contact:', contact.id);
                              }}
                              rowIndex={index}
                              totalRows={allContacts.length}
                            />
                          </td>
                        </tr>
                      ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  <div className="mt-3 flex items-center justify-end gap-1 text-sm">
                    <span className="text-muted-foreground mr-3">
                      {startIndex + 1}-{endIndex} of {totalItems}
                    </span>
                    {/* First Page */}
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="p-1.5 rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                      title="First page"
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </button>
                    {/* Previous Page */}
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-1.5 rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Previous page"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    {/* Page Numbers */}
                    {(() => {
                      const pages: (number | string)[] = [];
                      if (totalPages <= 7) {
                        for (let i = 1; i <= totalPages; i++) pages.push(i);
                      } else {
                        pages.push(1);
                        if (currentPage > 3) pages.push('...');
                        for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
                          pages.push(i);
                        }
                        if (currentPage < totalPages - 2) pages.push('...');
                        pages.push(totalPages);
                      }
                      return pages.map((page, idx) =>
                        page === '...' ? (
                          <span key={`ellipsis-${idx}`} className="px-2 text-muted-foreground">...</span>
                        ) : (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page as number)}
                            className={`min-w-[32px] h-8 px-2 rounded text-sm font-medium transition-colors ${
                              currentPage === page
                                ? 'bg-foreground text-background'
                                : 'hover:bg-muted'
                            }`}
                          >
                            {page}
                          </button>
                        )
                      );
                    })()}
                    {/* Next Page */}
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages || totalPages === 0}
                      className="p-1.5 rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Next page"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                    {/* Last Page */}
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages || totalPages === 0}
                      className="p-1.5 rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Last page"
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </button>
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
                  // TODO: Implement edit modal
                  console.log('Edit contact:', selectedContact.id);
                }}
                onDelete={() => {
                  // TODO: Implement delete modal
                  console.log('Delete contact:', selectedContact.id);
                }}
              />
            )}
          </div>
        </div>
      </div>
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

// ===== Type Badge Component =====

interface TypeBadgeProps {
  type: ContactType;
}

const TYPE_ICONS: Record<ContactType, React.ReactNode> = {
  person: <User className="h-3.5 w-3.5" />,
  organization: <Building2 className="h-3.5 w-3.5" />,
};

function TypeBadge({ type }: TypeBadgeProps) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
      {TYPE_ICONS[type]}
      {type.charAt(0).toUpperCase() + type.slice(1)}
    </span>
  );
}

// ===== Actions Dropdown Component =====

interface ActionsDropdownProps {
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  rowIndex: number;
  totalRows: number;
}

function ActionsDropdown({ onView, onEdit, onDelete, rowIndex, totalRows }: ActionsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Show dropdown above for bottom 4 rows to prevent clipping
  const showAbove = totalRows > 4 && rowIndex >= totalRows - 4;

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="p-2 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className={`absolute right-0 w-40 rounded-md border border-border bg-background shadow-lg z-20 py-1 ${showAbove ? 'bottom-full mb-1' : 'mt-1'}`}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onView();
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
            >
              <FileSearch2 className="h-4 w-4" />
              View
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </button>
            <hr className="my-1 border-border" />
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ===== Side Panel Tab Types =====
type SidePanelTab = 'details' | 'roles' | 'notes';

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
  const queryClient = useQueryClient();

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

  const tabs: { id: SidePanelTab; label: string; icon: React.ReactNode }[] = [
    { id: 'details', label: 'Details', icon: <FileText className="h-4 w-4" /> },
    { id: 'roles', label: 'Roles', icon: <UserCog className="h-4 w-4" /> },
    { id: 'notes', label: 'Notes', icon: <FileText className="h-4 w-4" /> },
  ];

  return (
    <div className="h-full bg-background border-l border-border flex flex-col">
      {/* Header with contact name and close button */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          {contact.contactType === 'person' ? (
            <User className="h-5 w-5 text-muted-foreground" />
          ) : (
            <Building2 className="h-5 w-5 text-muted-foreground" />
          )}
          <h3 className="text-base font-semibold text-foreground">{contact.displayName}</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Tab Bar */}
      <div className="flex border-b border-border px-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium transition-colors relative ${
              activeTab === tab.id
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
            {/* Active tab underline */}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-400" />
            )}
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
                {/* Basic Info */}
                <div className="space-y-3">
                  <DetailRow label="Status">
                    <StatusBadge status={contact.isActive ? 'active' : 'inactive'} />
                  </DetailRow>
                  <DetailRow label="Type">
                    <TypeBadge type={contact.contactType} />
                  </DetailRow>
                  {contactDetails?.personDetails && (
                    <>
                      <DetailRow label="Email" value={contactDetails.personDetails.email || '—'} />
                      <DetailRow label="Mobile" value={contactDetails.personDetails.mobileNumber || '—'} />
                    </>
                  )}
                </div>

                {/* Person Details */}
                {contactDetails?.personDetails && (
                  <div className="border-t border-border pt-4">
                    <h4 className="text-sm font-medium text-foreground mb-3">Person Details</h4>
                    <div className="space-y-3">
                      <DetailRow label="First Name" value={contactDetails.personDetails.firstName} />
                      <DetailRow label="Last Name" value={contactDetails.personDetails.lastName || '—'} />
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
              </div>
            )}

            {/* Roles Tab */}
            {activeTab === 'roles' && (
              <div className="p-4 flex flex-col h-full">
                {/* Empty State */}
                <div className="flex-1 flex flex-col items-center justify-center py-8">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
                    <UserCog className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground text-center">No roles assigned</p>
                  <p className="text-xs text-muted-foreground/70 text-center mt-1">
                    Roles define how this contact interacts with brands
                  </p>
                </div>
                {/* Add Role Button */}
                <button
                  className="mt-auto inline-flex items-center justify-center gap-2 h-9 rounded-md border-2 border-teal-400 text-teal-500 text-sm font-medium hover:bg-teal-400/10 transition-colors"
                  onClick={() => {
                    // TODO: Implement add role modal (FES-07/08)
                    console.log('Add role clicked');
                  }}
                >
                  <UserPlus className="h-4 w-4" />
                  Add Role
                </button>
              </div>
            )}

            {/* Notes Tab */}
            {activeTab === 'notes' && (
              <div className="p-4 flex flex-col h-full">
                <label className="text-sm font-medium text-muted-foreground mb-2">
                  Notes
                </label>
                <textarea
                  value={notesValue}
                  onChange={(e) => setNotesValue(e.target.value)}
                  onBlur={handleNotesSave}
                  placeholder="Add notes about this contact..."
                  className="flex-1 min-h-[200px] rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 placeholder:italic focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
                {isSavingNotes && (
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Saving...
                  </div>
                )}
                {!isSavingNotes && notesValue !== (contactDetails?.personDetails?.notes || contactDetails?.organizationDetails?.notes || '') && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Changes will be saved when you click away
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
