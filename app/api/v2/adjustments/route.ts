import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (!body.warehouse_id || !body.date || !body.items || body.items.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }
    const reference = `ADJ-${Date.now().toString().slice(-6)}`
    // Create adjustment and items in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const adjustment = await tx.adjustments.create({
        data: {
          reference,
          warehouse_id: body.warehouse_id,
          date: new Date(body.date),
          type: body.type || 'addition',
          notes: body.notes || null,
          items: {
            create: body.items.map((item) => ({
              product_id: item.product_id,
              quantity: item.quantity,
              type: item.type,
            }))
          }
        }
      })
      // Update product stock for each item
      for (const item of body.items) {
        const stockChange = item.type === "addition" ? item.quantity : -item.quantity
        await tx.products.update({
          where: { id: item.product_id },
          data: { stock: { increment: stockChange } }
        })
      }
      return adjustment
    })
    return NextResponse.json({ success: true, adjustment_id: result.id, reference }, { status: 201 })
  } catch (error) {
    console.error("Error creating adjustment:", error)
    return NextResponse.json({ error: "Failed to create adjustment" }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const warehouse_id = searchParams.get("warehouse_id")
    const date = searchParams.get("date")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const offset = (page - 1) * limit
    const where: any = {}
    if (warehouse_id) where.warehouse_id = Number(warehouse_id)
    if (date) where.date = date
    const [adjustments, total] = await Promise.all([
      prisma.adjustments.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: [{ date: "desc" }, { id: "desc" }],
        include: {
          warehouse: { select: { name: true } },
          items: true,
        },
      }),
      prisma.adjustments.count({ where })
    ])
    const adjList = adjustments.map(a => ({
      ...a,
      warehouse_name: a.warehouse?.name,
      item_count: a.items.length
    }))
    return NextResponse.json({
      data: adjList,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error("Error fetching adjustments:", error)
    return NextResponse.json({ error: "Failed to fetch adjustments" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "Missing adjustment id" }, { status: 400 })
    }
    await prisma.$transaction([
      prisma.adjustment_items.deleteMany({ where: { adjustment_id: id } }),
      prisma.adjustments.delete({ where: { id } })
    ])
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting adjustment:", error)
    return NextResponse.json({ error: "Failed to delete adjustment" }, { status: 500 })
  }
}


