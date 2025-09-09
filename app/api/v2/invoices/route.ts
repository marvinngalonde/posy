import { NextRequest, NextResponse } from "next/server";
import { getConnection } from "@/lib/mysql";
import { v4 as uuidv4 } from "uuid";
import type { FieldPacket, RowDataPacket } from "mysql2";
import { Invoice, InvoiceItem } from "@/lib/types/invoice";

// READ ALL (GET)
export async function GET(req: NextRequest) {
  const pool = getConnection();
  let conn: any;

  try {
    conn = await pool.getConnection();
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        i.*, 
        c.name AS customer_name, 
        w.name AS warehouse_name
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id
      LEFT JOIN warehouses w ON i.warehouse_id = w.id
    `;
    let countQuery = `
      SELECT COUNT(*) as total 
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id
    `;
    const params: (string | number)[] = [];
    const countParams: (string | number)[] = [];

    if (search) {
      query += ` WHERE i.reference LIKE ? OR c.name LIKE ?`;
      countQuery += ` WHERE i.reference LIKE ? OR c.name LIKE ?`;
      params.push(`%${search}%`, `%${search}%`);
      countParams.push(`%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY i.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const [invoices]: [Invoice[], FieldPacket[]] = await conn.query<Invoice[]>(query, params);
    const [totalRows]: [RowDataPacket[], FieldPacket[]] = await conn.query(countQuery, countParams);

    return NextResponse.json({
      data: invoices,
      pagination: {
        totalItems: totalRows[0].total,
        totalPages: Math.ceil(totalRows[0].total / limit),
        currentPage: page,
        itemsPerPage: limit,
      },
    });
  } catch (error: unknown) {
    console.error("Error fetching invoices:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    if (conn) conn.release();
  }
}

// CREATE (POST)
export async function POST(req: NextRequest) {
  const body: Invoice = await req.json();
  const pool = getConnection();
  let conn: any;

  try {
    conn = await pool.getConnection();
    const invoiceId = uuidv4();
    const reference = body.reference || `INV-${Date.now()}`;

    await conn.execute(
      `INSERT INTO invoices (
        id, reference, date, customer_id, warehouse_id, subtotal, 
        tax_rate, tax_amount, discount, shipping, total, paid, due, 
        status, payment_status, notes, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        invoiceId,
        reference,
        body.date,
        body.customer_id || null,
        body.warehouse_id || null,
        body.subtotal ?? 0,
        body.tax_rate ?? 0,
        body.tax_amount ?? 0,
        body.discount ?? 0,
        body.shipping ?? 0,
        body.total,
        body.paid ?? 0,
        body.due ?? 0,
        body.status || "pending",
        body.payment_status || "unpaid",
        body.notes ?? null,
        body.created_by ?? null,
      ]
    );

    // Insert invoice items
    if (Array.isArray(body.items)) {
      for (const item of body.items) {
        await conn.execute(
          `INSERT INTO invoice_items (
            id, invoice_id, product_id, quantity, unit_price, discount, tax, subtotal
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            uuidv4(),
            invoiceId,
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

    return NextResponse.json({ success: true, invoiceId, reference });
  } catch (error: unknown) {
    console.error("Error creating invoice:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    if (conn) conn.release();
  }
}
