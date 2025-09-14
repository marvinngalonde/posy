import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const from = searchParams.get('from') || '1970-01-01'
  const to = searchParams.get('to') || new Date().toISOString().split('T')[0]
  const page = parseInt(searchParams.get('page') || '1', 10)
  const limit = parseInt(searchParams.get('limit') || '10', 10)
  const searchTerm = searchParams.get('search') || ''
  const offset = (page - 1) * limit
  const where = {
    paid: { gt: 0 },
    date: { gte: new Date(from), lte: new Date(to) },
    OR: [
      { reference: { contains: searchTerm } },
      { customer: { name: { contains: searchTerm } } },
    ],
  }
  const [rows, total] = await Promise.all([
    prisma.sales.findMany({
      where,
      skip: offset,
      take: limit,
      orderBy: { date: 'desc' },
      include: { customer: { select: { name: true } } },
    }),
    prisma.sales.count({ where }),
  ])
  const data = rows.map(row => ({
    ...row,
    reference: `PAY-${row.reference}`,
    customer_name: row.customer?.name,
  }))
  return NextResponse.json({
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  })
}
