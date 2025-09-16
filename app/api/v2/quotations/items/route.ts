import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const quotation_id = searchParams.get('quotation_id')

    if (!quotation_id) {
      return NextResponse.json(
        { error: 'quotation_id parameter is required' },
        { status: 400 }
      )
    }

    const items = await prisma.quotation_items.findMany({
      where: {
        quotation_id: parseInt(quotation_id)
      },
      include: {
        products: {
          select: {
            id: true,
            name: true,
            code: true,
            price: true
          }
        }
      },
      orderBy: {
        id: 'asc'
      }
    })

    return NextResponse.json({
      success: true,
      data: items
    })
  } catch (error) {
    console.error('Error fetching quotation items:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch quotation items',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}