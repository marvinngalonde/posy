import { NextRequest, NextResponse } from 'next/server'
import { PDFGenerator } from '@/lib/pdf-generator'

export async function POST(request: NextRequest) {
  try {
    const reportData = await request.json()

    // Validate required fields
    if (!reportData.title || !reportData.data) {
      return NextResponse.json(
        { error: 'Missing required fields: title and data' },
        { status: 400 }
      )
    }

    // Initialize PDF generator (the one that works with existing templates)
    const pdfGenerator = PDFGenerator.getInstance()

    // Generate PDF using the existing system
    const pdfBuffer = await pdfGenerator.generatePDF({
      template: 'sales-report',
      data: reportData,
      filename: `sales-report-${new Date().toISOString().split('T')[0]}.pdf`
    })

    // Return PDF as response with proper headers for download
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="sales-report-${new Date().toISOString().split('T')[0]}.pdf"`
      }
    })

  } catch (error) {
    console.error('Error generating sales report PDF:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}