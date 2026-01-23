import { useState } from 'react';
import { z } from 'zod';
import { AlertCircle, Gamepad2, Handshake, Users } from 'lucide-react';
import type {
  RoleType,
  Player,
  Partner,
  HncMember,
  CreatePlayerDto,
  CreatePartnerDto,
  CreateHncMemberDto,
} from '@/types/contacts';

// ===== VALIDATION SCHEMAS =====

const playerSchema = z.object({
  shortName: z.string().min(1, 'Short name is required'),
  playerStatus: z.enum(['active', 'inactive']).optional(),
  preferredCurrency: z.string().optional().nullable(),
  paymentMethod: z.string().optional().nullable(),
});

const partnerSchema = z.object({
  shortName: z.string().min(1, 'Short name is required'),
  partnerStatus: z.enum(['active', 'inactive']).optional(),
  canBeUpstream: z.boolean().optional(),
  canBeDownstream: z.boolean().optional(),
});

const hncMemberSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  memberType: z.enum(['founder', 'employee'], { required_error: 'Member type is required' }),
  memberCode: z.string().min(1, 'Member code is required'),
  joinedDate: z.string().min(1, 'Joined date is required'),
  department: z.string().optional().nullable(),
});

type PlayerFormData = z.infer<typeof playerSchema>;
type PartnerFormData = z.infer<typeof partnerSchema>;
type HncMemberFormData = z.infer<typeof hncMemberSchema>;

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

const ROLE_TYPE_CONFIG: Record<RoleType, { label: string; icon: React.ReactNode }> = {
  player: { label: 'Player', icon: <Gamepad2 className="h-4 w-4" /> },
  partner: { label: 'Partner', icon: <Handshake className="h-4 w-4" /> },
  hnc_member: { label: 'HNC Member', icon: <Users className="h-4 w-4" /> },
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
 * Uses real API field names (playerStatus, partnerStatus, preferredCurrency, etc.)
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

  const [roleType, setRoleType] = useState<RoleType>(initialRoleType);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Pre-fill helpers for edit mode
  const getEditPlayerData = (): PlayerFormData => {
    if (isEditMode && editRole && editRoleType === 'player') {
      const player = editRole as Player;
      return {
        shortName: player.shortName,
        playerStatus: player.playerStatus,
        preferredCurrency: player.preferredCurrency || '',
        paymentMethod: player.paymentMethod || '',
      };
    }
    return { shortName: contactName || '', playerStatus: 'active', preferredCurrency: '', paymentMethod: '' };
  };

  const getEditPartnerData = (): PartnerFormData => {
    if (isEditMode && editRole && editRoleType === 'partner') {
      const partner = editRole as Partner;
      return {
        shortName: partner.shortName,
        partnerStatus: partner.partnerStatus,
        canBeUpstream: partner.canBeUpstream,
        canBeDownstream: partner.canBeDownstream,
      };
    }
    return { shortName: contactName || '', partnerStatus: 'active', canBeUpstream: false, canBeDownstream: false };
  };

  const getEditHncMemberData = (): HncMemberFormData => {
    if (isEditMode && editRole && editRoleType === 'hnc_member') {
      const member = editRole as HncMember;
      return {
        fullName: member.fullName,
        memberType: member.memberType,
        memberCode: member.memberCode,
        joinedDate: '', // Not editable
        department: member.department || '',
      };
    }
    return { fullName: contactName || '', memberType: 'employee' as 'founder' | 'employee', memberCode: '', joinedDate: new Date().toISOString().split('T')[0], department: '' };
  };

  const [playerData, setPlayerData] = useState<PlayerFormData>(getEditPlayerData());
  const [partnerData, setPartnerData] = useState<PartnerFormData>(getEditPartnerData());
  const [hncMemberData, setHncMemberData] = useState<HncMemberFormData>(getEditHncMemberData());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (roleType === 'player') {
      const result = playerSchema.safeParse(playerData);
      if (!result.success) {
        const fieldErrors: Record<string, string> = {};
        result.error.errors.forEach((err) => {
          if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
        });
        setErrors(fieldErrors);
        return;
      }

      if (isEditMode) {
        const updateData: Record<string, unknown> = {
          shortName: playerData.shortName,
          playerStatus: playerData.playerStatus || 'active',
        };
        if (playerData.preferredCurrency) updateData.preferredCurrency = playerData.preferredCurrency;
        if (playerData.paymentMethod) updateData.paymentMethod = playerData.paymentMethod;
        onSubmit('player', updateData);
      } else {
        const dto: CreatePlayerDto = {
          contactId,
          shortName: playerData.shortName,
          playerStatus: playerData.playerStatus || 'active',
        };
        if (playerData.preferredCurrency) dto.preferredCurrency = playerData.preferredCurrency;
        if (playerData.paymentMethod) dto.paymentMethod = playerData.paymentMethod as any;
        onSubmit('player', dto);
      }
    } else if (roleType === 'partner') {
      const result = partnerSchema.safeParse(partnerData);
      if (!result.success) {
        const fieldErrors: Record<string, string> = {};
        result.error.errors.forEach((err) => {
          if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
        });
        setErrors(fieldErrors);
        return;
      }

      if (isEditMode) {
        onSubmit('partner', {
          shortName: partnerData.shortName,
          partnerStatus: partnerData.partnerStatus || 'active',
          canBeUpstream: partnerData.canBeUpstream ?? false,
          canBeDownstream: partnerData.canBeDownstream ?? false,
        });
      } else {
        const dto: CreatePartnerDto = {
          contactId,
          shortName: partnerData.shortName,
          partnerStatus: partnerData.partnerStatus || 'active',
          canBeUpstream: partnerData.canBeUpstream ?? false,
          canBeDownstream: partnerData.canBeDownstream ?? false,
        };
        onSubmit('partner', dto);
      }
    } else {
      const schema = isEditMode
        ? hncMemberSchema.omit({ memberCode: true, joinedDate: true })
        : hncMemberSchema;
      const result = schema.safeParse(hncMemberData);
      if (!result.success) {
        const fieldErrors: Record<string, string> = {};
        result.error.errors.forEach((err) => {
          if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
        });
        setErrors(fieldErrors);
        return;
      }

      if (isEditMode) {
        const updateData: Record<string, unknown> = {
          fullName: hncMemberData.fullName,
          memberType: hncMemberData.memberType,
        };
        if (hncMemberData.department) updateData.department = hncMemberData.department;
        onSubmit('hnc_member', updateData);
      } else {
        const dto: CreateHncMemberDto = {
          contactId,
          fullName: hncMemberData.fullName,
          memberType: hncMemberData.memberType,
          memberCode: hncMemberData.memberCode,
          joinedDate: hncMemberData.joinedDate,
        };
        if (hncMemberData.department) dto.department = hncMemberData.department;
        onSubmit('hnc_member', dto);
      }
    }
  };

  const isRoleTypeDisabled = (type: RoleType) => isEditMode ? type !== editRoleType : existingRoleTypes.includes(type);
  const allRolesAssigned = !isEditMode && availableRoleTypes.length === 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Role Type Selector */}
      <div className="flex rounded-lg border border-border p-1 bg-muted/30">
        {(['player', 'partner', 'hnc_member'] as RoleType[]).map((type) => {
          const config = ROLE_TYPE_CONFIG[type];
          const disabled = isRoleTypeDisabled(type);
          const isActive = roleType === type;

          return (
            <button
              key={type}
              type="button"
              onClick={() => {
                if (!disabled) {
                  setRoleType(type);
                  setErrors({});
                }
              }}
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
              {config.icon}
              {config.label}
            </button>
          );
        })}
      </div>

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
                  <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-teal-400" title="Required" />
                </label>
                <input
                  type="text"
                  value={playerData.shortName}
                  onChange={(e) => setPlayerData({ ...playerData, shortName: e.target.value })}
                  className={`w-full h-9 px-3 rounded-md border bg-background text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring ${
                    errors.shortName ? 'border-red-500' : 'border-input'
                  }`}
                  placeholder="Enter short name"
                />
                {errors.shortName && (
                  <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {errors.shortName}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Status</label>
                <select
                  value={playerData.playerStatus || 'active'}
                  onChange={(e) => setPlayerData({ ...playerData, playerStatus: e.target.value as 'active' | 'inactive' })}
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm text-foreground appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {STATUS_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Currency</label>
                <select
                  value={playerData.preferredCurrency || ''}
                  onChange={(e) => setPlayerData({ ...playerData, preferredCurrency: e.target.value })}
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm text-foreground appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {CURRENCY_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Payment Method</label>
                <select
                  value={playerData.paymentMethod || ''}
                  onChange={(e) => setPlayerData({ ...playerData, paymentMethod: e.target.value })}
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm text-foreground appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {PAYMENT_METHOD_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
            </div>
          )}

          {roleType === 'partner' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Short Name
                  <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-teal-400" title="Required" />
                </label>
                <input
                  type="text"
                  value={partnerData.shortName}
                  onChange={(e) => setPartnerData({ ...partnerData, shortName: e.target.value })}
                  className={`w-full h-9 px-3 rounded-md border bg-background text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring ${
                    errors.shortName ? 'border-red-500' : 'border-input'
                  }`}
                  placeholder="Enter short name"
                />
                {errors.shortName && (
                  <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {errors.shortName}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Status</label>
                <select
                  value={partnerData.partnerStatus || 'active'}
                  onChange={(e) => setPartnerData({ ...partnerData, partnerStatus: e.target.value as 'active' | 'inactive' })}
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm text-foreground appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {STATUS_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="canBeUpstream"
                  checked={partnerData.canBeUpstream || false}
                  onChange={(e) => setPartnerData({ ...partnerData, canBeUpstream: e.target.checked })}
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
                  checked={partnerData.canBeDownstream || false}
                  onChange={(e) => setPartnerData({ ...partnerData, canBeDownstream: e.target.checked })}
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
                  <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-teal-400" title="Required" />
                </label>
                <input
                  type="text"
                  value={hncMemberData.fullName}
                  onChange={(e) => setHncMemberData({ ...hncMemberData, fullName: e.target.value })}
                  className={`w-full h-9 px-3 rounded-md border bg-background text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring ${
                    errors.fullName ? 'border-red-500' : 'border-input'
                  }`}
                  placeholder="Enter full name"
                />
                {errors.fullName && (
                  <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {errors.fullName}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Member Code
                  <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-teal-400" title="Required" />
                </label>
                <input
                  type="text"
                  value={hncMemberData.memberCode}
                  onChange={(e) => setHncMemberData({ ...hncMemberData, memberCode: e.target.value })}
                  className={`w-full h-9 px-3 rounded-md border bg-background text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring ${
                    errors.memberCode ? 'border-red-500' : 'border-input'
                  }`}
                  placeholder="e.g., JD01"
                  disabled={isEditMode}
                />
                {errors.memberCode && (
                  <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {errors.memberCode}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Member Type
                  <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-teal-400" title="Required" />
                </label>
                <select
                  value={hncMemberData.memberType || ''}
                  onChange={(e) => setHncMemberData({ ...hncMemberData, memberType: e.target.value as 'founder' | 'employee' })}
                  className={`w-full h-9 px-3 rounded-md border bg-background text-sm text-foreground appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring ${
                    errors.memberType ? 'border-red-500' : 'border-input'
                  }`}
                >
                  {MEMBER_TYPE_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
                {errors.memberType && (
                  <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {errors.memberType}
                  </p>
                )}
              </div>

              {!isEditMode && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Joined Date
                    <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-teal-400" title="Required" />
                  </label>
                  <input
                    type="date"
                    value={hncMemberData.joinedDate}
                    onChange={(e) => setHncMemberData({ ...hncMemberData, joinedDate: e.target.value })}
                    className={`w-full h-9 px-3 rounded-md border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring ${
                      errors.joinedDate ? 'border-red-500' : 'border-input'
                    }`}
                  />
                  {errors.joinedDate && (
                    <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {errors.joinedDate}
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Department</label>
                <input
                  type="text"
                  value={hncMemberData.department || ''}
                  onChange={(e) => setHncMemberData({ ...hncMemberData, department: e.target.value })}
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Enter department"
                />
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="h-9 px-4 rounded-md border border-input text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading || allRolesAssigned}
          className="h-9 px-4 rounded-md bg-teal-400 text-white text-sm font-medium hover:bg-teal-500 transition-colors disabled:opacity-50"
        >
          {isLoading ? (isEditMode ? 'Updating...' : 'Adding...') : (isEditMode ? 'Update Role' : 'Add Role')}
        </button>
      </div>
    </form>
  );
}
