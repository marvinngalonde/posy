import { NextRequest, NextResponse } from "next/server";
import { getConnection } from "@/lib/mysql";
import type { FieldPacket, RowDataPacket } from "mysql2";
import { Invoice, InvoiceItem } from "@/lib/types/invoice";

// READ ONE (GET by id)
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "Missing invoice ID" }, { status: 400 });

  const pool = getConnection();
  let conn: any;

  try {
    conn = await pool.getConnection();
    const [invoices]: [Invoice[], FieldPacket[]] = await conn.query<Invoice[]>(
      `SELECT 
        i.*, 
        c.name AS customer_name, 
        w.name AS warehouse_name
       FROM invoices i
       LEFT JOIN customers c ON i.customer_id = c.id
       LEFT JOIN warehouses w ON i.warehouse_id = w.id
       WHERE i.id = ? 
       LIMIT 1`,
      [id]
    );

    if (invoices.length === 0) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

    return NextResponse.json(invoices[0]);
  } catch (error: unknown) {
    console.error("Error fetching invoice:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    if (conn) conn.release();
  }
}

// UPDATE (PUT)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body: Partial<Invoice> = await req.json();
  const pool = getConnection();
  let conn: any;

  try {
    conn = await pool.getConnection();

    // Validate enum values
    const validStatuses = ['draft', 'pending', 'sent', 'paid', 'overdue', 'cancelled'];
    const validPaymentStatuses = ['unpaid', 'partial', 'paid'];

    const status = body.status && validStatuses.includes(body.status) ? body.status : 'pending';
    const paymentStatus = body.payment_status && validPaymentStatuses.includes(body.payment_status) ? body.payment_status : 'unpaid';

    // Format date to MySQL DATE format (YYYY-MM-DD)
    const formattedDate = body.date ? new Date(body.date).toISOString().split('T')[0] : null;

    await conn.execute(
      `UPDATE invoices SET
        reference=?, date=?, customer_id=?, warehouse_id=?, subtotal=?,
        tax_rate=?, tax_amount=?, discount=?, shipping=?, total=?, paid=?, due=?,
        status=?, payment_status=?, notes=?, updated_at=NOW()
       WHERE id=?`,
      [
        body.reference,
        formattedDate,
        body.customer_id ?? null,
        body.warehouse_id ?? null,
        body.subtotal ?? 0,
        body.tax_rate ?? 0,
        body.tax_amount ?? 0,
        body.discount ?? 0,
        body.shipping ?? 0,
        body.total,
        body.paid ?? 0,
        body.due ?? 0,
        status,
        paymentStatus,
        body.notes ?? null,
        id,
      ]
    );

    // Update invoice items - this is a simplified approach. 
    // A more robust solution might involve deleting existing items and re-inserting, 
    // or individual updates/deletes based on changes.
    if (Array.isArray(body.items)) {
      // For simplicity, delete all existing items and re-insert
      await conn.execute(`DELETE FROM invoice_items WHERE invoice_id = ?`, [id]);
      for (const item of body.items) {
        await conn.execute(
          `INSERT INTO invoice_items (
            invoice_id, product_id, quantity, unit_price, discount, tax, subtotal
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
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
    console.error("Error updating invoice:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    if (conn) conn.release();
  }
}

// DELETE
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "Missing invoice ID" }, { status: 400 });

  const pool = getConnection();
  let conn: any;

  try {
    conn = await pool.getConnection();

    // Delete invoice items first (foreign key constraint)
    await conn.execute(`DELETE FROM invoice_items WHERE invoice_id = ?`, [id]);

    // Then delete the invoice
    const [deleteResult]: [RowDataPacket[], FieldPacket[]] = await conn.execute(`DELETE FROM invoices WHERE id = ?`, [id]);

    if (deleteResult.affectedRows === 0) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Error deleting invoice:", error);
    const message = error instanceof Error ? error.message : "Unknown error occurred during invoice deletion";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    if (conn) conn.release();
  }
}
