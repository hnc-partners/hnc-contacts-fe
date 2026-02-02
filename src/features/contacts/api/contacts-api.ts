/**
 * Contacts API Service
 *
 * Provides typed access to the Contacts microservice API.
 * Uses JWT Bearer token authentication via shared auth-context.
 */

import type {
  Contact,
  ContactWithDetails,
  ContactsListResponse,
  ContactsListParams,
  ContactDetailResponse,
  CreateContactDto,
  UpdateContactDto,
  Player,
  Partner,
  HncMember,
  ContactRoles,
  CreatePlayerDto,
  CreatePartnerDto,
  CreateHncMemberDto,
  UpdatePlayerDto,
  UpdatePartnerDto,
  UpdateHncMemberDto,
  GamingAccount,
} from '@/types/contacts';
import { getAuthItem } from '@hnc-partners/auth-context';

// In development, use /api proxy to avoid CORS issues
// In production, use the direct API URL
const API_URL = import.meta.env.DEV
  ? '/api'
  : (import.meta.env.VITE_API_URL || 'https://hncms-contacts.scarif-0.duckdns.org');

/**
 * API Error class
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Base fetch wrapper
 */
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers);

  // Add JWT Bearer token for authentication
  const token = getAuthItem('access_token', 'hnc_');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Handle 204 No Content (for DELETE)
  if (response.status === 204) {
    return undefined as T;
  }

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new ApiError(
      data.detail || data.message || `HTTP ${response.status}`,
      response.status,
      data
    );
  }

  return response.json();
}

// ===== CONTACTS API =====

export const contactsApi = {
  /**
   * Get all contacts with optional filtering and pagination
   */
  async getAll(params?: ContactsListParams): Promise<ContactsListResponse> {
    const searchParams = new URLSearchParams();
    if (params?.contactType) {
      searchParams.set('contactType', params.contactType);
    }
    if (params?.isActive !== undefined) {
      searchParams.set('isActive', params.isActive.toString());
    }
    if (params?.search) {
      searchParams.set('search', params.search);
    }
    if (params?.page) {
      searchParams.set('page', params.page.toString());
    }
    if (params?.limit) {
      searchParams.set('limit', params.limit.toString());
    }
    if (params?.sortBy) {
      searchParams.set('sortBy', params.sortBy);
    }
    if (params?.sortOrder) {
      searchParams.set('sortOrder', params.sortOrder);
    }
    if (params?.joinDateFrom) {
      searchParams.set('joinDateFrom', params.joinDateFrom);
    }
    if (params?.joinDateTo) {
      searchParams.set('joinDateTo', params.joinDateTo);
    }
    const queryString = searchParams.toString();
    return apiFetch<ContactsListResponse>(`/contacts${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * Get a contact by ID with full details
   * API returns { data: ContactWithDetails }
   */
  async getById(id: string): Promise<ContactWithDetails> {
    const response = await apiFetch<ContactDetailResponse>(`/contacts/${id}`);
    return response.data;
  },

  /**
   * Create a new contact
   */
  async create(data: CreateContactDto): Promise<Contact> {
    return apiFetch<Contact>('/contacts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update a contact
   */
  async update(id: string, data: UpdateContactDto): Promise<Contact> {
    return apiFetch<Contact>(`/contacts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  /**
   * Permanently delete a contact and all associated data.
   */
  async delete(id: string): Promise<void> {
    return apiFetch<void>(`/contacts/${id}`, {
      method: 'DELETE',
    });
  },
};

// ===== ROLES API =====

export const rolesApi = {
  async getPlayersByContact(contactId: string): Promise<Player[]> {
    const response = await apiFetch<{ data: Player[] }>(`/players?contactId=${contactId}`);
    // API may not filter properly - filter client-side to be safe
    return (response.data || []).filter(r => r.contactId === contactId);
  },

  async getPartnersByContact(contactId: string): Promise<Partner[]> {
    const response = await apiFetch<{ data: Partner[] }>(`/partners?contactId=${contactId}`);
    return (response.data || []).filter(r => r.contactId === contactId);
  },

  async getHncMembersByContact(contactId: string): Promise<HncMember[]> {
    const response = await apiFetch<{ data: HncMember[] }>(`/hnc-members?contactId=${contactId}`);
    return (response.data || []).filter(r => r.contactId === contactId);
  },

  async getAllRolesForContact(contactId: string): Promise<ContactRoles> {
    const results = await Promise.allSettled([
      this.getPlayersByContact(contactId),
      this.getPartnersByContact(contactId),
      this.getHncMembersByContact(contactId),
    ]);
    return {
      players: results[0].status === 'fulfilled' ? results[0].value : [],
      partners: results[1].status === 'fulfilled' ? results[1].value : [],
      hncMembers: results[2].status === 'fulfilled' ? results[2].value : [],
    };
  },

  async createPlayer(data: CreatePlayerDto): Promise<Player> {
    return apiFetch<Player>('/players', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async createPartner(data: CreatePartnerDto): Promise<Partner> {
    return apiFetch<Partner>('/partners', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async createHncMember(data: CreateHncMemberDto): Promise<HncMember> {
    return apiFetch<HncMember>('/hnc-members', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updatePlayer(id: string, data: UpdatePlayerDto): Promise<Player> {
    return apiFetch<Player>(`/players/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async updatePartner(id: string, data: UpdatePartnerDto): Promise<Partner> {
    return apiFetch<Partner>(`/partners/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async updateHncMember(id: string, data: UpdateHncMemberDto): Promise<HncMember> {
    return apiFetch<HncMember>(`/hnc-members/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deletePlayer(id: string): Promise<void> {
    return apiFetch<void>(`/players/${id}`, { method: 'DELETE' });
  },

  async deletePartner(id: string): Promise<void> {
    return apiFetch<void>(`/partners/${id}`, { method: 'DELETE' });
  },

  async deleteHncMember(id: string): Promise<void> {
    return apiFetch<void>(`/hnc-members/${id}`, { method: 'DELETE' });
  },
};

// ===== GAMING ACCOUNTS API =====

// Gaming Accounts service URL
// In development, would need a separate proxy or direct call
// For now, this points to the gaming-accounts service directly
const GAMING_ACCOUNTS_API_URL = import.meta.env.VITE_GAMING_ACCOUNTS_API_URL
  || 'https://hncms-gaming-accounts.scarif-0.duckdns.org';

/**
 * Fetch wrapper for gaming-accounts service
 */
async function gamingAccountsFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers);

  // Add JWT Bearer token for authentication
  const token = getAuthItem('access_token', 'hnc_');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${GAMING_ACCOUNTS_API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new ApiError(
      data.detail || data.message || `HTTP ${response.status}`,
      response.status,
      data
    );
  }

  return response.json();
}

/**
 * Gaming Accounts API
 *
 * NOTE: The gaming-accounts service does not currently support filtering by contactId.
 * Gaming accounts link to contacts via deal_participations in the Deals service.
 * This API is prepared for when that relationship becomes queryable.
 */
export const gamingAccountsApi = {
  /**
   * Get gaming accounts for a contact.
   *
   * CURRENT STATUS: Returns empty array - backend integration pending.
   * The gaming-accounts service needs to support contactId filtering,
   * likely via a junction table or through the deals service.
   *
   * @param contactId - Contact UUID to get gaming accounts for
   * @returns Gaming accounts associated with the contact
   */
  async getByContactId(contactId: string): Promise<GamingAccount[]> {
    // TODO: When backend supports this, the call would be:
    // const response = await gamingAccountsFetch<GamingAccountsListResponse>(
    //   `/gaming-accounts?contactId=${contactId}`
    // );
    // return response.data;

    // For now, return empty array - backend integration pending
    console.log(`[gamingAccountsApi] getByContactId called for ${contactId} - backend integration pending`);
    return [];
  },

  /**
   * Get a gaming account by ID.
   * This endpoint IS available in the current backend.
   */
  async getById(id: string): Promise<GamingAccount> {
    const response = await gamingAccountsFetch<{ data: GamingAccount }>(`/gaming-accounts/${id}`);
    return response.data;
  },

  /**
   * Check if the gaming accounts API is available.
   * Useful for showing appropriate UI states.
   */
  async checkHealth(): Promise<boolean> {
    try {
      await gamingAccountsFetch<{ status: string }>('/health');
      return true;
    } catch {
      return false;
    }
  },
};
