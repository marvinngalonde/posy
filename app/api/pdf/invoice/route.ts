import { NextRequest, NextResponse } from 'next/server'
import { generateInvoicePDF, InvoicePDFData } from '@/lib/utils/pdf-generator'

export async function POST(request: NextRequest) {
  try {
    const invoiceData: InvoicePDFData = await request.json()

    // Validate required fields
    if (!invoiceData.organization || !invoiceData.invoiceNumber) {
      return NextResponse.json(
        { error: 'Missing required fields: organization and invoiceNumber' },
        { status: 400 }
      )
    }

    // Generate PDF
    const pdfBuffer = await generateInvoicePDF(invoiceData)

    // Return PDF as response
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${invoiceData.invoiceNumber}.pdf"`
      }
    })

  } catch (error) {
    console.error('Error generating invoice PDF:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}