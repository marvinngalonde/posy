import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get("limit") || "10")

    // Get recent sales, purchases, and expenses
    const [recentSales, recentPurchases, recentExpenses] = await Promise.all([
      prisma.sales.findMany({
        orderBy: { created_at: 'desc' },
        take: Math.ceil(limit / 3),
        select: {
          id: true,
          reference: true,
          total: true,
          date: true,
          status: true,
          created_at: true
        }
      }),
      prisma.purchases.findMany({
        orderBy: { created_at: 'desc' },
        take: Math.ceil(limit / 3),
        select: {
          id: true,
          reference: true,
          total: true,
          date: true,
          status: true,
          created_at: true
        }
      }),
      prisma.expenses.findMany({
        orderBy: { created_at: 'desc' },
        take: Math.ceil(limit / 3),
        select: {
          id: true,
          reference: true,
          amount: true,
          date: true,
          status: true,
          description: true,
          created_at: true
        }
      })
    ])

    // Combine and format transactions
    const transactions = [
      ...recentSales.map(sale => ({
        id: sale.id,
        type: 'sale' as const,
        reference: sale.reference,
        amount: sale.total || 0,
        date: sale.date.toISOString(),
        status: sale.status,
        created_at: sale.created_at
      })),
      ...recentPurchases.map(purchase => ({
        id: purchase.id,
        type: 'purchase' as const,
        reference: purchase.reference,
        amount: purchase.total || 0,
        date: purchase.date.toISOString(),
        status: purchase.status,
        created_at: purchase.created_at
      })),
      ...recentExpenses.map(expense => ({
        id: expense.id,
        type: 'expense' as const,
        reference: expense.reference || `EXP-${expense.id}`,
        amount: expense.amount || 0,
        date: expense.date.toISOString(),
        status: expense.status,
        description: expense.description,
        created_at: expense.created_at
      }))
    ]

    // Sort by created_at and limit
    const sortedTransactions = transactions
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit)
      .map(({ created_at, ...transaction }) => transaction) // Remove created_at from response

    return NextResponse.json(sortedTransactions)
  } catch (error: unknown) {
    console.error('Recent transactions API error:', error)
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}