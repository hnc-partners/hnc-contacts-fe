import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle, User, Building2 } from 'lucide-react';
import { Button } from '@hnc-partners/ui-components';
import type { CreateContactDto, ContactWithDetails, UpdateContactDto } from '@/types/contacts';

// ===== VALIDATION SCHEMA =====

/**
 * Unified contact schema with conditional validation via superRefine.
 * This approach is simpler than discriminated unions and works better
 * with react-hook-form's watch() for conditional field rendering.
 */
const contactFormSchema = z.object({
  contactType: z.enum(['person', 'organization']),
  // Person fields (validated only when contactType === 'person')
  firstName: z.string().optional(),
  lastName: z.string().optional().nullable(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')).nullable(),
  mobileNumber: z.string().optional().nullable(),
  // Organization fields (validated only when contactType === 'organization')
  legalName: z.string().optional(),
  taxId: z.string().optional().nullable(),
  registrationNumber: z.string().optional().nullable(),
  // Common fields
  country: z.string().optional().nullable(),
  joinDate: z.string().optional().nullable(),
}).superRefine((data, ctx) => {
  // Conditional validation based on contactType
  if (data.contactType === 'person') {
    if (!data.firstName || data.firstName.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['firstName'],
        message: 'First name is required',
      });
    }
  } else if (data.contactType === 'organization') {
    if (!data.legalName || data.legalName.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['legalName'],
        message: 'Legal name is required',
      });
    }
  }
});

type ContactFormData = z.infer<typeof contactFormSchema>;

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
 * Uses react-hook-form with Zod validation and conditional field rendering.
 * In edit mode, the type selector is disabled (can't change Person to Org).
 */
export function ContactForm({
  onSubmit,
  onCancel,
  isSubmitting = false,
  contact,
  isEditMode = false,
}: ContactFormProps) {
  // Determine initial values from contact data or defaults
  const getDefaultValues = (): ContactFormData => {
    if (contact) {
      // Format joinDate for date input (YYYY-MM-DD)
      const joinDateValue = contact.joinDate ? contact.joinDate.split('T')[0] : '';

      if (contact.contactType === 'person' && contact.personDetails) {
        return {
          contactType: 'person',
          firstName: contact.personDetails.firstName,
          lastName: contact.personDetails.lastName || '',
          email: contact.personDetails.email || '',
          mobileNumber: contact.personDetails.mobileNumber || '',
          country: contact.personDetails.country || '',
          joinDate: joinDateValue,
          // Org fields (unused but required by schema)
          legalName: '',
          taxId: '',
          registrationNumber: '',
        };
      } else if (contact.contactType === 'organization' && contact.organizationDetails) {
        return {
          contactType: 'organization',
          legalName: contact.organizationDetails.legalName,
          taxId: contact.organizationDetails.taxId || '',
          registrationNumber: contact.organizationDetails.registrationNumber || '',
          country: contact.organizationDetails.country || '',
          joinDate: joinDateValue,
          // Person fields (unused but required by schema)
          firstName: '',
          lastName: '',
          email: '',
          mobileNumber: '',
        };
      }
    }
    // Default for new contact
    return {
      contactType: 'person',
      firstName: '',
      lastName: '',
      email: '',
      mobileNumber: '',
      country: '',
      joinDate: '',
      legalName: '',
      taxId: '',
      registrationNumber: '',
    };
  };

  const {
    register,
    handleSubmit,
    watch,
    reset,
    control,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: getDefaultValues(),
  });

  // Watch contactType to conditionally render fields
  const contactType = watch('contactType');

  // Reset form when contact prop changes (e.g., opening edit modal for different contact)
  useEffect(() => {
    if (contact) {
      reset(getDefaultValues());
    }
  }, [contact, reset]);

  const onFormSubmit = (data: ContactFormData) => {
    if (data.contactType === 'person') {
      const displayName = [data.firstName, data.lastName]
        .filter(Boolean)
        .join(' ')
        .trim();

      if (isEditMode) {
        // For edit mode, send UpdateContactDto (no contactType)
        onSubmit({
          displayName,
          firstName: data.firstName || '',
          lastName: data.lastName || null,
          email: data.email || null,
          mobileNumber: data.mobileNumber || null,
          country: data.country || null,
          joinDate: data.joinDate || null,
        });
      } else {
        // For create mode, send CreateContactDto (with contactType)
        onSubmit({
          contactType: 'person',
          displayName,
          firstName: data.firstName || '',
          lastName: data.lastName || null,
          email: data.email || null,
          mobileNumber: data.mobileNumber || null,
          country: data.country || null,
          joinDate: data.joinDate || null,
        });
      }
    } else {
      if (isEditMode) {
        // For edit mode, send UpdateContactDto (no contactType)
        onSubmit({
          displayName: data.legalName || '',
          legalName: data.legalName || '',
          taxId: data.taxId || null,
          registrationNumber: data.registrationNumber || null,
          country: data.country || null,
          joinDate: data.joinDate || null,
        });
      } else {
        // For create mode, send CreateContactDto (with contactType)
        onSubmit({
          contactType: 'organization',
          displayName: data.legalName || '',
          legalName: data.legalName || '',
          taxId: data.taxId || null,
          registrationNumber: data.registrationNumber || null,
          country: data.country || null,
          joinDate: data.joinDate || null,
        });
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      {/* Type Selector - Tab Style (disabled in edit mode) */}
      <Controller
        control={control}
        name="contactType"
        render={({ field }) => (
          <div className={`flex rounded-lg border border-border p-1 bg-muted/30 ${isEditMode ? 'pointer-events-none opacity-50' : ''}`}>
            <Button
              type="button"
              variant="ghost"
              onClick={() => !isEditMode && field.onChange('person')}
              disabled={isEditMode}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                field.value === 'person'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <User className="h-4 w-4" />
              Person
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => !isEditMode && field.onChange('organization')}
              disabled={isEditMode}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                field.value === 'organization'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Building2 className="h-4 w-4" />
              Organization
            </Button>
          </div>
        )}
      />

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
              {...register('firstName')}
              className={`w-full h-9 px-3 rounded-md border bg-background text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring ${
                errors.firstName ? 'border-red-500' : 'border-input'
              }`}
              placeholder="Enter first name"
            />
            {errors.firstName && (
              <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5" />
                {errors.firstName.message}
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
              {...register('lastName')}
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
              {...register('email')}
              className={`w-full h-9 px-3 rounded-md border bg-background text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring ${
                errors.email ? 'border-red-500' : 'border-input'
              }`}
              placeholder="Enter email address"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5" />
                {errors.email.message}
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
              {...register('mobileNumber')}
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
              {...register('country')}
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
              {...register('joinDate')}
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
              {...register('legalName')}
              className={`w-full h-9 px-3 rounded-md border bg-background text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring ${
                errors.legalName ? 'border-red-500' : 'border-input'
              }`}
              placeholder="Enter legal name"
            />
            {errors.legalName && (
              <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5" />
                {errors.legalName.message}
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
              {...register('taxId')}
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
              {...register('registrationNumber')}
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
              {...register('country')}
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
              {...register('joinDate')}
              className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
      )}

      {/* Footer Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={isSubmitting}
        >
          {isSubmitting
            ? (isEditMode ? 'Updating...' : 'Creating...')
            : (isEditMode ? 'Update Contact' : 'Create Contact')}
        </Button>
      </div>
    </form>
  );
}
