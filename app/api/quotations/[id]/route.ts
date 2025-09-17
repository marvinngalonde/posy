import { NextRequest, NextResponse } from "next/server";
import { getConnection } from "@/lib/mysql";
import type { FieldPacket, RowDataPacket } from "mysql2";
import { Quotation, QuotationItem } from "@/lib/types/quotation";
import { v4 as uuidv4 } from "uuid";

// READ ONE (GET by id)
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "Missing quotation ID" }, { status: 400 });

  const pool = getConnection();
  let conn: any;

  try {
    conn = await pool.getConnection();
    const [quotations]: [Quotation[], FieldPacket[]] = await conn.query<Quotation[]>(
      `SELECT 
        q.*, 
        c.name AS customer_name, 
        w.name AS warehouse_name
       FROM quotations q
       LEFT JOIN customers c ON q.customer_id = c.id
       LEFT JOIN warehouses w ON q.warehouse_id = w.id
       WHERE q.id = ? 
       LIMIT 1`,
      [id]
    );

    if (quotations.length === 0) return NextResponse.json({ error: "Quotation not found" }, { status: 404 });

    return NextResponse.json(quotations[0]);
  } catch (error: unknown) {
    console.error("Error fetching quotation:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    if (conn) conn.release();
  }
}

// UPDATE (PUT)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body: Partial<Quotation> = await req.json();
  const pool = getConnection();
  let conn: any;

  try {
    conn = await pool.getConnection();
    await conn.execute(
      `UPDATE quotations SET 
        reference=?, date=?, valid_until=?, customer_id=?, warehouse_id=?, subtotal=?, 
        tax_rate=?, tax_amount=?, discount=?, shipping=?, total=?, 
        status=?, notes=?, updated_at=NOW()
       WHERE id=?`,
      [
        body.reference,
        body.date,
        body.valid_until ?? null,
        body.customer_id ?? null,
        body.warehouse_id ?? null,
        body.subtotal ?? 0,
        body.tax_rate ?? 0,
        body.tax_amount ?? 0,
        body.discount ?? 0,
        body.shipping ?? 0,
        body.total,
        body.status,
        body.notes ?? null,
        id,
      ]
    );

    // Update quotation items - this is a simplified approach. 
    // A more robust solution might involve deleting existing items and re-inserting, 
    // or individual updates/deletes based on changes.
    if (Array.isArray(body.items)) {
      // For simplicity, delete all existing items and re-insert
      await conn.execute(`DELETE FROM quotation_items WHERE quotation_id = ?`, [id]);
      for (const item of body.items) {
        await conn.execute(
          `INSERT INTO quotation_items (
            id, quotation_id, product_id, quantity, unit_price, discount, tax, subtotal
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            uuidv4(),
            id,
            item.product_id,
            item.quantity ?? 0,
            item.unit_price ?? 0,
            item.discount ?? 0,
            item.tax ?? 0,
            (item.quantity ?? 0) * (item.unit_price ?? 0) - (item.discount ?? 0) + (item.tax ?? 0),
          ]
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Error updating quotation:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    if (conn) conn.release();
  }
}

// DELETE
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "Missing quotation ID" }, { status: 400 });

  const pool = getConnection();
  let conn: any;

  try {
    conn = await pool.getConnection();

    // Delete quotation items first (foreign key constraint)
    await conn.execute(`DELETE FROM quotation_items WHERE quotation_id = ?`, [id]);

    // Then delete the quotation
    const [deleteResult]: [RowDataPacket[], FieldPacket[]] = await conn.execute(`DELETE FROM quotations WHERE id = ?`, [id]);

    if (deleteResult.affectedRows === 0) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Error deleting quotation:", error);
    const message = error instanceof Error ? error.message : "Unknown error occurred during quotation deletion";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    if (conn) conn.release();
  }
}
