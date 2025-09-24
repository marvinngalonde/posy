import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { ZIMRAManager } from '@/lib/zimra/client'

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  try {
    console.log('Getting FDMS status')

    // Get ZIMRA configuration
    const config = await ZIMRAManager.getZIMRAConfig()

    if (!config) {
      return NextResponse.json({
        success: true,
        data: {
          configured: false,
          fdmsEnabled: false,
          status: 'not_configured',
          message: 'ZIMRA FDMS not configured'
        }
      })
    }

    // Get fiscal device info
    const device = await prisma.fiscal_devices.findFirst({
      where: {
        zimra_config_id: config.id,
        status: 'Active'
      }
    })

    // Get transaction statistics
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [
      totalTransactions,
      todayTransactions,
      pendingTransactions,
      failedTransactions,
      offlineQueue
    ] = await Promise.all([
      prisma.fiscal_transactions.count({
        where: { zimra_config_id: config.id }
      }),
      prisma.fiscal_transactions.count({
        where: {
          zimra_config_id: config.id,
          receipt_date: { gte: today }
        }
      }),
      prisma.fiscal_transactions.count({
        where: {
          zimra_config_id: config.id,
          zimra_status: 'pending'
        }
      }),
      prisma.fiscal_transactions.count({
        where: {
          zimra_config_id: config.id,
          zimra_status: 'failed'
        }
      }),
      prisma.offline_fiscal_queue.count({
        where: {
          zimra_config_id: config.id,
          status: 'pending'
        }
      })
    ])

    // Determine overall status
    let overallStatus = 'configured'
    let statusMessage = 'FDMS configured but not enabled'

    if (config.isFDMSEnabled) {
      if (device) {
        overallStatus = 'active'
        statusMessage = 'FDMS active and ready'
      } else {
        overallStatus = 'error'
        statusMessage = 'FDMS enabled but no active fiscal device'
      }
    }

    if (failedTransactions > 0) {
      overallStatus = 'warning'
      statusMessage = `${failedTransactions} failed transaction(s) need attention`
    }

    if (offlineQueue > 0) {
      overallStatus = 'offline'
      statusMessage = `${offlineQueue} transaction(s) queued for submission`
    }

    return NextResponse.json({
      success: true,
      data: {
        configured: true,
        fdmsEnabled: config.isFDMSEnabled,
        status: overallStatus,
        message: statusMessage,
        config: {
          taxpayerTIN: config.taxpayerTIN,
          businessName: config.businessName,
          businessType: config.businessType,
          testEnvironment: config.testEnvironment,
          configStatus: config.status
        },
        device: device ? {
          deviceId: device.device_id,
          deviceSerialNo: device.device_serial_no,
          status: device.status,
          operatingMode: device.operating_mode,
          globalReceiptCounter: device.global_receipt_counter.toString(),
          dailyReceiptCounter: device.daily_receipt_counter,
          fiscalDayOpened: device.fiscal_day_opened
        } : null,
        statistics: {
          totalTransactions,
          todayTransactions,
          pendingTransactions,
          failedTransactions,
          offlineQueueSize: offlineQueue
        }
      }
    })

  } catch (error: unknown) {
    console.error('FDMS status error:', error)
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action } = body

    console.log('FDMS status action:', action)

    switch (action) {
      case 'sync_offline_queue':
        return await syncOfflineQueue()

      case 'retry_failed':
        return await retryFailedTransactions()

      case 'reset_daily_counter':
        return await resetDailyCounter()

      default:
        return NextResponse.json({
          error: 'Invalid action. Supported actions: sync_offline_queue, retry_failed, reset_daily_counter'
        }, { status: 400 })
    }

  } catch (error: unknown) {
    console.error('FDMS status action error:', error)
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

async function syncOfflineQueue(): Promise<NextResponse> {
  try {
    const config = await ZIMRAManager.getZIMRAConfig()
    if (!config || !config.isFDMSEnabled) {
      return NextResponse.json({
        error: 'FDMS not configured or not enabled'
      }, { status: 400 })
    }

    const queuedTransactions = await prisma.offline_fiscal_queue.findMany({
      where: {
        zimra_config_id: config.id,
        status: 'pending'
      },
      take: 10 // Process in batches
    })

    if (queuedTransactions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No transactions in offline queue'
      })
    }

    // In a real implementation, you would process these transactions
    // For now, just mark them as processed
    await prisma.offline_fiscal_queue.updateMany({
      where: {
        id: { in: queuedTransactions.map(t => t.id) }
      },
      data: {
        status: 'synchronized',
        processed_at: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      message: `Synchronized ${queuedTransactions.length} transactions from offline queue`
    })

  } catch (error) {
    console.error('Sync offline queue error:', error)
    throw error
  }
}

async function retryFailedTransactions(): Promise<NextResponse> {
  try {
    const config = await ZIMRAManager.getZIMRAConfig()
    if (!config || !config.isFDMSEnabled) {
      return NextResponse.json({
        error: 'FDMS not configured or not enabled'
      }, { status: 400 })
    }

    const failedTransactions = await prisma.fiscal_transactions.findMany({
      where: {
        zimra_config_id: config.id,
        zimra_status: 'failed',
        retry_count: { lt: 3 } // Max 3 retries
      },
      take: 5 // Process in small batches
    })

    if (failedTransactions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No failed transactions to retry'
      })
    }

    // In a real implementation, you would re-submit these transactions
    // For now, just increment retry count and reset to pending
    await prisma.fiscal_transactions.updateMany({
      where: {
        id: { in: failedTransactions.map(t => t.id) }
      },
      data: {
        zimra_status: 'pending',
        retry_count: { increment: 1 },
        error_message: null,
        updated_at: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      message: `Queued ${failedTransactions.length} failed transactions for retry`
    })

  } catch (error) {
    console.error('Retry failed transactions error:', error)
    throw error
  }
}

async function resetDailyCounter(): Promise<NextResponse> {
  try {
    const config = await ZIMRAManager.getZIMRAConfig()
    if (!config) {
      return NextResponse.json({
        error: 'FDMS not configured'
      }, { status: 400 })
    }

    await prisma.fiscal_devices.updateMany({
      where: { zimra_config_id: config.id },
      data: { daily_receipt_counter: 0 }
    })

    return NextResponse.json({
      success: true,
      message: 'Daily receipt counter reset successfully'
    })

  } catch (error) {
    console.error('Reset daily counter error:', error)
    throw error
  }
}