import { NextRequest, NextResponse } from 'next/server'
import { generateStandardPDF } from '@/lib/report-utils'

export async function GET(req: NextRequest) {
  try {
    // Mock data for testing
    const mockSales = [
      {
        id: '1',
        date: '2024-01-15',
        reference: 'SAL-001',
        customer_name: 'John Doe',
        warehouse_name: 'Main Warehouse',
        status: 'completed',
        payment_status: 'paid',
        subtotal: 100,
        tax_amount: 10,
        discount: 5,
        total: 105,
        paid: 105,
        due: 0
      },
      {
        id: '2',
        date: '2024-01-16',
        reference: 'SAL-002',
        customer_name: 'Jane Smith',
        warehouse_name: 'Secondary Warehouse',
        status: 'pending',
        payment_status: 'unpaid',
        subtotal: 200,
        tax_amount: 20,
        discount: 0,
        total: 220,
        paid: 0,
        due: 220
      }
    ]

    const reportData = {
      title: 'Test Sales Report',
      template: 'sales-report',
      data: mockSales,
      dateRange: 'January 2024',
      summary: [
        { label: 'Total Sales', value: mockSales.length },
        { label: 'Total Revenue', value: mockSales.reduce((sum, sale) => sum + sale.total, 0), isCurrency: true },
        { label: 'Total Paid', value: mockSales.reduce((sum, sale) => sum + sale.paid, 0), isCurrency: true },
        { label: 'Total Due', value: mockSales.reduce((sum, sale) => sum + sale.due, 0), isCurrency: true }
      ],
      showSummaryByStatus: true,
      statusSummary: [
        { status: 'completed', count: 1, amount: 105 },
        { status: 'pending', count: 1, amount: 220 }
      ]
    }

    // Forward to PDF generation API
    const response = await fetch(`${req.nextUrl.origin}/api/reports/pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(reportData)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.details || 'Failed to generate test PDF')
    }

    const pdfBuffer = await response.arrayBuffer()

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="test-sales-report.pdf"',
        'Content-Length': pdfBuffer.byteLength.toString()
      }
    })

  } catch (error) {
    console.error('Test PDF Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate test PDF',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  return NextResponse.json({
    message: 'Use GET to download a test PDF',
    endpoint: '/api/test-pdf'
  })
}