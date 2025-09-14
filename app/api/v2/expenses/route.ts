import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get("page") || "1")
  const limit = parseInt(searchParams.get("limit") || "10")
  const search = searchParams.get("search") || ""
  const offset = (page - 1) * limit
  const where = search
    ? {
        OR: [
          { reference: { contains: search } },
          { category: { name: { contains: search } } },
        ],
      }
    : {}
  const [expenses, total] = await Promise.all([
    prisma.expenses.findMany({
      where,
      skip: offset,
      take: limit,
      include: { category: { select: { name: true } } },
    }),
    prisma.expenses.count({ where }),
  ])
  return NextResponse.json({
    data: expenses,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  })
}
