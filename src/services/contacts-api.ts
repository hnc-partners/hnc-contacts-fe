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
      method: 'PUT',
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
