import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import type {
  Quotation,
 
  PaginatedResponse,
  ApiResponse,
 
} from "@/lib/types/prisma"

/**
 * GET - Retrieve quotations with pagination and search
 * Supports both list view and single quotation retrieval by ID
 */
export async function GET(req: NextRequest): Promise<NextResponse<Quotation | PaginatedResponse<Quotation> | ApiResponse>> {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search") || ""
    const offset = (page - 1) * limit

    // Get single quotation by ID
    if (id) {
      const quotation = await prisma.quotations.findUnique({
        where: { id: parseInt(id) },
        include: {
          customers: { select: { name: true } },
          warehouses: { select: { name: true } },
          quotation_items: true,
        },
      })
      
      if (!quotation) {
        return NextResponse.json(
          { error: "Quotation not found" },
          { status: 404 }
        )
      }
      
      return NextResponse.json(quotation)
    }

    // Get list of quotations with pagination and search
    const where = search
      ? {
          OR: [
            { reference: { contains: search, mode: 'insensitive' as const } },
            { customers: { name: { contains: search, mode: 'insensitive' as const } } },
          ],
        }
      : {}

    const [quotations, total] = await Promise.all([
      prisma.quotations.findMany({
        where,
        skip: offset,
        take: limit,
        include: {
          customers: { select: { name: true } },
          warehouses: { select: { name: true } },
        },
        orderBy: { created_at: 'desc' },
      }),
      prisma.quotations.count({ where }),
    ])

    return NextResponse.json({
      data: quotations,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('GET Error:', error)
    return NextResponse.json(
      { error: "Failed to fetch quotations" },
      { status: 500 }
    )
  }
}

/**
 * POST - Create a new quotation with items
 * Validates required fields and creates quotation with associated items
 */
export async function POST(req: NextRequest): Promise<NextResponse<Quotation | ApiResponse>> {
  try {
    const body = await req.json()
    const {
      reference,
      customer_id,
      warehouse_id,
      valid_until,
      notes,
      subtotal,
      tax_amount,
      total,
      items = []
    } = body

    // Validation
    if (!reference || !customer_id || !warehouse_id) {
      return NextResponse.json(
        { error: "Reference, customer ID, and warehouse ID are required" },
        { status: 400 }
      )
    }

    // Check if reference already exists
    const existingQuotation = await prisma.quotations.findUnique({
      where: { reference }
    })

    if (existingQuotation) {
      return NextResponse.json(
        { error: "Quotation reference already exists" },
        { status: 400 }
      )
    }

    // Create quotation with items
    const quotation = await prisma.quotations.create({
      data: {
        reference,
        customer_id,
        warehouse_id,
        date: new Date(),
        valid_until: valid_until ? new Date(valid_until) : null,
        notes,
        subtotal: subtotal || 0,
        tax_amount: tax_amount || 0,
        total: total || 0,
        created_by: 1, // TODO: Get from auth
        quotation_items: {
          create: items.map((item: any) => ({
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            subtotal: item.subtotal,
          }))
        }
      },
      include: {
        customers: { select: { name: true } },
        warehouses: { select: { name: true } },
        quotation_items: true,
      },
    })

    return NextResponse.json(quotation, { status: 201 })
  } catch (error) {
    console.error('POST Error:', error)
    return NextResponse.json(
      { error: "Failed to create quotation" },
      { status: 500 }
    )
  }
}

/**
 * PUT - Update an existing quotation
 * Replaces all quotation data and associated items
 */
export async function PUT(req: NextRequest): Promise<NextResponse<Quotation | ApiResponse>> {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: "Quotation ID is required" },
        { status: 400 }
      )
    }

    const body = await req.json()
    const {
      reference,
      customer_id,
      warehouse_id,
      valid_until,
      notes,
      subtotal,
      tax_amount,
      total,
      items = []
    } = body

    // Check if quotation exists
    const existingQuotation = await prisma.quotations.findUnique({
      where: { id: parseInt(id) }
    })

    if (!existingQuotation) {
      return NextResponse.json(
        { error: "Quotation not found" },
        { status: 404 }
      )
    }

    // Check if reference is being changed and if it already exists
    if (reference && reference !== existingQuotation.reference) {
      const duplicateReference = await prisma.quotations.findUnique({
        where: { reference }
      })

      if (duplicateReference) {
        return NextResponse.json(
          { error: "Quotation reference already exists" },
          { status: 400 }
        )
      }
    }

    // Update quotation (delete existing items and create new ones)
    const updatedQuotation = await prisma.$transaction(async (tx) => {
      // Delete existing items
      await tx.quotation_items.deleteMany({
        where: { quotation_id: parseInt(id) }
      })

      // Update quotation with new data and items
      return tx.quotations.update({
        where: { id: parseInt(id) },
        data: {
          reference: reference || existingQuotation.reference,
          customer_id: customer_id || existingQuotation.customer_id,
          warehouse_id: warehouse_id || existingQuotation.warehouse_id,
          valid_until: valid_until ? new Date(valid_until) : existingQuotation.valid_until,
          notes: notes !== undefined ? notes : existingQuotation.notes,
          subtotal: subtotal !== undefined ? subtotal : existingQuotation.subtotal,
          tax_amount: tax_amount !== undefined ? tax_amount : existingQuotation.tax_amount,
          total: total !== undefined ? total : existingQuotation.total,
          updated_at: new Date(),
          quotation_items: {
            create: items.map((item: any) => ({
              product_id: item.product_id,
              quantity: item.quantity,
              unit_price: item.unit_price,
              subtotal: item.subtotal,
            }))
          }
        },
        include: {
          customers: { select: { name: true } },
          warehouses: { select: { name: true } },
          quotation_items: true,
        },
      })
    })

    return NextResponse.json(updatedQuotation)
  } catch (error) {
    console.error('PUT Error:', error)
    return NextResponse.json(
      { error: "Failed to update quotation" },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Remove a quotation and all associated items
 * Uses cascade delete to handle quotation items
 */
export async function DELETE(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: "Quotation ID is required" },
        { status: 400 }
      )
    }

    // Check if quotation exists
    const existingQuotation = await prisma.quotations.findUnique({
      where: { id: parseInt(id) }
    })

    if (!existingQuotation) {
      return NextResponse.json(
        { error: "Quotation not found" },
        { status: 404 }
      )
    }

    // Delete quotation (cascade delete will handle items)
    await prisma.quotations.delete({
      where: { id: parseInt(id) }
    })

    return NextResponse.json(
      { message: "Quotation deleted successfully" },
      { status: 200 }
    )
  } catch (error) {
    console.error('DELETE Error:', error)
    return NextResponse.json(
      { error: "Failed to delete quotation" },
      { status: 500 }
    )
  }
}

/**
 * PATCH - Partial update of quotation fields
 * Useful for status changes and individual field updates
 */
export async function PATCH(req: NextRequest): Promise<NextResponse<Quotation | ApiResponse>> {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: "Quotation ID is required" },
        { status: 400 }
      )
    }

    const body = await req.json()

    // Check if quotation exists
    const existingQuotation = await prisma.quotations.findUnique({
      where: { id: parseInt(id) }
    })

    if (!existingQuotation) {
      return NextResponse.json(
        { error: "Quotation not found" },
        { status: 404 }
      )
    }

    // Update only provided fields
    const updatedQuotation = await prisma.quotations.update({
      where: { id: parseInt(id) },
      data: {
        ...body,
        updatedAt: new Date(),
      },
      include: {
        customers: { select: { name: true } },
        warehouses: { select: { name: true } },
        quotation_items: true,
      },
    })

    return NextResponse.json(updatedQuotation)
  } catch (error) {
    console.error('PATCH Error:', error)
    return NextResponse.json(
      { error: "Failed to update quotation" },
      { status: 500 }
    )
  }
}