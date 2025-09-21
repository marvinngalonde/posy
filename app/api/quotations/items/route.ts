import { NextRequest, NextResponse } from "next/server"
import { getConnection } from "@/lib/mysql"
import { RowDataPacket } from "mysql2/promise"

interface QuotationItemWithProduct extends RowDataPacket {
  id: string
  product_id: string
  product_name: string
  product_code: string
  quantity: number
  price: number
  discount: number
  tax: number
  subtotal: number
  stock: number
  unit_name: string
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  let conn: any
  try {
    const { searchParams } = new URL(req.url)
    const idParam = searchParams.get('id') || searchParams.get('quotation_id')
    if (!idParam) {
      return NextResponse.json({ error: "Quotation ID is required" }, { status: 400 })
    }

    conn = await getConnection()
    const [items] = await conn.execute<QuotationItemWithProduct[]>(
      `SELECT 
        qi.id,
        qi.product_id,
        p.name AS product_name,
        p.code AS product_code,
        qi.quantity,
        qi.unit_price AS price,
        qi.discount,
        qi.tax,
        qi.subtotal,
        p.stock,
        u.name AS unit_name
       FROM quotation_items qi
       LEFT JOIN products p ON qi.product_id = p.id
       LEFT JOIN units u ON p.unit_id = u.id
       WHERE qi.quotation_id = ?
       ORDER BY qi.id`,
      [idParam]
    )

    return NextResponse.json({
      success: true,
      data: items
    })
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error('Unknown error')
    return NextResponse.json({ error: err.message }, { status: 500 })
  } finally {
    try { conn?.release?.() } catch {}
  }
}