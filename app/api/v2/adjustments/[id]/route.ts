import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

type AdjustmentItemInput = {
  product_id: string;
  quantity: number;
  type: "addition" | "subtraction";
};

type AdjustmentUpdateInput = {
  warehouse_id: string;
  date: string;
  type: "addition" | "subtraction";
  notes?: string;
  items: AdjustmentItemInput[];
};

type RouteContext = { params: { id: string } };
const prisma = new PrismaClient()

export async function GET(
  req: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = context.params
    const adjustment = await prisma.adjustments.findUnique({
      where: { id },
      include: {
        warehouse: { select: { name: true } },
        items: {
          include: {
            product: {
              select: {
                code: true,
                name: true,
                unit: { select: { name: true } }
              }
            }
          }
        }
      }
    })
    if (!adjustment) {
      return NextResponse.json({ error: "Adjustment not found" }, { status: 404 })
    }
    return NextResponse.json({
      ...adjustment,
      warehouse_name: adjustment.warehouse?.name,
      item_count: adjustment.items.length,
      items: adjustment.items.map(item => ({
        ...item,
        product_code: item.product.code,
        product_name: item.product.name,
        unit_name: item.product.unit?.name
      }))
    })
  } catch (error) {
    console.error("[v2] Error fetching adjustment:", error)
    return NextResponse.json({ error: "Failed to fetch adjustment" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, context: any) {
  try {
    const { id } = context.params
    const body: AdjustmentUpdateInput = await req.json()
    await prisma.$transaction(async (tx) => {
      // Load existing items to revert stock
      const existingItems = await tx.adjustment_items.findMany({
        where: { adjustment_id: id }
      })
      // Revert stock changes from existing items
      for (const item of existingItems) {
        const revertChange = item.type === 'addition' ? -Number(item.quantity) : Number(item.quantity)
        await tx.products.update({
          where: { id: item.product_id },
          data: { stock: { increment: revertChange } }
        })
      }
      // Delete existing items
      await tx.adjustment_items.deleteMany({ where: { adjustment_id: id } })
      // Update header
      await tx.adjustments.update({
        where: { id },
        data: {
          warehouse_id: body.warehouse_id,
          date: new Date(body.date),
          type: body.type || 'addition',
          notes: body.notes || null
        }
      })
      // Apply new items and update stock
      for (const item of body.items || []) {
        const stockChange = item.type === 'addition' ? Number(item.quantity) : -Number(item.quantity)
        await tx.products.update({
          where: { id: item.product_id },
          data: { stock: { increment: stockChange } }
        })
        await tx.adjustment_items.create({
          data: {
            adjustment_id: id,
            product_id: item.product_id,
            quantity: item.quantity,
            type: item.type
          }
        })
      }
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v2] Error updating adjustment:", error)
    return NextResponse.json({ error: "Failed to update adjustment" }, { status: 500 })
  }
}


