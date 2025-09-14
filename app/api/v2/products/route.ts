import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  const page = parseInt(searchParams.get("page") || "1")
  const limit = parseInt(searchParams.get("limit") || "10")
  const search = searchParams.get("search") || ""
  const offset = (page - 1) * limit
  if (id) {
    const product = await prisma.products.findUnique({
      where: { id: Number(id) },
      include: {
        category: { select: { name: true } },
        brand: { select: { name: true } },
        unit: { select: { name: true } },
        warehouse: { select: { name: true } },
      },
    })
    return NextResponse.json(product)
  }
  const where = search
    ? {
        OR: [
          { name: { contains: search } },
          { code: { contains: search } },
        ],
      }
    : {}
  const [products, total] = await Promise.all([
    prisma.products.findMany({
      where,
      skip: offset,
      take: limit,
      include: {
        category: { select: { name: true } },
        brand: { select: { name: true } },
        unit: { select: { name: true } },
        warehouse: { select: { name: true } },
      },
    }),
    prisma.products.count({ where }),
  ])
  return NextResponse.json({
    data: products,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  })
}
