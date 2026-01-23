/**
 * Contacts API Service
 *
 * Provides typed access to the Contacts microservice API.
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
} from '../types/contacts';

// In development, use /api proxy to avoid CORS issues
// In production, use the direct API URL
const API_URL = import.meta.env.DEV
  ? '/api'
  : (import.meta.env.VITE_API_URL || 'https://hncms-contacts.scarif-0.duckdns.org');

// API Key for Contacts service authentication
const API_KEY = import.meta.env.VITE_API_KEY || 'dev-api-key-change-in-production';

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

  // Add API key for authentication
  headers.set('x-api-key', API_KEY);

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
   * Delete a contact (soft delete)
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
