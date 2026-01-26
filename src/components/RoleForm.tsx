import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle, Gamepad2, Handshake, Users } from 'lucide-react';
import { Button } from '@hnc-partners/ui-components';
import { CustomSelect } from '@/components/ui/custom-select';
import type {
  RoleType,
  Player,
  Partner,
  HncMember,
  CreatePlayerDto,
  CreatePartnerDto,
  CreateHncMemberDto,
} from '@/types/contacts';

// ===== VALIDATION SCHEMA =====

/**
 * Unified role schema with conditional validation via superRefine.
 * This approach handles the three distinct role types (Player, Partner, HNC Member)
 * with their different field requirements in a single form.
 */
const roleFormSchema = z.object({
  roleType: z.enum(['player', 'partner', 'hnc_member']),
  // Player fields
  shortName: z.string().optional(),
  playerStatus: z.enum(['active', 'inactive']).optional(),
  preferredCurrency: z.string().optional().nullable(),
  paymentMethod: z.string().optional().nullable(),
  // Partner fields (shortName is shared)
  partnerStatus: z.enum(['active', 'inactive']).optional(),
  canBeUpstream: z.boolean().optional(),
  canBeDownstream: z.boolean().optional(),
  // HNC Member fields
  fullName: z.string().optional(),
  memberType: z.enum(['founder', 'employee']).optional(),
  memberCode: z.string().optional(),
  joinedDate: z.string().optional(),
  department: z.string().optional().nullable(),
}).superRefine((data, ctx) => {
  // Conditional validation based on roleType
  if (data.roleType === 'player' || data.roleType === 'partner') {
    if (!data.shortName || data.shortName.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['shortName'],
        message: 'Short name is required',
      });
    }
  } else if (data.roleType === 'hnc_member') {
    if (!data.fullName || data.fullName.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['fullName'],
        message: 'Full name is required',
      });
    }
    if (!data.memberType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['memberType'],
        message: 'Member type is required',
      });
    }
  }
});

type RoleFormData = z.infer<typeof roleFormSchema>;

// ===== CONSTANTS =====

const CURRENCY_OPTIONS = [
  { value: '', label: 'Select currency' },
  { value: 'USD', label: 'USD' },
  { value: 'EUR', label: 'EUR' },
  { value: 'GBP', label: 'GBP' },
];

const PAYMENT_METHOD_OPTIONS = [
  { value: '', label: 'Select payment method' },
  { value: 'chips', label: 'Chips' },
  { value: 'bank', label: 'Bank Transfer' },
  { value: 'crypto', label: 'Crypto' },
  { value: 'other', label: 'Other' },
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

const MEMBER_TYPE_OPTIONS = [
  { value: '', label: 'Select member type' },
  { value: 'founder', label: 'Founder' },
  { value: 'employee', label: 'Employee' },
];

// ===== ROLE TYPE CONFIG =====

const ROLE_TYPE_CONFIG: Record<RoleType, { label: string; Icon: typeof Gamepad2 }> = {
  player: { label: 'Player', Icon: Gamepad2 },
  partner: { label: 'Partner', Icon: Handshake },
  hnc_member: { label: 'HNC Member', Icon: Users },
};

// ===== PROPS =====

interface RoleFormProps {
  contactId: string;
  contactName?: string;
  existingRoleTypes: RoleType[];
  onSubmit: (roleType: RoleType, data: any) => void;
  onCancel: () => void;
  isLoading: boolean;
  // Edit mode props
  isEditMode?: boolean;
  editRoleType?: RoleType;
  editRole?: Player | Partner | HncMember;
}

/**
 * RoleForm Component
 *
 * Dynamic form for creating/editing roles (Player, Partner, HNC Member).
 * Uses react-hook-form with Zod validation and conditional field rendering.
 */
export function RoleForm({
  contactId,
  contactName,
  existingRoleTypes,
  onSubmit,
  onCancel,
  isLoading,
  isEditMode = false,
  editRoleType,
  editRole,
}: RoleFormProps) {
  const availableRoleTypes: RoleType[] = (['player', 'partner', 'hnc_member'] as RoleType[]).filter(
    (type) => !existingRoleTypes.includes(type)
  );
  const initialRoleType = isEditMode && editRoleType ? editRoleType : (availableRoleTypes[0] || 'player');

  // Build default values based on mode and existing role data
  const getDefaultValues = (): RoleFormData => {
    if (isEditMode && editRole && editRoleType) {
      switch (editRoleType) {
        case 'player': {
          const player = editRole as Player;
          return {
            roleType: 'player',
            shortName: player.shortName,
            playerStatus: player.playerStatus,
            preferredCurrency: player.preferredCurrency || '',
            paymentMethod: player.paymentMethod || '',
            // Unused fields
            partnerStatus: 'active',
            canBeUpstream: false,
            canBeDownstream: false,
            fullName: '',
            memberType: 'employee',
            memberCode: '',
            joinedDate: '',
            department: '',
          };
        }
        case 'partner': {
          const partner = editRole as Partner;
          return {
            roleType: 'partner',
            shortName: partner.shortName,
            partnerStatus: partner.partnerStatus,
            canBeUpstream: partner.canBeUpstream,
            canBeDownstream: partner.canBeDownstream,
            // Unused fields
            playerStatus: 'active',
            preferredCurrency: '',
            paymentMethod: '',
            fullName: '',
            memberType: 'employee',
            memberCode: '',
            joinedDate: '',
            department: '',
          };
        }
        case 'hnc_member': {
          const member = editRole as HncMember;
          return {
            roleType: 'hnc_member',
            fullName: member.fullName,
            memberType: member.memberType,
            memberCode: member.memberCode,
            joinedDate: '',
            department: member.department || '',
            // Unused fields
            shortName: '',
            playerStatus: 'active',
            preferredCurrency: '',
            paymentMethod: '',
            partnerStatus: 'active',
            canBeUpstream: false,
            canBeDownstream: false,
          };
        }
      }
    }

    // Default for new role
    return {
      roleType: initialRoleType,
      shortName: contactName || '',
      playerStatus: 'active',
      preferredCurrency: '',
      paymentMethod: '',
      partnerStatus: 'active',
      canBeUpstream: false,
      canBeDownstream: false,
      fullName: contactName || '',
      memberType: 'employee',
      memberCode: '',
      joinedDate: new Date().toISOString().split('T')[0],
      department: '',
    };
  };

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors },
  } = useForm<RoleFormData>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: getDefaultValues(),
  });

  // Watch roleType to conditionally render fields
  const roleType = watch('roleType');

  const onFormSubmit = (data: RoleFormData) => {
    if (data.roleType === 'player') {
      if (isEditMode) {
        const updateData: Record<string, unknown> = {
          shortName: data.shortName,
          playerStatus: data.playerStatus || 'active',
        };
        if (data.preferredCurrency) updateData.preferredCurrency = data.preferredCurrency;
        if (data.paymentMethod) updateData.paymentMethod = data.paymentMethod;
        onSubmit('player', updateData);
      } else {
        const dto: CreatePlayerDto = {
          contactId,
          shortName: data.shortName || '',
          playerStatus: data.playerStatus || 'active',
        };
        if (data.preferredCurrency) dto.preferredCurrency = data.preferredCurrency;
        if (data.paymentMethod) dto.paymentMethod = data.paymentMethod as any;
        onSubmit('player', dto);
      }
    } else if (data.roleType === 'partner') {
      if (isEditMode) {
        onSubmit('partner', {
          shortName: data.shortName,
          partnerStatus: data.partnerStatus || 'active',
          canBeUpstream: data.canBeUpstream ?? false,
          canBeDownstream: data.canBeDownstream ?? false,
        });
      } else {
        const dto: CreatePartnerDto = {
          contactId,
          shortName: data.shortName || '',
          partnerStatus: data.partnerStatus || 'active',
          canBeUpstream: data.canBeUpstream ?? false,
          canBeDownstream: data.canBeDownstream ?? false,
        };
        onSubmit('partner', dto);
      }
    } else {
      if (isEditMode) {
        const updateData: Record<string, unknown> = {
          fullName: data.fullName,
          memberType: data.memberType,
        };
        if (data.department) updateData.department = data.department;
        onSubmit('hnc_member', updateData);
      } else {
        const dto: CreateHncMemberDto = {
          contactId,
          fullName: data.fullName || '',
          memberType: data.memberType || 'employee',
          memberCode: data.memberCode || '',
          joinedDate: data.joinedDate || '',
        };
        if (data.department) dto.department = data.department;
        onSubmit('hnc_member', dto);
      }
    }
  };

  const isRoleTypeDisabled = (type: RoleType) => isEditMode ? type !== editRoleType : existingRoleTypes.includes(type);
  const allRolesAssigned = !isEditMode && availableRoleTypes.length === 0;

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      {/* Role Type Selector */}
      <Controller
        control={control}
        name="roleType"
        render={({ field }) => (
          <div className="flex rounded-lg border border-border p-1 bg-muted/30">
            {(['player', 'partner', 'hnc_member'] as RoleType[]).map((type) => {
              const config = ROLE_TYPE_CONFIG[type];
              const disabled = isRoleTypeDisabled(type);
              const isActive = field.value === type;

              return (
                <Button
                  key={type}
                  type="button"
                  variant="ghost"
                  onClick={() => !disabled && field.onChange(type)}
                  disabled={disabled}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-background text-foreground shadow-sm'
                      : disabled
                        ? 'text-muted-foreground/50 cursor-not-allowed'
                        : 'text-muted-foreground hover:text-foreground'
                  }`}
                  title={disabled ? 'Already assigned' : undefined}
                >
                  <config.Icon className="h-4 w-4" />
                  {config.label}
                </Button>
              );
            })}
          </div>
        )}
      />

      {allRolesAssigned && (
        <div className="rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3">
          <p className="text-sm text-amber-700 dark:text-amber-400">
            This contact already has all available role types assigned.
          </p>
        </div>
      )}

      {!allRolesAssigned && (
        <div className="min-h-[370px]">
          {roleType === 'player' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Short Name
                  <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-brand" title="Required" />
                </label>
                <input
                  type="text"
                  {...register('shortName')}
                  className={`w-full h-9 px-3 rounded-md border bg-background text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring ${
                    errors.shortName ? 'border-red-500' : 'border-input'
                  }`}
                  placeholder="Enter short name"
                />
                {errors.shortName && (
                  <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {errors.shortName.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Status</label>
                <Controller
                  control={control}
                  name="playerStatus"
                  render={({ field }) => (
                    <CustomSelect
                      value={field.value || 'active'}
                      onChange={(v) => field.onChange(v as 'active' | 'inactive')}
                      options={STATUS_OPTIONS}
                    />
                  )}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Currency</label>
                <Controller
                  control={control}
                  name="preferredCurrency"
                  render={({ field }) => (
                    <CustomSelect
                      value={field.value || ''}
                      onChange={(v) => field.onChange(v)}
                      options={CURRENCY_OPTIONS}
                      placeholder="Select currency"
                    />
                  )}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Payment Method</label>
                <Controller
                  control={control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <CustomSelect
                      value={field.value || ''}
                      onChange={(v) => field.onChange(v)}
                      options={PAYMENT_METHOD_OPTIONS}
                      placeholder="Select payment method"
                    />
                  )}
                />
              </div>
            </div>
          )}

          {roleType === 'partner' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Short Name
                  <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-brand" title="Required" />
                </label>
                <input
                  type="text"
                  {...register('shortName')}
                  className={`w-full h-9 px-3 rounded-md border bg-background text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring ${
                    errors.shortName ? 'border-red-500' : 'border-input'
                  }`}
                  placeholder="Enter short name"
                />
                {errors.shortName && (
                  <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {errors.shortName.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Status</label>
                <Controller
                  control={control}
                  name="partnerStatus"
                  render={({ field }) => (
                    <CustomSelect
                      value={field.value || 'active'}
                      onChange={(v) => field.onChange(v as 'active' | 'inactive')}
                      options={STATUS_OPTIONS}
                    />
                  )}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="canBeUpstream"
                  {...register('canBeUpstream')}
                  className="h-4 w-4 rounded border-input"
                />
                <label htmlFor="canBeUpstream" className="text-sm font-medium text-foreground cursor-pointer">
                  Can be upstream
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="canBeDownstream"
                  {...register('canBeDownstream')}
                  className="h-4 w-4 rounded border-input"
                />
                <label htmlFor="canBeDownstream" className="text-sm font-medium text-foreground cursor-pointer">
                  Can be downstream
                </label>
              </div>
            </div>
          )}

          {roleType === 'hnc_member' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Full Name
                  <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-brand" title="Required" />
                </label>
                <input
                  type="text"
                  {...register('fullName')}
                  className={`w-full h-9 px-3 rounded-md border bg-background text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring ${
                    errors.fullName ? 'border-red-500' : 'border-input'
                  }`}
                  placeholder="Enter full name"
                />
                {errors.fullName && (
                  <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {errors.fullName.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Member Code
                  <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-brand" title="Required" />
                </label>
                <input
                  type="text"
                  {...register('memberCode')}
                  className={`w-full h-9 px-3 rounded-md border bg-background text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring ${
                    errors.memberCode ? 'border-red-500' : 'border-input'
                  }`}
                  placeholder="e.g., JD01"
                  disabled={isEditMode}
                />
                {errors.memberCode && (
                  <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {errors.memberCode.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Member Type
                  <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-brand" title="Required" />
                </label>
                <Controller
                  control={control}
                  name="memberType"
                  render={({ field }) => (
                    <CustomSelect
                      value={field.value || ''}
                      onChange={(v) => field.onChange(v as 'founder' | 'employee')}
                      options={MEMBER_TYPE_OPTIONS}
                      placeholder="Select member type"
                      error={!!errors.memberType}
                    />
                  )}
                />
                {errors.memberType && (
                  <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {errors.memberType.message}
                  </p>
                )}
              </div>

              {!isEditMode && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Joined Date
                    <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-brand" title="Required" />
                  </label>
                  <input
                    type="date"
                    {...register('joinedDate')}
                    className={`w-full h-9 px-3 rounded-md border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring ${
                      errors.joinedDate ? 'border-red-500' : 'border-input'
                    }`}
                  />
                  {errors.joinedDate && (
                    <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {errors.joinedDate.message}
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Department</label>
                <input
                  type="text"
                  {...register('department')}
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Enter department"
                />
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={isLoading || allRolesAssigned}
        >
          {isLoading ? (isEditMode ? 'Updating...' : 'Adding...') : (isEditMode ? 'Update Role' : 'Add Role')}
        </Button>
      </div>
    </form>
  );
}
