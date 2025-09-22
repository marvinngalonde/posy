import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import type { CreateSaleInput, UpdateSaleInput, SaleSearchParams } from "@/lib/types/prisma"

export async function POST(req: NextRequest) {
  try {
    const body: CreateSaleInput = await req.json()

    // Ensure we have a valid user ID
    let validCreatedBy = body.created_by ? parseInt(body.created_by.toString()) : null
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

    // Ensure we have a valid customer ID
    let validCustomerId = body.customer_id ? parseInt(body.customer_id.toString()) : null
    if (!validCustomerId) {
      // Try to find a default customer or create one
      let defaultCustomer = await prisma.customers.findFirst({
        where: { name: 'Walk-in Customer' }
      })

      if (!defaultCustomer) {
        // Create a default walk-in customer
        defaultCustomer = await prisma.customers.create({
          data: {
            name: 'Walk-in Customer',
            email: null,
            phone: null,
            address: null,
            status: 'active'
          }
        })
      }
      validCustomerId = defaultCustomer.id
    }

    // Ensure we have a valid warehouse ID
    let validWarehouseId = body.warehouse_id ? parseInt(body.warehouse_id.toString()) : null
    if (!validWarehouseId) {
      // Try to find the first warehouse
      const firstWarehouse = await prisma.warehouses.findFirst({
        where: { status: 'active' }
      })

      if (!firstWarehouse) {
        return NextResponse.json(
          { error: 'No active warehouse found. Please ensure at least one warehouse exists in the system.' },
          { status: 400 }
        )
      }
      validWarehouseId = firstWarehouse.id
    }

    const sale = await prisma.sales.create({
      data: {
        reference: body.reference || `SL-${Date.now()}`,
        customer_id: validCustomerId,
        warehouse_id: validWarehouseId,
        date: new Date(body.date),
        subtotal: body.subtotal ?? 0,
        tax_rate: body.tax_rate ?? 0,
        tax_amount: body.tax_amount ?? 0,
        discount: body.discount ?? 0,
        shipping: body.shipping ?? 0,
        total: body.total,
        paid: body.paid ?? 0,
        due: body.due ?? 0,
        status: body.status || "completed",
        payment_status: body.payment_status || "paid",
        notes: body.notes ?? null,
        created_by: validCreatedBy,
        sale_items: {
          create: body.items?.map(item => ({
            product_id: parseInt(item.product_id?.toString() || '0'),
            quantity: item.quantity,
            unit_price: item.unit_price,
            discount: item.discount || 0,
            tax: item.tax || 0,
            subtotal: (item.unit_price * item.quantity) - (item.discount || 0) + (item.tax || 0),
          })) || []
        }
      },
      include: {
        sale_items: true,
        customers: true,
        warehouses: true
      }
    })

    return NextResponse.json({
      success: true,
      data: sale,
      saleId: sale.id,
      reference: sale.reference
    })
  } catch (error) {
    console.error('Sale creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create sale', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search") || ""
    const customer_id = searchParams.get("customer_id")
    const warehouse_id = searchParams.get("warehouse_id")
    const status = searchParams.get("status")
    const payment_status = searchParams.get("payment_status")
    const date_from = searchParams.get("date_from")
    const date_to = searchParams.get("date_to")
    const sortBy = searchParams.get("sortBy") || "created_at"
    const sortOrder = searchParams.get("sortOrder") || "desc"

    const offset = (page - 1) * limit

    if (id) {
      const sale = await prisma.sales.findUnique({
        where: { id: parseInt(id) },
        include: {
          customers: { select: { name: true, email: true, phone: true } },
          warehouses: { select: { name: true } },
          sale_items: {
            include: {
              product: { select: { name: true, sku: true } }
            }
          },
        },
      })
      if (!sale) return NextResponse.json({ error: "Sale not found" }, { status: 404 })
      return NextResponse.json({ success: true, data: sale })
    }

    const where: any = {}

    if (search) {
      where.OR = [
        { reference: { contains: search } },
        { customer: { name: { contains: search } } },
      ]
    }

    if (customer_id) where.customer_id = parseInt(customer_id)
    if (warehouse_id) where.warehouse_id = parseInt(warehouse_id)
    if (status) where.status = status
    if (payment_status) where.payment_status = payment_status

    if (date_from || date_to) {
      where.date = {}
      if (date_from) where.date.gte = new Date(date_from)
      if (date_to) where.date.lte = new Date(date_to)
    }

    const orderBy: any = {}
    orderBy[sortBy] = sortOrder

    const [sales, total] = await Promise.all([
      prisma.sales.findMany({
        where,
        skip: offset,
        take: limit,
        include: {
          customers: { select: { name: true, email: true } },
          warehouses: { select: { name: true } },
          sale_items: { select: { quantity: true, unit_price: true, subtotal: true } }
        },
        orderBy,
      }),
      prisma.sales.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: sales,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Sales fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sales', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Missing sale ID" }, { status: 400 })
    }

    const body: UpdateSaleInput = await req.json()

    const sale = await prisma.sales.update({
      where: { id: parseInt(id) },
      data: {
        customer_id: body.customer_id ? parseInt(body.customer_id.toString()) : null,
        warehouse_id: body.warehouse_id ? parseInt(body.warehouse_id.toString()) : null,
        date: body.date ? new Date(body.date) : undefined,
        subtotal: body.subtotal,
        tax_rate: body.tax_rate,
        tax_amount: body.tax_amount,
        discount: body.discount,
        shipping: body.shipping,
        total: body.total,
        paid: body.paid,
        due: body.due,
        status: body.status,
        payment_status: body.payment_status,
        notes: body.notes,
        created_by: body.created_by ? parseInt(body.created_by.toString()) : undefined,
      },
      include: {
        sale_items: true,
        customers: true,
        warehouses: true
      }
    })

    return NextResponse.json({ success: true, data: sale })
  } catch (error) {
    console.error('Sale update error:', error)
    return NextResponse.json(
      { error: 'Failed to update sale', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Missing sale ID" }, { status: 400 })
    }

    // Delete sale items first, then the sale
    await prisma.sale_items.deleteMany({ where: { sale_id: parseInt(id) } })
    await prisma.sales.delete({ where: { id: parseInt(id) } })

    return NextResponse.json({ success: true, message: "Sale deleted successfully" })
  } catch (error) {
    console.error('Sale deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete sale', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Missing sale ID" }, { status: 400 })
    }

    const body: Partial<UpdateSaleInput> = await req.json()

    const sale = await prisma.sales.update({
      where: { id: parseInt(id) },
      data: body,
      include: {
        sale_items: true,
        customers: true,
        warehouses: true
      }
    })

    return NextResponse.json({ success: true, data: sale })
  } catch (error) {
    console.error('Sale partial update error:', error)
    return NextResponse.json(
      { error: 'Failed to update sale', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
