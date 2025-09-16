import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import type {
  Adjustment,
  PaginatedResponse,
  ApiResponse,
  SearchParams
} from "@/lib/types/prisma"

/**
 * GET - Retrieve adjustments with pagination and search
 * Supports both list view and single adjustment retrieval by ID
 */
export async function GET(req: NextRequest): Promise<NextResponse<Adjustment | PaginatedResponse<Adjustment> | ApiResponse>> {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search") || ""
    const warehouse_id = searchParams.get("warehouse_id")
    const type = searchParams.get("type")
    const date_from = searchParams.get("date_from")
    const date_to = searchParams.get("date_to")
    const offset = (page - 1) * limit

    // Get single adjustment by ID
    if (id) {
      const adjustment = await prisma.adjustments.findUnique({
        where: { id: parseInt(id) },
        include: {
          warehouse: { select: { id: true, name: true } },
          createdBy: { select: { id: true, name: true } },
          items: {
            include: {
              product: { select: { id: true, name: true, code: true } }
            }
          }
        }
      })

      if (!adjustment) {
        return NextResponse.json(
          { error: "Adjustment not found" },
          { status: 404 }
        )
      }

      return NextResponse.json(adjustment)
    }

    // Build where clause for filters
    const where: any = {}

    if (search) {
      where.OR = [
        { reference: { contains: search, mode: 'insensitive' as const } },
        { notes: { contains: search, mode: 'insensitive' as const } }
      ]
    }

    if (warehouse_id) {
      where.warehouse_id = parseInt(warehouse_id)
    }

    if (type) {
      where.type = type
    }

    if (date_from || date_to) {
      where.date = {}
      if (date_from) {
        where.date.gte = new Date(date_from)
      }
      if (date_to) {
        where.date.lte = new Date(date_to)
      }
    }

    const [adjustments, total] = await Promise.all([
      prisma.adjustments.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { date: "desc" },
        include: {
          warehouse: { select: { name: true } },
          createdBy: { select: { name: true } },
          _count: {
            select: {
              items: true
            }
          }
        }
      }),
      prisma.adjustments.count({ where })
    ])

    // Format response to match existing expectations
    const formattedAdjustments = adjustments.map(adj => ({
      ...adj,
      warehouse_name: adj.warehouse?.name,
      item_count: adj._count.items
    }))

    return NextResponse.json({
      data: formattedAdjustments,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('GET adjustments error:', error)
    return NextResponse.json(
      { error: "Failed to fetch adjustments" },
      { status: 500 }
    )
  }
}

/**
 * POST - Create a new adjustment with items
 * Validates required fields and creates adjustment with items in a transaction
 */
export async function POST(request: NextRequest): Promise<NextResponse<Adjustment | ApiResponse>> {
  try {
    const body = await request.json()
    const {
      reference,
      warehouse_id,
      date,
      type = 'addition',
      notes,
      created_by,
      items = []
    } = body

    // Validation
    if (!warehouse_id || !date) {
      return NextResponse.json(
        { error: "Warehouse ID and date are required" },
        { status: 400 }
      )
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "At least one adjustment item is required" },
        { status: 400 }
      )
    }

    // Generate reference if not provided
    let adjustmentReference = reference
    if (!adjustmentReference) {
      adjustmentReference = `ADJ-${Date.now().toString().slice(-6)}`
    }

    // Check if reference already exists
    const existingAdjustment = await prisma.adjustments.findFirst({
      where: { reference: adjustmentReference }
    })

    if (existingAdjustment) {
      return NextResponse.json(
        { error: "Adjustment reference already exists" },
        { status: 400 }
      )
    }

    // Validate warehouse exists
    const warehouseExists = await prisma.warehouses.findUnique({
      where: { id: warehouse_id }
    })

    if (!warehouseExists) {
      return NextResponse.json(
        { error: "Warehouse not found" },
        { status: 400 }
      )
    }

    // Validate all items have required fields
    for (const item of items) {
      if (!item.product_id || !item.quantity || !item.type) {
        return NextResponse.json(
          { error: "Each item must have product_id, quantity, and type" },
          { status: 400 }
        )
      }
    }

    // Ensure we have a valid user ID
    let validCreatedBy = created_by ? parseInt(created_by.toString()) : null
    if (!validCreatedBy) {
      // Try to find the first admin user
      const adminUser = await prisma.users.findFirst({
        where: { role: 'admin' }
      })
      if (adminUser) {
        validCreatedBy = adminUser.id
      } else {
        // If no admin user exists, try to find any user
        const anyUser = await prisma.users.findFirst()
        if (anyUser) {
          validCreatedBy = anyUser.id
        } else {
          return NextResponse.json(
            { error: 'No valid user found. Please ensure at least one user exists in the system.' },
            { status: 400 }
          )
        }
      }
    }

    // Create adjustment with items in a transaction
    const newAdjustment = await prisma.$transaction(async (tx) => {
      // Create the adjustment
      const adjustment = await tx.adjustments.create({
        data: {
          reference: adjustmentReference,
          warehouse_id,
          date: new Date(date),
          type,
          notes,
          created_by: validCreatedBy,
          items: {
            create: items.map((item: any) => ({
              product_id: item.product_id,
              quantity: parseFloat(item.quantity),
              type: item.type,
              pre_stock: item.pre_stock
            }))
          }
        },
        include: {
          warehouse: { select: { name: true } },
          items: {
            include: {
              product: { select: { name: true, code: true } }
            }
          }
        }
      })

      // Update product stock for each item
      for (const item of items) {
        const stockChange = item.type === "addition"
          ? parseFloat(item.quantity)
          : -parseFloat(item.quantity)

        await tx.products.update({
          where: { id: item.product_id },
          data: { stock: { increment: stockChange } }
        })
      }

      return adjustment
    })

    return NextResponse.json({
      success: true,
      adjustment_id: newAdjustment.id,
      reference: newAdjustment.reference,
      ...newAdjustment
    }, { status: 201 })
  } catch (error) {
    console.error('POST adjustments error:', error)
    return NextResponse.json(
      { error: "Failed to create adjustment" },
      { status: 500 }
    )
  }
}

/**
 * PUT - Update an existing adjustment
 * Replaces all adjustment data and items
 */
export async function PUT(request: NextRequest): Promise<NextResponse<Adjustment | ApiResponse>> {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: "Adjustment ID is required" },
        { status: 400 }
      )
    }

    const body = await request.json()
    const {
      warehouse_id,
      date,
      type,
      notes,
      items = []
    } = body

    // Validation
    if (!warehouse_id || !date) {
      return NextResponse.json(
        { error: "Warehouse ID and date are required" },
        { status: 400 }
      )
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "At least one adjustment item is required" },
        { status: 400 }
      )
    }

    // Check if adjustment exists
    const existingAdjustment = await prisma.adjustments.findUnique({
      where: { id: parseInt(id) },
      include: { items: true }
    })

    if (!existingAdjustment) {
      return NextResponse.json(
        { error: "Adjustment not found" },
        { status: 404 }
      )
    }

    // Update adjustment with items in a transaction
    const updatedAdjustment = await prisma.$transaction(async (tx) => {
      // Revert stock changes from old items
      for (const oldItem of existingAdjustment.items) {
        const oldStockChange = oldItem.type === "addition"
          ? -oldItem.quantity
          : oldItem.quantity

        await tx.products.update({
          where: { id: oldItem.product_id },
          data: { stock: { increment: oldStockChange } }
        })
      }

      // Delete existing items
      await tx.adjustment_items.deleteMany({
        where: { adjustment_id: parseInt(id) }
      })

      // Update the adjustment
      const adjustment = await tx.adjustments.update({
        where: { id: parseInt(id) },
        data: {
          warehouse_id,
          date: new Date(date),
          type,
          notes,
          updated_at: new Date()
        },
        include: {
          warehouse: { select: { name: true } }
        }
      })

      // Create new items
      const adjustmentItems = await Promise.all(
        items.map((item: any) =>
          tx.adjustment_items.create({
            data: {
              adjustment_id: adjustment.id,
              product_id: item.product_id,
              quantity: parseFloat(item.quantity),
              type: item.type,
              pre_stock: item.pre_stock
            }
          })
        )
      )

      // Apply new stock changes
      for (const item of items) {
        const stockChange = item.type === "addition"
          ? parseFloat(item.quantity)
          : -parseFloat(item.quantity)

        await tx.products.update({
          where: { id: item.product_id },
          data: { stock: { increment: stockChange } }
        })
      }

      return { ...adjustment, items: adjustmentItems }
    })

    return NextResponse.json(updatedAdjustment)
  } catch (error) {
    console.error('PUT adjustments error:', error)
    return NextResponse.json(
      { error: "Failed to update adjustment" },
      { status: 500 }
    )
  }
}

/**
 * PATCH - Partial update of adjustment fields
 * Updates only provided fields
 */
export async function PATCH(request: NextRequest): Promise<NextResponse<Adjustment | ApiResponse>> {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: "Adjustment ID is required" },
        { status: 400 }
      )
    }

    const body = await request.json()

    // Check if adjustment exists
    const existingAdjustment = await prisma.adjustments.findUnique({
      where: { id: parseInt(id) }
    })

    if (!existingAdjustment) {
      return NextResponse.json(
        { error: "Adjustment not found" },
        { status: 404 }
      )
    }

    // Convert date if provided
    if (body.date) {
      body.date = new Date(body.date)
    }

    const updatedAdjustment = await prisma.adjustments.update({
      where: { id: parseInt(id) },
      data: {
        ...body,
        updated_at: new Date()
      },
      include: {
        warehouse: { select: { name: true } },
        items: {
          include: {
            product: { select: { name: true, code: true } }
          }
        }
      }
    })

    return NextResponse.json(updatedAdjustment)
  } catch (error) {
    console.error('PATCH adjustments error:', error)
    return NextResponse.json(
      { error: "Failed to update adjustment" },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Remove an adjustment
 * Reverses stock changes and deletes the adjustment
 */
export async function DELETE(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "Adjustment ID is required" },
        { status: 400 }
      )
    }

    // Check if adjustment exists
    const existingAdjustment = await prisma.adjustments.findUnique({
      where: { id: parseInt(id) },
      include: { items: true }
    })

    if (!existingAdjustment) {
      return NextResponse.json(
        { error: "Adjustment not found" },
        { status: 404 }
      )
    }

    // Delete adjustment and reverse stock changes in a transaction
    await prisma.$transaction(async (tx) => {
      // Reverse stock changes
      for (const item of existingAdjustment.items) {
        const stockChange = item.type === "addition"
          ? -item.quantity
          : item.quantity

        await tx.products.update({
          where: { id: item.product_id },
          data: { stock: { increment: stockChange } }
        })
      }

      // Delete adjustment items first
      await tx.adjustment_items.deleteMany({
        where: { adjustment_id: parseInt(id) }
      })

      // Delete the adjustment
      await tx.adjustments.delete({
        where: { id: parseInt(id) }
      })
    })

    return NextResponse.json({
      message: "Adjustment deleted successfully",
      success: true
    })
  } catch (error) {
    console.error('DELETE adjustments error:', error)
    return NextResponse.json(
      { error: "Failed to delete adjustment" },
      { status: 500 }
    )
  }
}