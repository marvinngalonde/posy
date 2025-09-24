"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Bell,
  AlertTriangle,
  DollarSign,
  ShoppingCart,
  Package,
  Settings,
  X,
  Check,
  CheckCheck,
  Trash2
} from "lucide-react"
import {
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useDeleteNotificationMutation,
  type Notification,
  type NotificationType
} from "@/lib/slices/notificationsApi"
import { cn } from "@/lib/utils"

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case 'low_stock':
      return <Package className="h-4 w-4 text-orange-500" />
    case 'overdue_payment':
      return <DollarSign className="h-4 w-4 text-red-500" />
    case 'new_sale':
      return <ShoppingCart className="h-4 w-4 text-green-500" />
    case 'system':
      return <Settings className="h-4 w-4 text-blue-500" />
    default:
      return <Bell className="h-4 w-4 text-gray-500" />
  }
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high':
      return 'border-l-red-500 bg-red-50'
    case 'medium':
      return 'border-l-yellow-500 bg-yellow-50'
    case 'info':
      return 'border-l-blue-500 bg-blue-50'
    default:
      return 'border-l-gray-300 bg-gray-50'
  }
}

const formatTimeAgo = (dateString: string) => {
  const now = new Date()
  const date = new Date(dateString)
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

  if (diffInMinutes < 1) return 'Just now'
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours}h ago`

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) return `${diffInDays}d ago`

  return date.toLocaleDateString()
}

interface NotificationsDropdownProps {
  className?: string
}

export function NotificationsDropdown({ className }: NotificationsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const { data: notificationsData, isLoading, error, refetch } = useGetNotificationsQuery({
    limit: 20,
    unread_only: showUnreadOnly
  })

  // Debug logging (remove in production)
  // console.log('Notifications data:', notificationsData)
  // console.log('Loading:', isLoading)
  // console.log('Error:', error)

  const [markNotificationRead] = useMarkNotificationReadMutation()
  const [deleteNotification] = useDeleteNotificationMutation()

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      try {
        await markNotificationRead({
          action: 'mark_read',
          notification_id: notification.id
        }).unwrap()
        refetch()
      } catch (error) {
        console.error('Failed to mark notification as read:', error)
      }
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await markNotificationRead({
        action: 'mark_all_read'
      }).unwrap()
      refetch()
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
    }
  }

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await deleteNotification({
        action: 'delete',
        notification_id: notificationId
      }).unwrap()
      refetch()
    } catch (error) {
      console.error('Failed to delete notification:', error)
    }
  }

  const handleDeleteAllNotifications = async () => {
    try {
      await deleteNotification({
        action: 'delete_all'
      }).unwrap()
      refetch()
    } catch (error) {
      console.error('Failed to delete all notifications:', error)
    }
  }

  const notifications = notificationsData?.notifications || []
  const unreadCount = notificationsData?.unread_count || 0

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      {/* Notification Bell Button */}
      <Button
        variant="ghost"
        size="sm"
        className="relative rounded bg-transparent hover:bg-blue-50 text-blue-900"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>


      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          {/* Header */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Notifications</h3>
                <p className="text-sm text-gray-500">
                  {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMarkAllRead}
                    className="text-xs"
                  >
                    <CheckCheck className="h-3 w-3 mr-1" />
                    Mark all read
                  </Button>
                )}
                {notifications.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDeleteAllNotifications}
                    className="text-xs text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Clear all
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex border-b border-gray-100">
            <button
              className={cn(
                "flex-1 px-4 py-2 text-sm font-medium",
                !showUnreadOnly
                  ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                  : "text-gray-500 hover:text-gray-700"
              )}
              onClick={() => setShowUnreadOnly(false)}
            >
              All
            </button>
            <button
              className={cn(
                "flex-1 px-4 py-2 text-sm font-medium",
                showUnreadOnly
                  ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                  : "text-gray-500 hover:text-gray-700"
              )}
              onClick={() => setShowUnreadOnly(true)}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* Notifications List */}
          <ScrollArea className="max-h-96">
            {isLoading ? (
              <div className="p-4 text-center text-gray-500">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-sm">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">
                  {showUnreadOnly ? 'No unread notifications' : 'No notifications yet'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "p-4 hover:bg-gray-50 cursor-pointer transition-colors border-l-4",
                      getPriorityColor(notification.priority),
                      !notification.read && "bg-blue-50"
                    )}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {notification.title}
                          </p>
                          <div className="flex items-center gap-2 ml-2">
                            {!notification.read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleNotificationClick(notification)
                                }}
                                className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800"
                                title="Mark as read"
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteNotification(notification.id)
                              }}
                              className="h-6 w-6 p-0 text-red-600 hover:text-red-800"
                              title="Delete notification"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></div>
                            )}
                            <span className="text-xs text-gray-500 flex-shrink-0">
                              {formatTimeAgo(notification.created_at)}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mt-1 max-h-10 overflow-hidden">
                          {notification.message}
                        </p>
                        {notification.type === 'low_stock' && notification.data && (
                          <div className="mt-2 text-xs text-gray-500">
                            Stock: {notification.data.current_stock} / Min: {notification.data.min_stock}
                          </div>
                        )}
                        {notification.type === 'overdue_payment' && notification.data && (
                          <div className="mt-2 text-xs text-red-600 font-medium">
                            ${Number(notification.data.amount).toLocaleString()} overdue
                          </div>
                        )}
                        {notification.type === 'new_sale' && notification.data && (
                          <div className="mt-2 text-xs text-green-600 font-medium">
                            ${Number(notification.data.amount).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-100 bg-gray-50">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-sm text-gray-600 hover:text-gray-900"
                onClick={() => {
                  setIsOpen(false)
                  // You could navigate to a full notifications page here
                }}
              >
                View all notifications
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}