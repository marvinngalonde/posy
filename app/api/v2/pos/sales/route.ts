import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { v4 as uuidv4 } from "uuid"

const prisma = new PrismaClient()

// Strict types
export type SaleItemInput = {
  product_id: string;
  quantity: number;
  unit_price: number;
  discount: number;
  tax: number;
}
export type SaleInput = {
  reference?: string;
  customer_id?: string;
  warehouse_id?: string;
  date: string;
  subtotal?: number;
  tax_rate?: number;
  tax_amount?: number;
  discount?: number;
  shipping?: number;
  total: number;
  paid?: number;
  due?: number;
  status?: string;
  payment_status?: string;
  notes?: string;
  created_by?: string;
  items: SaleItemInput[];
}

export async function POST(req: NextRequest) {
  const body: SaleInput = await req.json()
  const sale = await prisma.sales.create({
    data: {
      reference: body.reference || `SL-${Date.now()}`,
      customer_id: body.customer_id,
      warehouse_id: body.warehouse_id,
      date: new Date(body.date),
      subtotal: body.subtotal ?? 0,
      tax_rate: body.tax_rate ?? 0,
      tax_amount: body.tax_amount ?? 0,
      discount: body.discount ?? 0,
      shipping: body.shipping ?? 0,
      total: body.total,
      paid: body.paid ?? 0,
      due: body.due ?? 0,
      status: body.status || "completed",
      payment_status: body.payment_status || "paid",
      notes: body.notes ?? null,
      created_by: body.created_by ?? null,
      items: {
        create: body.items.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount: item.discount,
          tax: item.tax,
          subtotal: (item.unit_price * item.quantity) - item.discount + item.tax,
        }))
      }
    }
  })
  return NextResponse.json({ success: true, saleId: sale.id, reference: sale.reference })
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  const page = parseInt(searchParams.get("page") || "1")
  const limit = parseInt(searchParams.get("limit") || "10")
  const search = searchParams.get("search") || ""
  const offset = (page - 1) * limit
  if (id) {
    const sale = await prisma.sales.findUnique({
      where: { id },
      include: {
        customer: { select: { name: true } },
        warehouse: { select: { name: true } },
        items: true,
      },
    })
    if (!sale) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(sale)
  }
  const where = search
    ? {
        OR: [
          { reference: { contains: search } },
          { customer: { name: { contains: search } } },
        ],
      }
    : {}
  const [sales, total] = await Promise.all([
    prisma.sales.findMany({
      where,
      skip: offset,
      take: limit,
      include: {
        customer: { select: { name: true } },
        warehouse: { select: { name: true } },
      },
      orderBy: { created_at: "desc" },
    }),
    prisma.sales.count({ where }),
  ])
  return NextResponse.json({
    data: sales,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  })
}

export async function PUT(req: NextRequest) {
  const body: SaleInput = await req.json()
  if (!body.reference) return NextResponse.json({ error: "Missing reference" }, { status: 400 })
  const sale = await prisma.sales.update({
    where: { reference: body.reference },
    data: {
      customer_id: body.customer_id,
      warehouse_id: body.warehouse_id,
      date: new Date(body.date),
      subtotal: body.subtotal ?? 0,
      tax_rate: body.tax_rate ?? 0,
      tax_amount: body.tax_amount ?? 0,
      discount: body.discount ?? 0,
      shipping: body.shipping ?? 0,
      total: body.total,
      paid: body.paid ?? 0,
      due: body.due ?? 0,
      status: body.status,
      payment_status: body.payment_status,
      notes: body.notes ?? null,
      created_by: body.created_by ?? null,
    },
  })
  return NextResponse.json({ success: true, sale })
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })
  await prisma.sale_items.deleteMany({ where: { sale_id: id } })
  await prisma.sales.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
