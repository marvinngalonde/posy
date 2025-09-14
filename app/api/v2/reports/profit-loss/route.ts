import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const from = searchParams.get('from') || '1970-01-01'
  const to = searchParams.get('to') || new Date().toISOString().split('T')[0]
  const sales = await prisma.sales.aggregate({
    _count: { id: true },
    _sum: { total: true },
    where: { date: { gte: new Date(from), lte: new Date(to) } },
  })
  const purchases = await prisma.purchases.aggregate({
    _count: { id: true },
    _sum: { total: true },
    where: { date: { gte: new Date(from), lte: new Date(to) } },
  })
  const salesReturns = await prisma.sales_returns.aggregate({
    _count: { id: true },
    _sum: { total: true },
    where: { date: { gte: new Date(from), lte: new Date(to) } },
  })
  const purchaseReturns = await prisma.purchase_returns.aggregate({
    _count: { id: true },
    _sum: { total: true },
    where: { date: { gte: new Date(from), lte: new Date(to) } },
  })
  const expenses = await prisma.expenses.aggregate({
    _sum: { amount: true },
    where: { date: { gte: new Date(from), lte: new Date(to) } },
  })
  const salesTotal = sales._sum.total || 0
  const purchasesTotal = purchases._sum.total || 0
  const salesReturnsTotal = salesReturns._sum.total || 0
  const purchaseReturnsTotal = purchaseReturns._sum.total || 0
  const expensesTotal = expenses._sum.amount || 0
  const received = salesTotal - salesReturnsTotal
  const sent = purchasesTotal - purchaseReturnsTotal + expensesTotal
  const profit = salesTotal - purchasesTotal - expensesTotal
  const paymentsNet = received - sent
  return NextResponse.json({
    sales: { count: sales._count.id, total: salesTotal },
    purchases: { count: purchases._count.id, total: purchasesTotal },
    salesReturns: { count: salesReturns._count.id, total: salesReturnsTotal },
    purchaseReturns: { count: purchaseReturns._count.id, total: purchaseReturnsTotal },
    expenses: { total: expensesTotal },
    received,
    sent,
    profit,
    paymentsNet,
  })
}
