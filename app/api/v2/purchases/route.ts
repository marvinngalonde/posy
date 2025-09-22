import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import type {
  Purchase,
  PaginatedResponse,
  ApiResponse,
  PurchaseSearchParams
} from "@/lib/types/prisma"

/**
 * GET - Retrieve purchases with pagination and search
 * Supports both list view and single purchase retrieval by ID
 */
export async function GET(req: NextRequest): Promise<NextResponse<Purchase | PaginatedResponse<Purchase> | ApiResponse>> {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search") || ""
    const supplier_id = searchParams.get("supplier_id")
    const warehouse_id = searchParams.get("warehouse_id")
    const status = searchParams.get("status")
    const payment_status = searchParams.get("payment_status")
    const date_from = searchParams.get("date_from")
    const date_to = searchParams.get("date_to")
    const offset = (page - 1) * limit

    // Get single purchase by ID
    if (id) {
      const purchase = await prisma.purchases.findUnique({
        where: { id: parseInt(id) },
        include: {
          suppliers: { select: { id: true, name: true, email: true, phone: true } },
          warehouses: { select: { id: true, name: true } },
          users: { select: { id: true, name: true } },
          purchase_items: {
            include: {
              products: { select: { id: true, name: true, code: true } }
            }
          }
        }
      })

      if (!purchase) {
        return NextResponse.json(
          { error: "Purchase not found" },
          { status: 404 }
        )
      }

      return NextResponse.json(purchase)
    }

    // Build where clause for filters
    const where: any = {}

    if (search) {
      where.OR = [
        { reference: { contains: search, mode: 'insensitive' } },
        { supplier: { name: { contains: search, mode: 'insensitive' } } },
        { notes: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (supplier_id) {
      where.supplier_id = parseInt(supplier_id)
    }

    if (warehouse_id) {
      where.warehouse_id = parseInt(warehouse_id)
    }

    if (status) {
      where.status = status
    }

    if (payment_status) {
      where.payment_status = payment_status
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

    const [purchases, total] = await Promise.all([
      prisma.purchases.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { date: "desc" },
        include: {
          suppliers: { select: { name: true } },
          warehouses: { select: { name: true } },
          users: { select: { name: true } },
          _count: {
            select: {
              purchase_items: true
            }
          }
        }
      }),
      prisma.purchases.count({ where })
    ])

    return NextResponse.json({
      data: purchases,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('GET purchases error:', error)
    return NextResponse.json(
      { error: "Failed to fetch purchases" },
      { status: 500 }
    )
  }
}

/**
 * POST - Create a new purchase with items
 * Validates required fields and creates purchase with items in a transaction
 */
export async function POST(request: NextRequest): Promise<NextResponse<Purchase | ApiResponse>> {
  try {
    const body = await request.json()
    const {
      reference,
      supplier_id,
      warehouse_id,
      date,
      subtotal = 0,
      tax_rate = 0,
      tax_amount = 0,
      discount = 0,
      shipping = 0,
      total,
      paid = 0,
      status = 'pending',
      payment_status = 'unpaid',
      notes,
      created_by,
      items = []
    } = body

    // Validation
    if (!supplier_id || !warehouse_id || !date || !total) {
      return NextResponse.json(
        { error: "Supplier ID, warehouse ID, date, and total are required" },
        { status: 400 }
      )
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "At least one purchase item is required" },
        { status: 400 }
      )
    }

    // Generate reference if not provided
    let purchaseReference = reference
    if (!purchaseReference) {
      purchaseReference = `PUR-${Date.now()}`
    }

    // Check if reference already exists
    const existingPurchase = await prisma.purchases.findFirst({
      where: { reference: purchaseReference }
    })

    if (existingPurchase) {
      return NextResponse.json(
        { error: "Purchase reference already exists" },
        { status: 400 }
      )
    }

    // Validate supplier and warehouse exist
    const [supplierExists, warehouseExists] = await Promise.all([
      prisma.suppliers.findUnique({ where: { id: supplier_id } }),
      prisma.warehouses.findUnique({ where: { id: warehouse_id } })
    ])

    if (!supplierExists) {
      return NextResponse.json(
        { error: "Supplier not found" },
        { status: 400 }
      )
    }

    if (!warehouseExists) {
      return NextResponse.json(
        { error: "Warehouse not found" },
        { status: 400 }
      )
    }

    // Calculate due amount
    const due = parseFloat(total) - parseFloat(paid)

    // Create purchase with items in a transaction
    const newPurchase = await prisma.$transaction(async (tx) => {
      // Create the purchase
      const purchase = await tx.purchases.create({
        data: {
          reference: purchaseReference,
          supplier_id,
          warehouse_id,
          date: new Date(date),
          subtotal: parseFloat(subtotal),
          tax_rate: parseFloat(tax_rate),
          tax_amount: parseFloat(tax_amount),
          discount: parseFloat(discount),
          shipping: parseFloat(shipping),
          total: parseFloat(total),
          paid: parseFloat(paid),
          due,
          status,
          payment_status,
          notes,
          created_by: created_by || 1
        },
        include: {
          suppliers: { select: { name: true } },
          warehouses: { select: { name: true } }
        }
      })

      // Create purchase items
      const purchaseItems = await Promise.all(
        items.map((item: any) =>
          tx.purchase_items.create({
            data: {
              purchase_id: purchase.id,
              product_id: item.product_id,
              quantity: parseFloat(item.quantity),
              unit_cost: parseFloat(item.unit_cost),
              discount: parseFloat(item.discount || 0),
              tax: parseFloat(item.tax || 0),
              subtotal: parseFloat(item.subtotal)
            }
          })
        )
      )

      // Update product stock if purchase status is 'received'
      if (status === 'received') {
        await Promise.all(
          items.map((item: any) =>
            tx.products.update({
              where: { id: item.product_id },
              data: { stock: { increment: parseFloat(item.quantity) } }
            })
          )
        )
      }

      return { ...purchase, items: purchaseItems }
    })

    return NextResponse.json(newPurchase, { status: 201 })
  } catch (error) {
    console.error('POST purchases error:', error)
    return NextResponse.json(
      { error: "Failed to create purchase" },
      { status: 500 }
    )
  }
}

/**
 * PUT - Update an existing purchase
 * Replaces all purchase data and items
 */
export async function PUT(request: NextRequest): Promise<NextResponse<Purchase | ApiResponse>> {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: "Purchase ID is required" },
        { status: 400 }
      )
    }

    const body = await request.json()
    const {
      supplier_id,
      warehouse_id,
      date,
      subtotal = 0,
      tax_rate = 0,
      tax_amount = 0,
      discount = 0,
      shipping = 0,
      total,
      paid = 0,
      status,
      payment_status,
      notes,
      items = []
    } = body

    // Validation
    if (!supplier_id || !warehouse_id || !date || !total) {
      return NextResponse.json(
        { error: "Supplier ID, warehouse ID, date, and total are required" },
        { status: 400 }
      )
    }

    // Check if purchase exists
    const existingPurchase = await prisma.purchases.findUnique({
      where: { id: parseInt(id) },
      include: { purchase_items: true }
    })

    if (!existingPurchase) {
      return NextResponse.json(
        { error: "Purchase not found" },
        { status: 404 }
      )
    }

    // Calculate due amount
    const due = parseFloat(total) - parseFloat(paid)

    // Update purchase with items in a transaction
    const updatedPurchase = await prisma.$transaction(async (tx) => {
      // Delete existing items
      await tx.purchase_items.deleteMany({
        where: { purchase_id: parseInt(id) }
      })

      // Update the purchase
      const purchase = await tx.purchases.update({
        where: { id: parseInt(id) },
        data: {
          supplier_id,
          warehouse_id,
          date: new Date(date),
          subtotal: parseFloat(subtotal),
          tax_rate: parseFloat(tax_rate),
          tax_amount: parseFloat(tax_amount),
          discount: parseFloat(discount),
          shipping: parseFloat(shipping),
          total: parseFloat(total),
          paid: parseFloat(paid),
          due,
          status,
          payment_status,
          notes,
          updated_at: new Date()
        },
        include: {
          suppliers: { select: { name: true } },
          warehouses: { select: { name: true } }
        }
      })

      // Create new items
      const purchaseItems = await Promise.all(
        items.map((item: any) =>
          tx.purchase_items.create({
            data: {
              purchase_id: purchase.id,
              product_id: item.product_id,
              quantity: parseFloat(item.quantity),
              unit_cost: parseFloat(item.unit_cost),
              discount: parseFloat(item.discount || 0),
              tax: parseFloat(item.tax || 0),
              subtotal: parseFloat(item.subtotal)
            }
          })
        )
      )

      return { ...purchase, items: purchaseItems }
    })

    return NextResponse.json(updatedPurchase)
  } catch (error) {
    console.error('PUT purchases error:', error)
    return NextResponse.json(
      { error: "Failed to update purchase" },
      { status: 500 }
    )
  }
}

/**
 * PATCH - Partial update of purchase fields
 * Updates only provided fields, handles status changes for stock updates
 */
export async function PATCH(request: NextRequest): Promise<NextResponse<Purchase | ApiResponse>> {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: "Purchase ID is required" },
        { status: 400 }
      )
    }

    const body = await request.json()

    // Check if purchase exists
    const existingPurchase = await prisma.purchases.findUnique({
      where: { id: parseInt(id) },
      include: { purchase_items: true }
    })

    if (!existingPurchase) {
      return NextResponse.json(
        { error: "Purchase not found" },
        { status: 404 }
      )
    }

    // Calculate new due amount if total or paid is being updated
    let updateData: any = { ...body, updated_at: new Date() }
    if (body.total !== undefined || body.paid !== undefined) {
      const newTotal = body.total !== undefined ? parseFloat(body.total) : existingPurchase.total
      const newPaid = body.paid !== undefined ? parseFloat(body.paid) : existingPurchase.paid
      updateData.due = newTotal - newPaid
    }

    // Handle status change for stock updates
    const statusChanged = body.status && body.status !== existingPurchase.status
    const oldStatus = existingPurchase.status
    const newStatus = body.status

    const updatedPurchase = await prisma.$transaction(async (tx) => {
      // Update the purchase
      const purchase = await tx.purchases.update({
        where: { id: parseInt(id) },
        data: updateData,
        include: {
          suppliers: { select: { name: true } },
          warehouses: { select: { name: true } },
          purchase_items: {
            include: {
              products: { select: { name: true, code: true } }
            }
          }
        }
      })

      // Handle stock updates based on status changes
      if (statusChanged) {
        if (oldStatus !== 'received' && newStatus === 'received') {
          // Add stock when changing to received
          await Promise.all(
            existingPurchase.purchase_items.map(item =>
              tx.products.update({
                where: { id: item.product_id },
                data: { stock: { increment: item.quantity } }
              })
            )
          )
        } else if (oldStatus === 'received' && newStatus !== 'received') {
          // Remove stock when changing from received
          await Promise.all(
            existingPurchase.purchase_items.map(item =>
              tx.products.update({
                where: { id: item.product_id },
                data: { stock: { decrement: item.quantity } }
              })
            )
          )
        }
      }

      return purchase
    })

    return NextResponse.json(updatedPurchase)
  } catch (error) {
    console.error('PATCH purchases error:', error)
    return NextResponse.json(
      { error: "Failed to update purchase" },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Remove a purchase
 * Checks for associated records and handles stock adjustments
 */
export async function DELETE(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "Purchase ID is required" },
        { status: 400 }
      )
    }

    // Check if purchase exists
    const existingPurchase = await prisma.purchases.findUnique({
      where: { id: parseInt(id) },
      include: {
        purchase_items: true,
        purchase_returns: { select: { id: true } }
      }
    })

    if (!existingPurchase) {
      return NextResponse.json(
        { error: "Purchase not found" },
        { status: 404 }
      )
    }

    // Check for associated purchase returns
    if (existingPurchase.purchase_returns.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete purchase with associated returns" },
        { status: 400 }
      )
    }

    // Delete purchase and handle stock adjustments in a transaction
    await prisma.$transaction(async (tx) => {
      // If purchase was received, adjust stock back
      if (existingPurchase.status === 'received') {
        await Promise.all(
          existingPurchase.purchase_items.map(item =>
            tx.products.update({
              where: { id: item.product_id },
              data: { stock: { decrement: item.quantity } }
            })
          )
        )
      }

      // Delete purchase items first
      await tx.purchase_items.deleteMany({
        where: { purchase_id: parseInt(id) }
      })

      // Delete the purchase
      await tx.purchases.delete({
        where: { id: parseInt(id) }
      })
    })

    return NextResponse.json({
      message: "Purchase deleted successfully",
      success: true
    })
  } catch (error) {
    console.error('DELETE purchases error:', error)
    return NextResponse.json(
      { error: "Failed to delete purchase" },
      { status: 500 }
    )
  }
}