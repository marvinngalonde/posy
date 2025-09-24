import { NextRequest, NextResponse } from 'next/server'
import PDFGenerator from '@/lib/pdf-generator'

interface ReportData {
  title: string
  template: string
  data: any[]
  filters?: Array<{ label: string; value: string }>
  summary?: Array<{ label: string; value: string | number; isCurrency?: boolean }>
  dateRange?: string
  company?: {
    name: string
    address?: string
    city?: string
    state?: string
    postal_code?: string
    phone?: string
    email?: string
  }
  totals?: any
  analytics?: any
  showSummaryByStatus?: boolean
  showSummaryBySupplier?: boolean
  showSummaryByPaymentStatus?: boolean
  showCustomerAnalytics?: boolean
  showSupplierAnalytics?: boolean
  statusSummary?: any[]
  supplierSummary?: any[]
  paymentStatusSummary?: any[]
  recommendations?: boolean
}

export async function POST(req: NextRequest) {
  try {
    const reportData: ReportData = await req.json()

    // Validate required fields
    if (!reportData.title || !reportData.template) {
      return NextResponse.json(
        { error: 'Missing required fields: title and template' },
        { status: 400 }
      )
    }

    // Get company information (you might want to fetch this from database)
    const defaultCompany = {
      name: 'POS System',
      address: '123 Business Street',
      city: 'Business City',
      state: 'BC',
      postal_code: '12345',
      phone: '(555) 123-4567',
      email: 'info@possystem.com'
    }

    // Calculate totals for financial reports
    let totals = reportData.totals
    if (!totals && reportData.data && reportData.data.length > 0) {
      const firstItem = reportData.data[0]
      if (firstItem.total !== undefined || firstItem.subtotal !== undefined) {
        totals = reportData.data.reduce((acc, item) => ({
          subtotal: (acc.subtotal || 0) + Number(item.subtotal || 0),
          tax_amount: (acc.tax_amount || 0) + Number(item.tax_amount || 0),
          discount: (acc.discount || 0) + Number(item.discount || 0),
          total: (acc.total || 0) + Number(item.total || 0),
          paid: (acc.paid || 0) + Number(item.paid || 0),
          due: (acc.due || 0) + Number(item.due || 0)
        }), {
          subtotal: 0,
          tax_amount: 0,
          discount: 0,
          total: 0,
          paid: 0,
          due: 0
        })
      }
    }

    // Calculate summary analytics for quantity alerts
    let summary
    if (reportData.template === 'quantity-alerts-report' && reportData.data) {
      summary = {
        critical: reportData.data.filter(item => item.stock <= (item.alert_quantity * 0.5)).length,
        high: reportData.data.filter(item =>
          item.stock > (item.alert_quantity * 0.5) && item.stock <= (item.alert_quantity * 0.8)
        ).length,
        medium: reportData.data.filter(item => item.stock > (item.alert_quantity * 0.8)).length
      }
    }

    // Prepare template data
    const templateData = {
      title: reportData.title,
      company: reportData.company || defaultCompany,
      generatedAt: new Date(),
      dateRange: reportData.dateRange,
      totalRecords: reportData.data?.length || 0,
      filters: reportData.filters,
      summary: reportData.summary,
      data: reportData.data || [],
      totals,
      analytics: reportData.analytics,
      showSummaryByStatus: reportData.showSummaryByStatus,
      showSummaryBySupplier: reportData.showSummaryBySupplier,
      showSummaryByPaymentStatus: reportData.showSummaryByPaymentStatus,
      showCustomerAnalytics: reportData.showCustomerAnalytics,
      showSupplierAnalytics: reportData.showSupplierAnalytics,
      statusSummary: reportData.statusSummary,
      supplierSummary: reportData.supplierSummary,
      paymentStatusSummary: reportData.paymentStatusSummary,
      summary: summary || reportData.summary,
      recommendations: reportData.recommendations,
      content: '' // This will be filled by the template
    }

    // Generate PDF
    const pdfGenerator = PDFGenerator.getInstance()
    const pdfBuffer = await pdfGenerator.generatePDF({
      template: reportData.template,
      data: templateData,
      filename: `${reportData.title.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.pdf`,
      format: 'A4',
      orientation: 'portrait'
    })

    // Return PDF as response
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${reportData.title.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.pdf"`,
        'Content-Length': pdfBuffer.length.toString()
      }
    })

  } catch (error) {
    console.error('PDF Generation Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate PDF',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  return NextResponse.json({
    message: 'PDF Generation API',
    supportedTemplates: [
      'sales-report',
      'purchases-report',
      'customers-report',
      'suppliers-report',
      'quantity-alerts-report',
      'sales-returns-report',
      'purchase-returns-report'
    ],
    usage: 'POST with report data to generate PDF'
  })
}