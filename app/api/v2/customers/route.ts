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

  const [customers, total] = await Promise.all([
    prisma.customers.findMany({
      where,
      skip: offset,
      take: limit,
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        country: true,
        total_sales: true,
        total_paid: true,
        total_due: true,
      },
    }),
    prisma.customers.count({ where }),
  ])

  return NextResponse.json({
    data: customers,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { name, email, phone, country, city, address } = body

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 })
  }

  const newCustomer = await prisma.customers.create({
    data: {
      name,
      email,
      phone,
      country,
      city,
      address,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      address: true,
      city: true,
      country: true,
      total_sales: true,
      total_paid: true,
      total_due: true,
    },
  })

  return NextResponse.json(newCustomer, { status: 201 })
}

export async function PUT(request: NextRequest) {
  const body = await request.json()
  const { id, name, email, phone, country, city, address } = body

  if (!id || !name) {
    return NextResponse.json({ error: "ID and name are required" }, { status: 400 })
  }

  const updatedCustomer = await prisma.customers.update({
    where: { id },
    data: {
      name,
      email,
      phone,
      country,
      city,
      address,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      address: true,
      city: true,
      country: true,
      total_sales: true,
      total_paid: true,
      total_due: true,
    },
  })

  return NextResponse.json(updatedCustomer)
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")

  if (!id) {
    return NextResponse.json({ error: "Customer ID is required" }, { status: 400 })
  }

  const existingCustomer = await prisma.customers.findUnique({ where: { id: Number(id) } })

  if (!existingCustomer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 })
  }

  await prisma.customers.delete({ where: { id: Number(id) } })

  return NextResponse.json({ message: "Customer deleted successfully" })
}
