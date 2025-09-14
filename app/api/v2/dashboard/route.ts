import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET() {
  try {
    const [total_customers, total_suppliers, total_employees, total_products, total_sales, total_purchases, total_expenses, todays_sales, todays_purchases, todays_expenses] = await Promise.all([
      prisma.customers.count({ where: { status: "active" } }),
      prisma.suppliers.count({ where: { status: "active" } }),
      prisma.employees.count({ where: { status: "active" } }),
      prisma.products.count({ where: { status: "active" } }),
      prisma.sales.aggregate({ _sum: { total: true }, where: { status: "completed" } }),
      prisma.purchases.aggregate({ _sum: { total: true }, where: { status: "received" } }),
      prisma.expenses.aggregate({ _sum: { amount: true }, where: { status: "approved" } }),
      prisma.sales.count({ where: { created_at: { gte: new Date(new Date().setHours(0,0,0,0)) }, status: "completed" } }),
      prisma.purchases.count({ where: { created_at: { gte: new Date(new Date().setHours(0,0,0,0)) }, status: "received" } }),
      prisma.expenses.count({ where: { created_at: { gte: new Date(new Date().setHours(0,0,0,0)) }, status: "approved" } })
    ])
    return NextResponse.json({
      total_customers,
      total_suppliers,
      total_employees,
      total_products,
      total_sales: total_sales._sum.total || 0,
      total_purchases: total_purchases._sum.total || 0,
      total_expenses: total_expenses._sum.amount || 0,
      todays_sales,
      todays_purchases,
      todays_expenses
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
