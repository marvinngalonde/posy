import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { ZIMRAManager } from '@/lib/zimra/client'
import type { ZIMRAInvoiceData } from '@/lib/zimra/types'

const prisma = new PrismaClient()

export async function POST(req: NextRequest) {
  try {
    const invoiceData: ZIMRAInvoiceData = await req.json()

    console.log('FDMS fiscal invoice request:', {
      invoiceNo: invoiceData.invoiceNo,
      total: invoiceData.total,
      itemCount: invoiceData.items?.length || 0
    })

    // Validate required fields
    if (!invoiceData.invoiceNo || !invoiceData.total || !invoiceData.items) {
      return NextResponse.json({
        error: 'Missing required fields: invoiceNo, total, items'
      }, { status: 400 })
    }

    // Validate items
    if (!Array.isArray(invoiceData.items) || invoiceData.items.length === 0) {
      return NextResponse.json({
        error: 'Invoice must contain at least one item'
      }, { status: 400 })
    }

    // Check if FDMS is enabled
    const isFDMSEnabled = await ZIMRAManager.isFDMSEnabled()

    let result
    if (isFDMSEnabled) {
      // FDMS Mode - Use ZIMRA client
      const zimraClient = await ZIMRAManager.createZIMRAClient()

      if (!zimraClient) {
        return NextResponse.json({
          error: 'ZIMRA client not available. Please configure FDMS first.'
        }, { status: 500 })
      }

      result = await zimraClient.submitFiscalInvoice(invoiceData)
    } else {
      // Non-FDMS Mode - Simple receipt generation
      const receiptNo = Date.now()
      result = {
        success: true,
        receiptGlobalNo: BigInt(receiptNo),
        qrCodeData: {
          data: {
            deviceId: 'NON-FDMS',
            receiptNo: BigInt(receiptNo),
            total: invoiceData.total,
            date: new Date().toISOString(),
            verification: 'NON-FDMS-MODE'
          },
          qrString: JSON.stringify({
            mode: 'NON-FDMS',
            receiptNo: receiptNo,
            total: invoiceData.total,
            date: new Date().toISOString()
          }),
          qrCodeUrl: ''
        },
        status: 'non_fdms_mode',
        message: 'Receipt generated in non-FDMS mode'
      }
    }

    // Update the original sale record if saleId is provided
    if (invoiceData.saleId && result.success) {
      try {
        await prisma.sales.update({
          where: { id: invoiceData.saleId },
          data: {
            is_fiscalized: true,
            fiscal_transaction_id: result.receiptGlobalNo ? BigInt(result.receiptGlobalNo.toString()) : null,
            zimra_qr_code: JSON.stringify(result.qrCodeData)
          }
        })

        console.log(`Updated sale ${invoiceData.saleId} with fiscal data`)
      } catch (updateError) {
        console.error('Failed to update sale with fiscal data:', updateError)
        // Don't fail the whole request if sale update fails
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        receiptGlobalNo: result.receiptGlobalNo?.toString(),
        qrCode: result.qrCodeData,
        verificationUrl: result.verificationUrl,
        status: result.status || 'confirmed',
        fdmsMode: isFDMSEnabled,
        message: result.message
      }
    })

  } catch (error: unknown) {
    console.error('FDMS invoice submission error:', error)
    const message = error instanceof Error ? error.message : "Unknown error"

    // Provide more specific error messages
    let statusCode = 500
    let errorMessage = message

    if (message.includes('not initialized')) {
      statusCode = 503
      errorMessage = 'FDMS service not properly configured'
    } else if (message.includes('Validation')) {
      statusCode = 422
      errorMessage = 'Invoice data validation failed'
    } else if (message.includes('network') || message.includes('ECONNREFUSED')) {
      statusCode = 503
      errorMessage = 'ZIMRA service temporarily unavailable'
    }

    return NextResponse.json({
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? message : undefined
    }, { status: statusCode })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get("limit") || "50")
    const status = searchParams.get("status")

    console.log('Getting fiscal transactions:', { limit, status })

    const whereClause: any = {}
    if (status) {
      whereClause.zimra_status = status
    }

    const transactions = await prisma.fiscal_transactions.findMany({
      where: whereClause,
      select: {
        id: true,
        receipt_global_no: true,
        receipt_type: true,
        invoice_no: true,
        receipt_total: true,
        tax_amount: true,
        receipt_date: true,
        zimra_status: true,
        buyer_name: true,
        device_id: true,
        error_message: true,
        retry_count: true
      },
      orderBy: {
        receipt_date: 'desc'
      },
      take: limit
    })

    // Get FDMS status
    const isFDMSEnabled = await ZIMRAManager.isFDMSEnabled()
    const config = await ZIMRAManager.getZIMRAConfig()

    return NextResponse.json({
      success: true,
      data: {
        transactions: transactions.map(tx => ({
          ...tx,
          receipt_global_no: tx.receipt_global_no.toString(),
          receipt_total: parseFloat(tx.receipt_total.toString()),
          tax_amount: parseFloat(tx.tax_amount.toString())
        })),
        summary: {
          totalTransactions: transactions.length,
          fdmsEnabled: isFDMSEnabled,
          configStatus: config?.status || 'not_configured'
        }
      }
    })

  } catch (error: unknown) {
    console.error('Get fiscal transactions error:', error)
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}