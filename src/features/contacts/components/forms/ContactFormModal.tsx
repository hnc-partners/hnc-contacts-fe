/**
 * ContactFormModal Component
 *
 * Modal wrapper for ContactForm, handles both create and edit modes.
 */

import { Modal } from '@/components/Modal';
import { ContactForm } from '@/components/ContactForm';
import type { ContactWithDetails, CreateContactDto, UpdateContactDto } from '../../types';

interface ContactFormModalProps {
  mode: 'create' | 'edit';
  isOpen: boolean;
  contact?: ContactWithDetails | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (data: CreateContactDto | UpdateContactDto) => void;
}

export function ContactFormModal({
  mode,
  isOpen,
  contact,
  isSubmitting,
  onClose,
  onSubmit,
}: ContactFormModalProps) {
  const title = mode === 'create' ? 'Create Contact' : 'Edit Contact';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} accentColor="teal">
      {mode === 'edit' && contact ? (
        <ContactForm
          onSubmit={onSubmit}
          onCancel={onClose}
          isSubmitting={isSubmitting}
          contact={contact}
          isEditMode={true}
        />
      ) : (
        <ContactForm
          onSubmit={onSubmit}
          onCancel={onClose}
          isSubmitting={isSubmitting}
        />
      )}
    </Modal>
  );
}
