import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// GET - Read quotations (list with pagination or single by ID)
export async function GET(req: NextRequest) {
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
        where: { id },
        include: {
          customer: { select: { name: true } },
          warehouse: { select: { name: true } },
          items: true,
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
            { customer: { name: { contains: search, mode: 'insensitive' as const } } },
          ],
        }
      : {}

    const [quotations, total] = await Promise.all([
      prisma.quotations.findMany({
        where,
        skip: offset,
        take: limit,
        include: {
          customer: { select: { name: true } },
          warehouse: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
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

// POST - Create new quotation
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { 
      reference, 
      customerId, 
      warehouseId, 
      validUntil,
      notes,
      subtotal,
      taxAmount,
      total,
      items = []
    } = body

    // Validation
    if (!reference || !customerId || !warehouseId) {
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
        customerId,
        warehouseId,
        validUntil: validUntil ? new Date(validUntil) : null,
        notes,
        subtotal: subtotal || 0,
        taxAmount: taxAmount || 0,
        total: total || 0,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.total,
            description: item.description,
          }))
        }
      },
      include: {
        customer: { select: { name: true } },
        warehouse: { select: { name: true } },
        items: true,
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

// PUT - Update existing quotation
export async function PUT(req: NextRequest) {
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
      customerId, 
      warehouseId, 
      validUntil,
      notes,
      subtotal,
      taxAmount,
      total,
      items = []
    } = body

    // Check if quotation exists
    const existingQuotation = await prisma.quotations.findUnique({
      where: { id }
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
      await tx.quotationItems.deleteMany({
        where: { quotationId: id }
      })

      // Update quotation with new data and items
      return tx.quotations.update({
        where: { id },
        data: {
          reference: reference || existingQuotation.reference,
          customerId: customerId || existingQuotation.customerId,
          warehouseId: warehouseId || existingQuotation.warehouseId,
          validUntil: validUntil ? new Date(validUntil) : existingQuotation.validUntil,
          notes: notes !== undefined ? notes : existingQuotation.notes,
          subtotal: subtotal !== undefined ? subtotal : existingQuotation.subtotal,
          taxAmount: taxAmount !== undefined ? taxAmount : existingQuotation.taxAmount,
          total: total !== undefined ? total : existingQuotation.total,
          updatedAt: new Date(),
          items: {
            create: items.map((item: any) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              total: item.total,
              description: item.description,
            }))
          }
        },
        include: {
          customer: { select: { name: true } },
          warehouse: { select: { name: true } },
          items: true,
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

// DELETE - Delete quotation
export async function DELETE(req: NextRequest) {
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
      where: { id }
    })

    if (!existingQuotation) {
      return NextResponse.json(
        { error: "Quotation not found" },
        { status: 404 }
      )
    }

    // Delete quotation (cascade delete will handle items)
    await prisma.quotations.delete({
      where: { id }
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

// PATCH - Partial update (for status changes, etc.)
export async function PATCH(req: NextRequest) {
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
      where: { id }
    })

    if (!existingQuotation) {
      return NextResponse.json(
        { error: "Quotation not found" },
        { status: 404 }
      )
    }

    // Update only provided fields
    const updatedQuotation = await prisma.quotations.update({
      where: { id },
      data: {
        ...body,
        updatedAt: new Date(),
      },
      include: {
        customer: { select: { name: true } },
        warehouse: { select: { name: true } },
        items: true,
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