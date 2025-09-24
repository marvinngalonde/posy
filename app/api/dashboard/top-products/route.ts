import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const period = searchParams.get("period") || "30" // days
    const limit = parseInt(searchParams.get("limit") || "10")

    const daysAgo = new Date()
    daysAgo.setDate(daysAgo.getDate() - parseInt(period))

    // Get top selling products based on sale items
    const topProducts = await prisma.sale_items.groupBy({
      by: ['product_id'],
      where: {
        sales: {
          status: 'completed',
          date: {
            gte: daysAgo
          }
        }
      },
      _sum: {
        quantity: true,
        subtotal: true
      },
      orderBy: {
        _sum: {
          subtotal: 'desc'
        }
      },
      take: limit
    })

    // Get product details
    const productIds = topProducts.map(item => item.product_id)
    const products = await prisma.products.findMany({
      where: {
        id: { in: productIds }
      },
      select: {
        id: true,
        name: true,
        code: true
      }
    })

    // Combine data
    const result = topProducts.map(item => {
      const product = products.find(p => p.id === item.product_id)
      return {
        id: item.product_id,
        name: product?.name || 'Unknown Product',
        code: product?.code || '',
        units_sold: item._sum.quantity || 0,
        revenue: item._sum.subtotal || 0
      }
    })

    return NextResponse.json(result)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}