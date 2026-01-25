/**
 * Contacts Route
 *
 * Route definition for the contacts page.
 */

import { createFileRoute } from '@tanstack/react-router';
import { ContactsPage } from '@/features/contacts';

export const Route = createFileRoute('/contacts')({
  component: ContactsPage,
});
