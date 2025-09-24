import { NextResponse } from "next/server"
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    // Get basic counts and totals
    const [
      totalCustomers,
      totalSuppliers,
      totalEmployees,
      totalProducts,
      totalSales,
      totalPurchases,
      totalExpenses,
      todaysSales,
      todaysPurchases,
      todaysExpenses,
    ] = await Promise.all([
      prisma.customers.count({ where: { status: 'active' } }),
      prisma.suppliers.count({ where: { status: 'active' } }),
      prisma.employees.count({ where: { status: 'active' } }),
      prisma.products.count({ where: { status: 'active' } }),

      prisma.sales.aggregate({
        where: { status: 'completed' },
        _sum: { total: true }
      }),
      prisma.purchases.aggregate({
        where: { status: 'received' },
        _sum: { total: true }
      }),
      prisma.expenses.aggregate({
        where: { status: 'approved' },
        _sum: { amount: true }
      }),

      prisma.sales.count({
        where: {
          created_at: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),
      prisma.purchases.count({
        where: {
          created_at: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),
      prisma.expenses.count({
        where: {
          created_at: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),
    ])

    const stats = {
      total_customers: totalCustomers,
      total_suppliers: totalSuppliers,
      total_employees: totalEmployees,
      total_products: totalProducts,
      total_sales: totalSales._sum.total || 0,
      total_purchases: totalPurchases._sum.total || 0,
      total_expenses: totalExpenses._sum.amount || 0,
      todays_sales: todaysSales,
      todays_purchases: todaysPurchases,
      todays_expenses: todaysExpenses,
    }

    return NextResponse.json(stats)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}