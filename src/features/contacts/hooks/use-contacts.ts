/**
 * Contacts Query Hooks
 *
 * TanStack Query hooks for contacts CRUD operations.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { contactsApi, rolesApi, gamingAccountsApi } from '@/services/contacts-api';
import type {
  Contact,
  ContactsListParams,
  CreateContactDto,
  UpdateContactDto,
  CreatePlayerDto,
  CreatePartnerDto,
  CreateHncMemberDto,
  UpdatePlayerDto,
  UpdatePartnerDto,
  UpdateHncMemberDto,
  RoleType,
} from '../types';

// ===== QUERY KEYS =====

export const contactsKeys = {
  all: ['contacts'] as const,
  lists: () => [...contactsKeys.all, 'list'] as const,
  list: (params: ContactsListParams) => [...contactsKeys.lists(), params] as const,
  details: () => [...contactsKeys.all, 'detail'] as const,
  detail: (id: string) => [...contactsKeys.details(), id] as const,
  roles: (contactId: string) => [...contactsKeys.all, 'roles', contactId] as const,
  gamingAccounts: (contactId: string) => [...contactsKeys.all, 'gaming-accounts', contactId] as const,
};

// ===== CONTACTS QUERIES =====

export function useContacts(params: ContactsListParams = {}) {
  return useQuery({
    queryKey: contactsKeys.list(params),
    queryFn: () => contactsApi.getAll(params),
  });
}

export function useContact(id: string | undefined) {
  return useQuery({
    queryKey: contactsKeys.detail(id!),
    queryFn: () => contactsApi.getById(id!),
    enabled: !!id,
  });
}

export function useContactRoles(contactId: string, enabled = true) {
  return useQuery({
    queryKey: contactsKeys.roles(contactId),
    queryFn: () => rolesApi.getAllRolesForContact(contactId),
    enabled,
  });
}

/**
 * Hook to fetch gaming accounts for a contact.
 *
 * NOTE: Currently returns empty array - backend integration pending.
 * The gaming-accounts service needs contactId filtering support,
 * which requires a junction table or integration with deals service.
 */
export function useContactGamingAccounts(contactId: string, enabled = true) {
  return useQuery({
    queryKey: contactsKeys.gamingAccounts(contactId),
    queryFn: () => gamingAccountsApi.getByContactId(contactId),
    enabled,
    // Keep stale data while refetching since this is currently a stub
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// ===== CONTACTS MUTATIONS =====

export function useCreateContact(options?: {
  onSuccess?: (data: Contact) => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateContactDto) => contactsApi.create(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: contactsKeys.all });
      toast.success('Contact created successfully');
      options?.onSuccess?.(data);
    },
    onError: (error: Error) => {
      toast.error(`Failed to create contact: ${error.message}`);
      options?.onError?.(error);
    },
  });
}

export function useUpdateContact(options?: {
  onSuccess?: (data: Contact) => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateContactDto }) =>
      contactsApi.update(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: contactsKeys.all });
      queryClient.invalidateQueries({ queryKey: contactsKeys.detail(variables.id) });
      toast.success('Contact updated successfully');
      options?.onSuccess?.(data);
    },
    onError: (error: Error) => {
      toast.error(`Failed to update contact: ${error.message}`);
      options?.onError?.(error);
    },
  });
}

export function useDeleteContact(options?: {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => contactsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contactsKeys.all });
      toast.success('Contact deleted successfully');
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete contact: ${error.message}`);
      options?.onError?.(error);
    },
  });
}

// ===== ROLE MUTATIONS =====

export function useCreateRole(contactId: string) {
  const queryClient = useQueryClient();

  const createPlayer = useMutation({
    mutationFn: (data: CreatePlayerDto) => rolesApi.createPlayer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contactsKeys.roles(contactId) });
      toast.success('Player role added successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add player role: ${error.message}`);
    },
  });

  const createPartner = useMutation({
    mutationFn: (data: CreatePartnerDto) => rolesApi.createPartner(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contactsKeys.roles(contactId) });
      toast.success('Partner role added successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add partner role: ${error.message}`);
    },
  });

  const createHncMember = useMutation({
    mutationFn: (data: CreateHncMemberDto) => rolesApi.createHncMember(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contactsKeys.roles(contactId) });
      toast.success('HNC Member role added successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add HNC member role: ${error.message}`);
    },
  });

  const addRole = (
    roleType: RoleType,
    data: CreatePlayerDto | CreatePartnerDto | CreateHncMemberDto
  ) => {
    switch (roleType) {
      case 'player':
        createPlayer.mutate(data as CreatePlayerDto);
        break;
      case 'partner':
        createPartner.mutate(data as CreatePartnerDto);
        break;
      case 'hnc_member':
        createHncMember.mutate(data as CreateHncMemberDto);
        break;
    }
  };

  return {
    addRole,
    isLoading:
      createPlayer.isPending ||
      createPartner.isPending ||
      createHncMember.isPending,
  };
}

export function useUpdateRole(contactId: string) {
  const queryClient = useQueryClient();

  const updatePlayer = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePlayerDto }) =>
      rolesApi.updatePlayer(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contactsKeys.roles(contactId) });
      toast.success('Player role updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update player role: ${error.message}`);
    },
  });

  const updatePartner = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePartnerDto }) =>
      rolesApi.updatePartner(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contactsKeys.roles(contactId) });
      toast.success('Partner role updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update partner role: ${error.message}`);
    },
  });

  const updateHncMember = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateHncMemberDto }) =>
      rolesApi.updateHncMember(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contactsKeys.roles(contactId) });
      toast.success('HNC Member role updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update HNC member role: ${error.message}`);
    },
  });

  const editRole = (
    roleType: RoleType,
    roleId: string,
    data: UpdatePlayerDto | UpdatePartnerDto | UpdateHncMemberDto
  ) => {
    switch (roleType) {
      case 'player':
        updatePlayer.mutate({ id: roleId, data: data as UpdatePlayerDto });
        break;
      case 'partner':
        updatePartner.mutate({ id: roleId, data: data as UpdatePartnerDto });
        break;
      case 'hnc_member':
        updateHncMember.mutate({ id: roleId, data: data as UpdateHncMemberDto });
        break;
    }
  };

  return {
    editRole,
    isLoading:
      updatePlayer.isPending ||
      updatePartner.isPending ||
      updateHncMember.isPending,
  };
}

export function useDeleteRole(contactId: string) {
  const queryClient = useQueryClient();

  const deletePlayer = useMutation({
    mutationFn: (id: string) => rolesApi.deletePlayer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contactsKeys.roles(contactId) });
      toast.success('Player role removed successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to remove player role: ${error.message}`);
    },
  });

  const deletePartner = useMutation({
    mutationFn: (id: string) => rolesApi.deletePartner(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contactsKeys.roles(contactId) });
      toast.success('Partner role removed successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to remove partner role: ${error.message}`);
    },
  });

  const deleteHncMember = useMutation({
    mutationFn: (id: string) => rolesApi.deleteHncMember(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contactsKeys.roles(contactId) });
      toast.success('HNC Member role removed successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to remove HNC member role: ${error.message}`);
    },
  });

  const removeRole = (roleType: RoleType, roleId: string) => {
    switch (roleType) {
      case 'player':
        deletePlayer.mutate(roleId);
        break;
      case 'partner':
        deletePartner.mutate(roleId);
        break;
      case 'hnc_member':
        deleteHncMember.mutate(roleId);
        break;
    }
  };

  return {
    removeRole,
    isLoading:
      deletePlayer.isPending ||
      deletePartner.isPending ||
      deleteHncMember.isPending,
  };
}
