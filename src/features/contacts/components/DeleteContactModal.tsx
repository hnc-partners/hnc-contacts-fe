/**
 * DeleteContactModal Component
 *
 * Confirmation modal for deleting a contact.
 * Uses ConfirmDialog from ui-components shared composite.
 */

import { ConfirmDialog } from '@hnc-partners/ui-components';
import type { Contact } from '../types';

interface DeleteContactModalProps {
  contact: Contact | null;
  isOpen: boolean;
  isLoading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteContactModal({
  contact,
  isOpen,
  isLoading,
  onClose,
  onConfirm,
}: DeleteContactModalProps) {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Delete Contact"
      message="Are you sure you want to delete this contact? This action cannot be undone."
      itemDetails={[
        { label: 'Name', value: contact?.displayName || '' },
        {
          label: 'Type',
          value: contact?.contactType === 'person' ? 'Person' : 'Organization',
        },
        { label: 'Join Date', value: '\u2014' },
      ]}
      confirmText="Delete"
      variant="danger"
      isLoading={isLoading}
    />
  );
}
