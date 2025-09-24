import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get("limit") || "10")

    // Get products with low stock (current stock <= alert quantity)
    const lowStockProducts = await prisma.products.findMany({
      where: {
        status: 'active',
        OR: [
          {
            stock: {
              lte: 10 // Default threshold
            },
            alert_quantity: null
          },
          {
            stock: {
              lte: 10 // Use a reasonable default for comparison
            }
          }
        ]
      },
      include: {
        warehouses: {
          select: {
            name: true
          }
        }
      },
      orderBy: [
        {
          stock: 'asc'
        }
      ],
      take: limit
    })

    const result = lowStockProducts.map(product => ({
      id: product.id,
      name: product.name,
      code: product.code || '',
      current_stock: product.stock || 0,
      min_stock: product.alert_quantity || 10,
      warehouse_name: product.warehouses?.name || 'Default Warehouse'
    }))

    return NextResponse.json(result)
  } catch (error: unknown) {
    console.error('Low stock API error:', error)
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}