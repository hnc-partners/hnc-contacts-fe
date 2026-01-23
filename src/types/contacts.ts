/**
 * Contacts API Types
 *
 * Types for the Contacts microservice API.
 * Matches actual API response structure.
 */

// ===== CONTACT TYPES =====

export type ContactType = 'person' | 'organization';

// API uses isActive boolean, we map to string for UI display
export type ContactStatus = 'active' | 'inactive';

/**
 * Contact from API list endpoint
 * Fields match actual API response
 */
export interface Contact {
  id: string; // UUID
  contactType: ContactType;
  displayName: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
  v2ParticipantId: number | null;
}

/**
 * Person details from contact detail endpoint
 * Matches actual API response structure
 */
export interface PersonDetails {
  id: string;
  contactId: string;
  firstName: string;
  lastName: string | null;
  mobileNumber: string | null;
  email: string | null;
  country: string | null;
  area: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Organization details from contact detail endpoint
 * Matches actual API response structure
 */
export interface OrganizationDetails {
  id: string;
  contactId: string;
  legalName: string;
  registrationNumber: string | null;
  taxId: string | null;
  country: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Contact with full details from GET /contacts/:id
 */
export interface ContactWithDetails extends Contact {
  personDetails: PersonDetails | null;
  organizationDetails: OrganizationDetails | null;
}

/**
 * API response wrapper for single contact
 */
export interface ContactDetailResponse {
  data: ContactWithDetails;
}

export interface CreateContactDto {
  contactType: ContactType;
  displayName: string;
  isActive?: boolean;
  joinDate?: string | null;
  // Person-specific
  firstName?: string;
  lastName?: string | null;
  mobileNumber?: string | null;
  email?: string | null;
  country?: string | null;
  area?: string | null;
  notes?: string | null;
  // Organization-specific
  legalName?: string;
  registrationNumber?: string | null;
  taxId?: string | null;
}

export interface UpdateContactDto {
  displayName?: string;
  isActive?: boolean;
  joinDate?: string | null;
  // Person-specific
  firstName?: string;
  lastName?: string | null;
  mobileNumber?: string | null;
  email?: string | null;
  country?: string | null;
  area?: string | null;
  notes?: string | null;
  // Organization-specific
  legalName?: string;
  registrationNumber?: string | null;
  taxId?: string | null;
}

// ===== API RESPONSE TYPES =====

export interface ContactsListResponse {
  data: Contact[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ContactsListParams {
  contactType?: ContactType;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ===== STATUS COLORS =====

export const STATUS_COLORS: Record<ContactStatus, { bg: string; text: string }> = {
  active: { bg: 'bg-green-100 dark:bg-green-900', text: 'text-green-700 dark:text-green-300' },
  inactive: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-300' },
};

// ===== TYPE COLORS =====

export const TYPE_COLORS: Record<ContactType, { bg: string; text: string }> = {
  person: { bg: 'bg-blue-100 dark:bg-blue-900', text: 'text-blue-700 dark:text-blue-300' },
  organization: { bg: 'bg-purple-100 dark:bg-purple-900', text: 'text-purple-700 dark:text-purple-300' },
};

// ===== ROLE TYPES =====

export type RoleType = 'player' | 'partner' | 'hnc_member';

export interface Player {
  id: string;
  contactId: string | null;
  shortName: string;
  playerStatus: 'active' | 'inactive';
  preferredCurrency: string | null;
  paymentMethod: string | null;
  joinDate: string | null;
  isAnonymous: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Partner {
  id: string;
  contactId: string | null;
  shortName: string;
  partnerStatus: 'active' | 'inactive';
  canBeUpstream: boolean;
  canBeDownstream: boolean;
  preferredCurrency: string | null;
  joinDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface HncMember {
  id: string;
  contactId: string | null;
  memberCode: string;
  fullName: string;
  memberType: 'founder' | 'employee';
  department: string | null;
  position: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ContactRoles {
  players: Player[];
  partners: Partner[];
  hncMembers: HncMember[];
}

// ===== CREATE ROLE DTOs =====

export interface CreatePlayerDto {
  contactId: string;
  shortName: string;
  playerStatus?: 'active' | 'inactive';
  preferredCurrency?: string | null;
  paymentMethod?: string | null;
}

export interface CreatePartnerDto {
  contactId: string;
  shortName: string;
  partnerStatus?: 'active' | 'inactive';
  canBeUpstream?: boolean;
  canBeDownstream?: boolean;
}

export interface CreateHncMemberDto {
  contactId: string;
  fullName: string;
  memberType: 'founder' | 'employee';
  memberCode: string;
  joinedDate: string;
  department?: string | null;
}

// ===== UPDATE ROLE DTOs =====

export interface UpdatePlayerDto {
  shortName?: string;
  playerStatus?: 'active' | 'inactive';
  preferredCurrency?: string | null;
  paymentMethod?: string | null;
}

export interface UpdatePartnerDto {
  shortName?: string;
  partnerStatus?: 'active' | 'inactive';
  canBeUpstream?: boolean;
  canBeDownstream?: boolean;
}

export interface UpdateHncMemberDto {
  fullName?: string;
  memberType?: 'founder' | 'employee';
  department?: string | null;
}
