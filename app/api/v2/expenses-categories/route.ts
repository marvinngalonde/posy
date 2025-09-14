import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET() {
  const categories = await prisma.expense_categories.findMany()
  return NextResponse.json(categories)
}

export async function POST(req: NextRequest) {
  const body: { name: string; description?: string } = await req.json()
  await prisma.expense_categories.create({
    data: {
      name: body.name,
      description: body.description || null,
      status: "active",
    },
  })
  return NextResponse.json({ success: true })
}
