import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
  Organization,
  CreateOrganizationInput,
  UpdateOrganizationInput,
  ApiResponse
} from '@/lib/types/prisma';

/**
 * Organization API slice for managing company/organization details
 * Handles all organization-related operations
 */
export const organizationApi = createApi({
  reducerPath: 'organizationApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/v2/organization' }),
  tagTypes: ['Organization'],
  endpoints: (builder) => ({
    /**
     * Get organization details
     * Returns organization info or creates default if none exists
     */
    getOrganization: builder.query<Organization, void>({
      query: () => '',
      providesTags: [{ type: 'Organization', id: 'CURRENT' }],
    }),

    /**
     * Create initial organization
     * Used when no organization exists
     */
    createOrganization: builder.mutation<Organization, CreateOrganizationInput>({
      query: (organizationData) => ({
        url: '',
        method: 'POST',
        body: organizationData,
      }),
      invalidatesTags: [{ type: 'Organization', id: 'CURRENT' }],
    }),

    /**
     * Update organization details
     * Full update of all organization fields
     */
    updateOrganization: builder.mutation<Organization, UpdateOrganizationInput>({
      query: (organizationData) => ({
        url: '',
        method: 'PUT',
        body: organizationData,
      }),
      invalidatesTags: [{ type: 'Organization', id: 'CURRENT' }],
    }),

    /**
     * Partial update of organization
     * Updates only provided fields
     */
    updateOrganizationPartial: builder.mutation<Organization, { id?: number; data: Partial<UpdateOrganizationInput> }>({
      query: ({ data }) => ({
        url: '',
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: [{ type: 'Organization', id: 'CURRENT' }],
    }),
  }),
});

export const {
  useGetOrganizationQuery,
  useCreateOrganizationMutation,
  useUpdateOrganizationMutation,
  useUpdateOrganizationPartialMutation,
} = organizationApi;