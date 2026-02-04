/**
 * Contacts Feature
 *
 * Public exports for the contacts feature module.
 */

// Main page component
export { ContactsPage } from './components/ContactsPage';

// Sub-components (for direct use if needed)
export { DeleteContactModal } from './components/DeleteContactModal';
export { DetailRow } from './components/DetailRow';
export { SidePanel } from './components/SidePanel';
export { StatusBadge } from './components/StatusBadge';
export { ContactFormModal } from './components/forms/ContactFormModal';

// Hooks
export {
  useContacts,
  useContact,
  useContactRoles,
  useCreateContact,
  useUpdateContact,
  useDeleteContact,
  useCreateRole,
  useUpdateRole,
  useDeleteRole,
  contactsKeys,
} from './hooks/use-contacts';

// Types and constants
export * from './types';
