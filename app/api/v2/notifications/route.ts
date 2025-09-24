import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// In-memory notification store (in production, use Redis or database)
let notificationStore: Array<{
  id: string
  type: 'low_stock' | 'new_sale' | 'system' | 'overdue_payment'
  title: string
  message: string
  priority: 'high' | 'medium' | 'info' | 'low'
  read: boolean
  created_at: string
  data: any
}> = []

// Initialize with some test data if store is empty
const initializeNotifications = () => {
  if (notificationStore.length === 0) {
    notificationStore = [
      {
        id: 'test-1',
        type: 'low_stock',
        title: 'Low Stock Alert',
        message: 'Test Product is running low (5 remaining)',
        priority: 'high',
        read: false,
        created_at: new Date().toISOString(),
        data: {
          product_id: 1,
          product_name: 'Test Product',
          current_stock: 5,
          min_stock: 10,
          warehouse: 'Main Warehouse'
        }
      },
      {
        id: 'test-2',
        type: 'new_sale',
        title: 'New Sale',
        message: 'Sale SAL-001 completed - $150.00',
        priority: 'info',
        read: false,
        created_at: new Date().toISOString(),
        data: {
          sale_id: 1,
          reference: 'SAL-001',
          customer_name: 'John Doe',
          amount: 150
        }
      },
      {
        id: 'system-backup',
        type: 'system',
        title: 'Backup Reminder',
        message: 'Weekly database backup is due. Click to run backup.',
        priority: 'medium',
        read: false,
        created_at: new Date().toISOString(),
        data: {
          action: 'backup_database'
        }
      }
    ]
  }
}

export async function GET(req: NextRequest) {
  try {
    console.log('Notifications API called')
    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get("limit") || "20")
    const unreadOnly = searchParams.get("unread_only") === "true"

    // Initialize notifications if empty
    initializeNotifications()

    // Start with notifications from the store
    let notifications = [...notificationStore]

    try {
      // 1. Low Stock Notifications from database (with try-catch to prevent errors)
      const lowStockProducts = await prisma.products.findMany({
        where: {
          status: 'active',
          stock: {
            lte: 10 // Simple check for low stock
          }
        },
        include: {
          warehouses: {
            select: {
              name: true
            }
          }
        },
        take: 5
      })

      // Add low stock notifications to store if not already present
      lowStockProducts.forEach(product => {
        const existingIndex = notificationStore.findIndex(n => n.id === `low-stock-${product.id}`)
        const newNotification = {
          id: `low-stock-${product.id}`,
          type: 'low_stock' as const,
          title: 'Low Stock Alert',
          message: `${product.name} is running low (${product.stock} remaining)`,
          priority: 'high' as const,
          read: false,
          created_at: new Date().toISOString(),
          data: {
            product_id: product.id,
            product_name: product.name,
            current_stock: product.stock,
            min_stock: product.alert_quantity || 10,
            warehouse: product.warehouses?.name || 'Default Warehouse'
          }
        }

        if (existingIndex === -1) {
          notificationStore.push(newNotification)
        }
      })

      // Update notifications array with current store
      notifications = [...notificationStore]
    } catch (dbError) {
      console.error('Database error in notifications:', dbError)
      // Continue with stored notifications if DB fails
    }

    // Sort by created_at (newest first) and apply filters
    let sortedNotifications = notifications.sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

    if (unreadOnly) {
      sortedNotifications = sortedNotifications.filter(n => !n.read)
    }

    const result = sortedNotifications.slice(0, limit)

    const response = {
      notifications: result,
      total: sortedNotifications.length,
      unread_count: notifications.filter(n => !n.read).length
    }

    console.log('Returning notifications response:', response)
    return NextResponse.json(response)

  } catch (error: unknown) {
    console.error('Notifications API error:', error)
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { action, notification_id } = await req.json()

    // Initialize notifications if empty
    initializeNotifications()

    if (action === 'mark_read' && notification_id) {
      // Mark specific notification as read
      const notificationIndex = notificationStore.findIndex(n => n.id === notification_id)
      if (notificationIndex !== -1) {
        notificationStore[notificationIndex].read = true
        console.log(`Marked notification ${notification_id} as read`)
        return NextResponse.json({ success: true, message: 'Notification marked as read' })
      } else {
        return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
      }
    }

    if (action === 'mark_all_read') {
      // Mark all notifications as read
      notificationStore.forEach(notification => {
        notification.read = true
      })
      console.log(`Marked ${notificationStore.length} notifications as read`)
      return NextResponse.json({ success: true, message: 'All notifications marked as read' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error: unknown) {
    console.error('Notifications POST error:', error)
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    console.log('DELETE request received')
    const body = await req.json()
    console.log('DELETE request body:', body)

    const { action, notification_id } = body

    // Initialize notifications if empty
    initializeNotifications()

    console.log(`DELETE action: ${action}, notification_id: ${notification_id}`)
    console.log(`Current notification store length: ${notificationStore.length}`)

    if (action === 'delete' && notification_id) {
      // Delete specific notification
      const notificationIndex = notificationStore.findIndex(n => n.id === notification_id)
      console.log(`Found notification at index: ${notificationIndex}`)

      if (notificationIndex !== -1) {
        notificationStore.splice(notificationIndex, 1)
        console.log(`Deleted notification ${notification_id}`)
        return NextResponse.json({ success: true, message: 'Notification deleted' })
      } else {
        console.log(`Notification ${notification_id} not found`)
        return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
      }
    }

    if (action === 'delete_all') {
      // Delete all notifications
      const deletedCount = notificationStore.length
      notificationStore.length = 0 // Clear the array
      console.log(`Deleted all ${deletedCount} notifications`)
      return NextResponse.json({ success: true, message: 'All notifications deleted' })
    }

    console.log('Invalid action received:', action)
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error: unknown) {
    console.error('Notifications DELETE error:', error)
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}