import { NextRequest, NextResponse } from 'next/server'
import { generateReceiptPDF, ReceiptPDFData } from '@/lib/utils/pdf-generator'

export async function POST(request: NextRequest) {
  try {
    const receiptData: ReceiptPDFData = await request.json()

    // Validate required fields
    if (!receiptData.organization || !receiptData.receiptNumber) {
      return NextResponse.json(
        { error: 'Missing required fields: organization and receiptNumber' },
        { status: 400 }
      )
    }

    // Generate PDF
    const pdfBuffer = await generateReceiptPDF(receiptData)

    // Return PDF as response
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="receipt-${receiptData.receiptNumber}.pdf"`
      }
    })

  } catch (error) {
    console.error('Error generating receipt PDF:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}