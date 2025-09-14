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
          { name: { contains: search } },
          { email: { contains: search } },
          { phone: { contains: search } },
        ],
      }
    : {}
  const [suppliers, total] = await Promise.all([
    prisma.suppliers.findMany({
      where,
      skip: offset,
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        country: true,
        city: true,
        address: true,
      },
      orderBy: { name: "asc" },
    }),
    prisma.suppliers.count({ where }),
  ])
  return NextResponse.json({
    data: suppliers,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  })
}
