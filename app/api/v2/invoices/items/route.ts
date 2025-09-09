import { NextRequest, NextResponse } from "next/server";
import { getConnection } from "@/lib/mysql";
import type { FieldPacket } from "mysql2";
import { InvoiceItem } from "@/lib/types/invoice";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const invoiceId = searchParams.get('id') || searchParams.get('invoice_id');

  if (!invoiceId) {
    return NextResponse.json({ error: "Invoice ID is required" }, { status: 400 });
  }

  const pool = getConnection();
  let conn: any;

  try {
    conn = await pool.getConnection();
    const [items]: [InvoiceItem[], FieldPacket[]] = await conn.query<InvoiceItem[]>(
      `SELECT 
        ii.id,
        ii.invoice_id,
        ii.product_id,
        p.name as name,
        p.code as code,
        ii.quantity,
        ii.unit_price,
        ii.discount,
        ii.tax,
        ii.subtotal
       FROM invoice_items ii
       JOIN products p ON ii.product_id = p.id
       WHERE ii.invoice_id = ?`,
      [invoiceId]
    );

    return NextResponse.json(items);
  } catch (error: unknown) {
    console.error("Error fetching invoice items:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    if (conn) conn.release();
  }
}
