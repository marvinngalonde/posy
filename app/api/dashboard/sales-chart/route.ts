import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const days = parseInt(searchParams.get("days") || "30")

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get daily sales and purchases data
    const salesData = await prisma.sales.findMany({
      where: {
        date: {
          gte: startDate
        },
        status: 'completed'
      },
      select: {
        date: true,
        total: true
      }
    })

    const purchasesData = await prisma.purchases.findMany({
      where: {
        date: {
          gte: startDate
        },
        status: 'received'
      },
      select: {
        date: true,
        total: true
      }
    })

    // Group by date
    const chartData: { [key: string]: { sales: number, purchases: number } } = {}

    // Initialize all dates with 0
    for (let i = 0; i < days; i++) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      chartData[dateStr] = { sales: 0, purchases: 0 }
    }

    // Aggregate sales
    salesData.forEach(sale => {
      const dateStr = sale.date.toISOString().split('T')[0]
      if (chartData[dateStr]) {
        chartData[dateStr].sales += Number(sale.total) || 0
      }
    })

    // Aggregate purchases
    purchasesData.forEach(purchase => {
      const dateStr = purchase.date.toISOString().split('T')[0]
      if (chartData[dateStr]) {
        chartData[dateStr].purchases += Number(purchase.total) || 0
      }
    })

    // Convert to array and sort by date
    const result = Object.entries(chartData)
      .map(([date, data]) => ({
        date,
        sales: data.sales,
        purchases: data.purchases
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    return NextResponse.json(result)
  } catch (error: unknown) {
    console.error('Sales chart API error:', error)
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}