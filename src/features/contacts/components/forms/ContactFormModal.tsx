/**
 * ContactFormModal Component
 *
 * Modal wrapper for ContactForm using FormModal from ui-components.
 * Handles both create and edit modes.
 */

import { useRef } from 'react';
import { FormModal } from '@hnc-partners/ui-components';
import { ContactForm } from '@/components/ContactForm';
import type { ContactFormHandle } from '@/components/ContactForm';
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
  const formRef = useRef<ContactFormHandle>(null);
  const title = mode === 'create' ? 'Create Contact' : 'Edit Contact';
  const submitLabel = mode === 'create' ? 'Create Contact' : 'Update Contact';

  const handleFormModalSubmit = () => {
    // Trigger react-hook-form validation and submit via the ref
    formRef.current?.requestSubmit();
  };

  return (
    <FormModal
      title={title}
      open={isOpen}
      onOpenChange={(open) => { if (!open) onClose(); }}
      onSubmit={handleFormModalSubmit}
      submitLabel={submitLabel}
      cancelLabel="Cancel"
      loading={isSubmitting}
      size="lg"
    >
      {mode === 'edit' && contact ? (
        <ContactForm
          ref={formRef}
          onSubmit={onSubmit}
          contact={contact}
          isEditMode={true}
        />
      ) : (
        <ContactForm
          ref={formRef}
          onSubmit={onSubmit}
        />
      )}
    </FormModal>
  );
}
