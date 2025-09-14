import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET() {
  const brands = await prisma.brands.findMany()
  return NextResponse.json(brands)
}

export async function POST(req: NextRequest) {
  const body: { name: string; description?: string } = await req.json()
  if (!body.name) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }
  const brand = await prisma.brands.create({
    data: {
      name: body.name,
      description: body.description || "",
    },
  })
  return NextResponse.json(brand)
}

export async function PUT(req: NextRequest) {
  const body: { id: string; name: string; description?: string } = await req.json()
  if (!body.id) return NextResponse.json({ error: "Missing id" }, { status: 400 })
  const brand = await prisma.brands.update({
    where: { id: body.id },
    data: {
      name: body.name,
      description: body.description || "",
    },
  })
  return NextResponse.json(brand)
}
