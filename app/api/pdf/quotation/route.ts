import { NextRequest, NextResponse } from 'next/server'
import { generateQuotationPDF, QuotationPDFData } from '@/lib/utils/pdf-generator'

export async function POST(request: NextRequest) {
  try {
    const quotationData: QuotationPDFData = await request.json()

    // Validate required fields
    if (!quotationData.organization || !quotationData.quotationNumber) {
      return NextResponse.json(
        { error: 'Missing required fields: organization and quotationNumber' },
        { status: 400 }
      )
    }

    // Generate PDF
    const pdfBuffer = await generateQuotationPDF(quotationData)

    // Return PDF as response
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="quotation-${quotationData.quotationNumber}.pdf"`
      }
    })

  } catch (error) {
    console.error('Error generating quotation PDF:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}