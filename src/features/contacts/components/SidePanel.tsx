/**
 * SidePanel Component
 *
 * Contact detail side panel with tabs for details, gaming accounts, deals, status, notes.
 */

import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Loader2,
  X,
  User,
  Building2,
  Pencil,
  Trash2,
  Plus,
} from 'lucide-react';
import { Modal, ConfirmModal } from '@/components/Modal';
import { RoleBadge } from '@/components/RoleBadge';
import { RoleForm } from '@/components/RoleForm';
import { CustomSelect } from '@/components/ui/custom-select';
import { contactsApi } from '@/services/contacts-api';
import { StatusBadge } from './StatusBadge';
import { DetailRow } from './DetailRow';
import {
  useContactRoles,
  useCreateRole,
  useUpdateRole,
  useDeleteRole,
  contactsKeys,
} from '../hooks/use-contacts';
import type {
  Contact,
  ContactWithDetails,
  SidePanelTab,
  RoleType,
  Player,
  Partner,
  HncMember,
  CreatePlayerDto,
  CreatePartnerDto,
  CreateHncMemberDto,
} from '../types';

interface SidePanelProps {
  contact: Contact;
  contactDetails: ContactWithDetails | null;
  isLoading: boolean;
  activeTab: SidePanelTab;
  onTabChange: (tab: SidePanelTab) => void;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function SidePanel({
  contact,
  contactDetails,
  isLoading,
  activeTab,
  onTabChange,
  onClose,
  onEdit,
  onDelete,
}: SidePanelProps) {
  const queryClient = useQueryClient();

  // Notes state
  const [notesValue, setNotesValue] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  // Role modals state
  const [isAddRoleModalOpen, setIsAddRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<{
    type: RoleType;
    role: Player | Partner | HncMember;
  } | null>(null);
  const [removingRole, setRemovingRole] = useState<{
    type: RoleType;
    role: Player | Partner | HncMember;
  } | null>(null);

  // Status change state
  const [pendingStatus, setPendingStatus] = useState<string>('');
  const [isStatusChanging, setIsStatusChanging] = useState(false);

  // Role hooks
  const { data: roles, isLoading: isRolesLoading } = useContactRoles(
    contact.id,
    activeTab === 'details'
  );
  const { addRole, isLoading: isAddingRole } = useCreateRole(contact.id);
  const { editRole, isLoading: isUpdatingRole } = useUpdateRole(contact.id);
  const { removeRole, isLoading: isRemovingRole } = useDeleteRole(contact.id);

  const hasRoles =
    roles &&
    (roles.players.length > 0 ||
      roles.partners.length > 0 ||
      roles.hncMembers.length > 0);

  const existingRoleTypes: RoleType[] = [
    ...(roles?.players.length ? (['player'] as const) : []),
    ...(roles?.partners.length ? (['partner'] as const) : []),
    ...(roles?.hncMembers.length ? (['hnc_member'] as const) : []),
  ];

  // Sync notes from contactDetails when loaded
  useEffect(() => {
    if (contactDetails) {
      const notes =
        contactDetails.personDetails?.notes ||
        contactDetails.organizationDetails?.notes ||
        '';
      setNotesValue(notes);
    }
  }, [contactDetails]);

  // Notes save handler (auto-save on blur)
  const handleNotesSave = async () => {
    if (!contactDetails) return;

    const currentNotes =
      contactDetails.personDetails?.notes ||
      contactDetails.organizationDetails?.notes ||
      '';
    if (notesValue === currentNotes) return; // No changes

    setIsSavingNotes(true);
    try {
      await contactsApi.update(contact.id, { notes: notesValue || null });
      queryClient.invalidateQueries({ queryKey: contactsKeys.detail(contact.id) });
      queryClient.invalidateQueries({ queryKey: contactsKeys.all });
    } catch (error) {
      console.error('Failed to save notes:', error);
      setNotesValue(currentNotes);
    } finally {
      setIsSavingNotes(false);
    }
  };

  const confirmStatusChange = async () => {
    if (!pendingStatus) return;
    setIsStatusChanging(true);
    try {
      await contactsApi.update(contact.id, { isActive: pendingStatus === 'active' });
      queryClient.invalidateQueries({ queryKey: contactsKeys.all });
      queryClient.invalidateQueries({ queryKey: contactsKeys.detail(contact.id) });
      toast.success(
        `Contact ${pendingStatus === 'active' ? 'activated' : 'deactivated'} successfully`
      );
      setPendingStatus('');
    } catch (error) {
      toast.error('Failed to update status');
    } finally {
      setIsStatusChanging(false);
    }
  };

  const handleAddRole = (
    roleType: RoleType,
    data: CreatePlayerDto | CreatePartnerDto | CreateHncMemberDto
  ) => {
    addRole(roleType, data);
    setIsAddRoleModalOpen(false);
  };

  const handleUpdateRole = (roleType: RoleType, data: any) => {
    if (!editingRole) return;
    editRole(roleType, editingRole.role.id, data);
    setEditingRole(null);
  };

  const handleRemoveRole = () => {
    if (!removingRole) return;
    removeRole(removingRole.type, removingRole.role.id);
    setRemovingRole(null);
  };

  const tabs: { id: SidePanelTab; label: string }[] = [
    { id: 'details', label: 'Details' },
    { id: 'gaming-accounts', label: 'Gaming Accounts' },
    { id: 'deals', label: 'Deals' },
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
          <h3 className="text-lg font-semibold text-foreground">
            {contact.displayName}
          </h3>
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
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 px-2 py-2.5 text-xs font-medium whitespace-nowrap transition-colors ${
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
                          <div
                            key={p.id}
                            className="group relative inline-flex items-center"
                          >
                            <RoleBadge type="player" />
                            <div className="hidden group-hover:flex items-center gap-0.5 ml-1">
                              <button
                                onClick={() =>
                                  setEditingRole({ type: 'player', role: p })
                                }
                                className="p-0.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                title="Edit player role"
                              >
                                <Pencil className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() =>
                                  setRemovingRole({ type: 'player', role: p })
                                }
                                className="p-0.5 rounded text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                title="Remove player role"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                        {roles?.partners.map((p) => (
                          <div
                            key={p.id}
                            className="group relative inline-flex items-center"
                          >
                            <RoleBadge type="partner" />
                            <div className="hidden group-hover:flex items-center gap-0.5 ml-1">
                              <button
                                onClick={() =>
                                  setEditingRole({ type: 'partner', role: p })
                                }
                                className="p-0.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                title="Edit partner role"
                              >
                                <Pencil className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() =>
                                  setRemovingRole({ type: 'partner', role: p })
                                }
                                className="p-0.5 rounded text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                title="Remove partner role"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                        {roles?.hncMembers.map((m) => (
                          <div
                            key={m.id}
                            className="group relative inline-flex items-center"
                          >
                            <RoleBadge type="hnc_member" />
                            <div className="hidden group-hover:flex items-center gap-0.5 ml-1">
                              <button
                                onClick={() =>
                                  setEditingRole({ type: 'hnc_member', role: m })
                                }
                                className="p-0.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                title="Edit HNC member role"
                              >
                                <Pencil className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() =>
                                  setRemovingRole({ type: 'hnc_member', role: m })
                                }
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
                      <span className="text-sm text-muted-foreground italic">
                        No roles assigned
                      </span>
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
                    <h4 className="text-sm font-medium text-foreground mb-3">
                      Person Details
                    </h4>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <DetailRow
                          label="First Name"
                          value={contactDetails.personDetails.firstName}
                        />
                        <DetailRow
                          label="Last Name"
                          value={contactDetails.personDetails.lastName || '\u2014'}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <DetailRow
                          label="Email"
                          value={contactDetails.personDetails.email || '\u2014'}
                        />
                        <DetailRow
                          label="Mobile"
                          value={contactDetails.personDetails.mobileNumber || '\u2014'}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <DetailRow
                          label="Country"
                          value={contactDetails.personDetails.country || '\u2014'}
                        />
                        <DetailRow
                          label="Area"
                          value={contactDetails.personDetails.area || '\u2014'}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Organization Details */}
                {contactDetails?.organizationDetails && (
                  <div className="border-t border-border pt-4">
                    <h4 className="text-sm font-medium text-foreground mb-3">
                      Organization Details
                    </h4>
                    <div className="space-y-3">
                      <DetailRow
                        label="Legal Name"
                        value={contactDetails.organizationDetails.legalName}
                      />
                      <DetailRow
                        label="Registration #"
                        value={
                          contactDetails.organizationDetails.registrationNumber ||
                          '\u2014'
                        }
                      />
                      <DetailRow
                        label="Tax ID"
                        value={contactDetails.organizationDetails.taxId || '\u2014'}
                      />
                      <DetailRow
                        label="Country"
                        value={contactDetails.organizationDetails.country || '\u2014'}
                      />
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
                  message={`Are you sure you want to remove the ${
                    removingRole?.type === 'hnc_member'
                      ? 'HNC Member'
                      : removingRole?.type === 'player'
                        ? 'Player'
                        : 'Partner'
                  } role? This action cannot be undone.`}
                  confirmText="Remove"
                  variant="danger"
                  isLoading={isRemovingRole}
                />
              </div>
            )}

            {/* Gaming Accounts Tab */}
            {activeTab === 'gaming-accounts' && (
              <div className="p-4 text-center text-muted-foreground">
                <p className="text-sm">Gaming accounts will be displayed here.</p>
                <p className="text-xs mt-1">API integration pending</p>
              </div>
            )}

            {/* Deals Tab */}
            {activeTab === 'deals' && (
              <div className="p-4 text-center text-muted-foreground">
                <p className="text-sm">Deal links will be displayed here.</p>
                <p className="text-xs mt-1">API integration pending</p>
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
                    <StatusBadge
                      status={
                        (contactDetails?.isActive ?? contact.isActive)
                          ? 'active'
                          : 'inactive'
                      }
                    />
                  </div>
                </div>

                {/* Change Status */}
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Change Status
                  </label>
                  <CustomSelect
                    value={pendingStatus || ''}
                    onChange={(v) => setPendingStatus(v as 'active' | 'inactive' | '')}
                    disabled={isStatusChanging}
                    placeholder="Select new status..."
                    options={
                      (contactDetails?.isActive ?? contact.isActive)
                        ? [
                            { value: '', label: 'Select new status...' },
                            { value: 'inactive', label: 'Inactive' },
                          ]
                        : [
                            { value: '', label: 'Select new status...' },
                            { value: 'active', label: 'Active' },
                          ]
                    }
                  />
                </div>

                {/* Inline confirmation */}
                {pendingStatus && (
                  <div className="p-3 rounded-md bg-muted/50 border border-border">
                    <p className="text-sm text-foreground mb-3">
                      Change status to{' '}
                      <StatusBadge status={pendingStatus as 'active' | 'inactive'} />?
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

      {/* Footer with Edit and Delete buttons - only on Details tab */}
      {activeTab === 'details' && (
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
      )}
    </div>
  );
}
