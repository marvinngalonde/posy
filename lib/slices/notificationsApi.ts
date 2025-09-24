import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export type NotificationType = 'low_stock' | 'overdue_payment' | 'new_sale' | 'system' | 'expense_approval' | 'purchase_received'
export type NotificationPriority = 'low' | 'medium' | 'high' | 'info'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  priority: NotificationPriority
  read: boolean
  created_at: string
  data: any
}

export interface NotificationsResponse {
  notifications: Notification[]
  total: number
  unread_count: number
}

export interface NotificationParams {
  limit?: number
  unread_only?: boolean
}

export interface MarkReadParams {
  action: 'mark_read' | 'mark_all_read'
  notification_id?: string
}

export interface DeleteNotificationParams {
  action: 'delete' | 'delete_all'
  notification_id?: string
}

export const notificationsApi = createApi({
  reducerPath: 'notificationsApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/v2/notifications' }),
  tagTypes: ['Notifications'],
  endpoints: (builder) => ({
    getNotifications: builder.query<NotificationsResponse, NotificationParams>({
      query: (params) => {
        const searchParams = new URLSearchParams()
        if (params.limit) searchParams.append('limit', params.limit.toString())
        if (params.unread_only) searchParams.append('unread_only', params.unread_only.toString())
        return `?${searchParams.toString()}`
      },
      providesTags: ['Notifications'],
    }),
    markNotificationRead: builder.mutation<{ success: boolean; message: string }, MarkReadParams>({
      query: (params) => ({
        url: '',
        method: 'POST',
        body: params,
      }),
      invalidatesTags: ['Notifications'],
    }),
    deleteNotification: builder.mutation<{ success: boolean; message: string }, DeleteNotificationParams>({
      query: (params) => ({
        url: '',
        method: 'DELETE',
        body: params,
      }),
      invalidatesTags: ['Notifications'],
    }),
  }),
})

export const {
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useDeleteNotificationMutation,
} = notificationsApi