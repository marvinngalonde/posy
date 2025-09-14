import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  const page = parseInt(searchParams.get("page") || "1")
  const limit = parseInt(searchParams.get("limit") || "10")
  const search = searchParams.get("search") || ""
  const offset = (page - 1) * limit
  if (id) {
    const purchase = await prisma.purchases.findUnique({
      where: { id },
      include: {
        supplier: { select: { name: true } },
        warehouse: { select: { name: true } },
        items: true,
      },
    })
    return NextResponse.json(purchase)
  }
  const where = search
    ? {
        OR: [
          { reference: { contains: search } },
          { supplier: { name: { contains: search } } },
        ],
      }
    : {}
  const [purchases, total] = await Promise.all([
    prisma.purchases.findMany({
      where,
      skip: offset,
      take: limit,
      include: {
        supplier: { select: { name: true } },
        warehouse: { select: { name: true } },
      },
    }),
    prisma.purchases.count({ where }),
  ])
  return NextResponse.json({
    data: purchases,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  })
}
