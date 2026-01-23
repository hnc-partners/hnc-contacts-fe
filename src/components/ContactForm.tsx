import { useState, useEffect } from 'react';
import { z } from 'zod';
import { AlertCircle, User, Building2 } from 'lucide-react';
import type { ContactType, CreateContactDto, ContactWithDetails, UpdateContactDto } from '@/types/contacts';

// ===== VALIDATION SCHEMAS =====

const personSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().optional().nullable(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')).nullable(),
  mobileNumber: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  joinDate: z.string().optional().nullable(),
});

const organizationSchema = z.object({
  legalName: z.string().min(1, 'Legal name is required'),
  taxId: z.string().optional().nullable(),
  registrationNumber: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  joinDate: z.string().optional().nullable(),
});

type PersonFormData = z.infer<typeof personSchema>;
type OrganizationFormData = z.infer<typeof organizationSchema>;

// ===== PROPS =====

interface ContactFormProps {
  onSubmit: (data: CreateContactDto | UpdateContactDto) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  /** Contact data for edit mode - pre-fills form fields */
  contact?: ContactWithDetails;
  /** When true, disables the type selector (can't change Person to Org) */
  isEditMode?: boolean;
}

/**
 * ContactForm Component
 *
 * Dynamic form for creating or editing contacts (Person or Organization).
 * Features type selector styled as tabs, Zod validation, and teal accent colors.
 * In edit mode, the type selector is disabled (can't change Person to Org).
 */
export function ContactForm({
  onSubmit,
  onCancel,
  isSubmitting = false,
  contact,
  isEditMode = false,
}: ContactFormProps) {
  // Determine initial contact type from contact data or default to 'person'
  const initialContactType = contact?.contactType || 'person';
  const [contactType, setContactType] = useState<ContactType>(initialContactType);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Person form state - initialize from contact if in edit mode
  const [personData, setPersonData] = useState<PersonFormData>(() => {
    if (contact?.personDetails) {
      return {
        firstName: contact.personDetails.firstName,
        lastName: contact.personDetails.lastName || '',
        email: contact.personDetails.email || '',
        mobileNumber: contact.personDetails.mobileNumber || '',
        country: contact.personDetails.country || '',
        joinDate: '',
      };
    }
    return {
      firstName: '',
      lastName: '',
      email: '',
      mobileNumber: '',
      country: '',
      joinDate: '',
    };
  });

  // Organization form state - initialize from contact if in edit mode
  const [orgData, setOrgData] = useState<OrganizationFormData>(() => {
    if (contact?.organizationDetails) {
      return {
        legalName: contact.organizationDetails.legalName,
        taxId: contact.organizationDetails.taxId || '',
        registrationNumber: contact.organizationDetails.registrationNumber || '',
        country: contact.organizationDetails.country || '',
        joinDate: '',
      };
    }
    return {
      legalName: '',
      taxId: '',
      registrationNumber: '',
      country: '',
      joinDate: '',
    };
  });

  // Update form data when contact changes (e.g., when opening edit modal for different contact)
  useEffect(() => {
    if (contact) {
      setContactType(contact.contactType);
      if (contact.personDetails) {
        setPersonData({
          firstName: contact.personDetails.firstName,
          lastName: contact.personDetails.lastName || '',
          email: contact.personDetails.email || '',
          mobileNumber: contact.personDetails.mobileNumber || '',
          country: contact.personDetails.country || '',
          joinDate: '',
        });
      }
      if (contact.organizationDetails) {
        setOrgData({
          legalName: contact.organizationDetails.legalName,
          taxId: contact.organizationDetails.taxId || '',
          registrationNumber: contact.organizationDetails.registrationNumber || '',
          country: contact.organizationDetails.country || '',
          joinDate: '',
        });
      }
    }
  }, [contact]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (contactType === 'person') {
      const result = personSchema.safeParse(personData);
      if (!result.success) {
        const fieldErrors: Record<string, string> = {};
        result.error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
        return;
      }

      const displayName = [personData.firstName, personData.lastName]
        .filter(Boolean)
        .join(' ')
        .trim();

      if (isEditMode) {
        // For edit mode, send UpdateContactDto (no contactType)
        onSubmit({
          displayName,
          firstName: personData.firstName,
          lastName: personData.lastName || null,
          email: personData.email || null,
          mobileNumber: personData.mobileNumber || null,
          country: personData.country || null,
          joinDate: personData.joinDate || null,
        });
      } else {
        // For create mode, send CreateContactDto (with contactType)
        onSubmit({
          contactType: 'person',
          displayName,
          firstName: personData.firstName,
          lastName: personData.lastName || null,
          email: personData.email || null,
          mobileNumber: personData.mobileNumber || null,
          country: personData.country || null,
          joinDate: personData.joinDate || null,
        });
      }
    } else {
      const result = organizationSchema.safeParse(orgData);
      if (!result.success) {
        const fieldErrors: Record<string, string> = {};
        result.error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
        return;
      }

      if (isEditMode) {
        // For edit mode, send UpdateContactDto (no contactType)
        onSubmit({
          displayName: orgData.legalName,
          legalName: orgData.legalName,
          taxId: orgData.taxId || null,
          registrationNumber: orgData.registrationNumber || null,
          country: orgData.country || null,
          joinDate: orgData.joinDate || null,
        });
      } else {
        // For create mode, send CreateContactDto (with contactType)
        onSubmit({
          contactType: 'organization',
          displayName: orgData.legalName,
          legalName: orgData.legalName,
          taxId: orgData.taxId || null,
          registrationNumber: orgData.registrationNumber || null,
          country: orgData.country || null,
          joinDate: orgData.joinDate || null,
        });
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Type Selector - Tab Style (disabled in edit mode) */}
      <div className={`flex rounded-lg border border-border p-1 bg-muted/30 ${isEditMode ? 'pointer-events-none opacity-50' : ''}`}>
        <button
          type="button"
          onClick={() => {
            if (!isEditMode) {
              setContactType('person');
              setErrors({});
            }
          }}
          disabled={isEditMode}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            contactType === 'person'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <User className="h-4 w-4" />
          Person
        </button>
        <button
          type="button"
          onClick={() => {
            if (!isEditMode) {
              setContactType('organization');
              setErrors({});
            }
          }}
          disabled={isEditMode}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            contactType === 'organization'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Building2 className="h-4 w-4" />
          Organization
        </button>
      </div>

      {/* Dynamic Form Fields */}
      {contactType === 'person' ? (
        <div className="space-y-4 min-h-[500px]">
          {/* First Name - Required */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              First Name
              <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-teal-400" title="Required" />
            </label>
            <input
              type="text"
              value={personData.firstName}
              onChange={(e) => setPersonData({ ...personData, firstName: e.target.value })}
              className={`w-full h-9 px-3 rounded-md border bg-background text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring ${
                errors.firstName ? 'border-red-500' : 'border-input'
              }`}
              placeholder="Enter first name"
            />
            {errors.firstName && (
              <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5" />
                {errors.firstName}
              </p>
            )}
          </div>

          {/* Last Name */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Last Name
            </label>
            <input
              type="text"
              value={personData.lastName || ''}
              onChange={(e) => setPersonData({ ...personData, lastName: e.target.value })}
              className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Enter last name"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Email
            </label>
            <input
              type="email"
              value={personData.email || ''}
              onChange={(e) => setPersonData({ ...personData, email: e.target.value })}
              className={`w-full h-9 px-3 rounded-md border bg-background text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring ${
                errors.email ? 'border-red-500' : 'border-input'
              }`}
              placeholder="Enter email address"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5" />
                {errors.email}
              </p>
            )}
          </div>

          {/* Mobile */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Mobile
            </label>
            <input
              type="tel"
              value={personData.mobileNumber || ''}
              onChange={(e) => setPersonData({ ...personData, mobileNumber: e.target.value })}
              className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Enter mobile number"
            />
          </div>

          {/* Country */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Country
            </label>
            <input
              type="text"
              value={personData.country || ''}
              onChange={(e) => setPersonData({ ...personData, country: e.target.value })}
              className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Enter country"
            />
          </div>

          {/* Join Date */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Join Date
            </label>
            <input
              type="date"
              value={personData.joinDate || ''}
              onChange={(e) => setPersonData({ ...personData, joinDate: e.target.value })}
              className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-4 min-h-[500px]">
          {/* Legal Name - Required */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Legal Name
              <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-teal-400" title="Required" />
            </label>
            <input
              type="text"
              value={orgData.legalName}
              onChange={(e) => setOrgData({ ...orgData, legalName: e.target.value })}
              className={`w-full h-9 px-3 rounded-md border bg-background text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring ${
                errors.legalName ? 'border-red-500' : 'border-input'
              }`}
              placeholder="Enter legal name"
            />
            {errors.legalName && (
              <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5" />
                {errors.legalName}
              </p>
            )}
          </div>

          {/* Tax ID */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Tax ID
            </label>
            <input
              type="text"
              value={orgData.taxId || ''}
              onChange={(e) => setOrgData({ ...orgData, taxId: e.target.value })}
              className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Enter tax ID"
            />
          </div>

          {/* Registration Number */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Registration Number
            </label>
            <input
              type="text"
              value={orgData.registrationNumber || ''}
              onChange={(e) => setOrgData({ ...orgData, registrationNumber: e.target.value })}
              className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Enter registration number"
            />
          </div>

          {/* Country */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Country
            </label>
            <input
              type="text"
              value={orgData.country || ''}
              onChange={(e) => setOrgData({ ...orgData, country: e.target.value })}
              className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Enter country"
            />
          </div>

          {/* Join Date */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Join Date
            </label>
            <input
              type="date"
              value={orgData.joinDate || ''}
              onChange={(e) => setOrgData({ ...orgData, joinDate: e.target.value })}
              className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
      )}

      {/* Footer Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="h-9 px-4 rounded-md border border-input text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="h-9 px-4 rounded-md bg-teal-400 text-white text-sm font-medium hover:bg-teal-500 transition-colors disabled:opacity-50"
        >
          {isSubmitting
            ? (isEditMode ? 'Updating...' : 'Creating...')
            : (isEditMode ? 'Update Contact' : 'Create Contact')}
        </button>
      </div>
    </form>
  );
}
