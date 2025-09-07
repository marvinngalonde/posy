import { NextRequest, NextResponse } from "next/server"
import { getConnection } from "@/lib/mysql"
import { v4 as uuidv4 } from "uuid"
import { Sale, SaleItem } from "@/lib/types/sales"
import type { FieldPacket} from "mysql2"

// CREATE (POST)
export async function POST(req: NextRequest) {
  const body = await req.json()
  const pool = getConnection()
  let conn: any
  try {
    conn = await pool.getConnection()
    const saleId = uuidv4()
    const reference = body.reference || `SL-${Date.now()}`
    await conn.execute(
      `INSERT INTO sales 
        (id, reference, customer_id, warehouse_id, date, subtotal, tax_rate, tax_amount, discount, shipping, total, paid, due, status, payment_status, notes, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        saleId,
        reference,
        body.customer_id || null,
        body.warehouse_id || null,
        body.date,
        body.subtotal ?? 0,
        body.tax_rate ?? 0,
        body.tax_amount ?? 0,
        body.discount ?? 0,
        body.shipping ?? 0,
        body.total,
        body.paid ?? 0,
        body.due ?? 0,
        body.status || "completed",
        body.payment_status || "paid",
        body.notes ?? null,
        body.created_by ?? null,
      ]
    )
    // Insert sale items
    if (Array.isArray(body.items)) {
      for (const item of body.items) {
        // Ensure product_id exists and is valid
        if (!item.product_id) {
          console.error('Missing product_id for item:', item);
          return NextResponse.json({ error: "Invalid product data" }, { status: 400 });
        }
        
        await conn.execute(
          `INSERT INTO sale_items (id, sale_id, product_id, quantity, unit_price, discount, tax, subtotal)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            uuidv4(),
            saleId,
            item.product_id,
            item.quantity ?? 0,
            item.unit_price ?? 0,
            item.discount ?? 0,
            item.tax ?? 0,
            ((item.unit_price ?? 0) * (item.quantity ?? 0)) - (item.discount ?? 0) + (item.tax ?? 0)
          ]
        )
      }
    }
    
    return NextResponse.json({ success: true, saleId, reference })
  } catch (error: unknown) {
    console.error(error)
    
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  } finally {
    if (conn) conn.release()
  }
}


// READ ONE (GET by id)
export async function GET_ONE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  const pool = getConnection() // Assuming getConnection returns a Promise<Pool>
  let conn: any // Explicitly type conn to allow null/undefined before assignment
  try {
    conn = await pool.getConnection()
    // Ensure the Sale type is compatible with the database result structure
    const [sales]: [Sale[], FieldPacket[]] = await conn.query<Sale[]>(
        `SELECT 
        s.*, 
        c.name AS customer_name, 
        w.name AS warehouse_name
       FROM sales s
       LEFT JOIN customers c ON s.customer_id = c.id
       LEFT JOIN warehouses w ON s.warehouse_id = w.id
       WHERE s.id = ? 
       LIMIT 1`,
        [id]
      )
    
    if (sales.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(sales[0])
  } catch (error: unknown) {
    
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  } finally {
    if (conn) conn.release()
  }
}

// READ ALL (GET)
export async function GET(req: NextRequest) {
  const pool = getConnection() // Assuming getConnection returns a Promise<Pool>
  let conn: any // Explicitly type conn to allow null/undefined before assignment
  try {
    conn = await pool.getConnection()
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search") || ""
    const offset = (page - 1) * limit

    const searchQuery = `WHERE s.reference LIKE ? OR c.name LIKE ?`
    // Ensure the Sale type is compatible with the database result structure
    const [sales]: [Sale[], FieldPacket[]] = await conn.query<Sale[]>(
      `SELECT 
        s.*, 
        c.name AS customer_name, 
        w.name AS warehouse_name
       FROM sales s
       LEFT JOIN customers c ON s.customer_id = c.id
       LEFT JOIN warehouses w ON s.warehouse_id = w.id
       ${search ? searchQuery : ''}
       ORDER BY s.created_at DESC
       LIMIT ? OFFSET ?`,
      search ? [`%${search}%`, `%${search}%`, limit, offset] : [limit, offset]
    )

    const [totalRows]: [RowDataPacket[], FieldPacket[]] = await conn.query(
        `SELECT COUNT(*) as total FROM sales s LEFT JOIN customers c ON s.customer_id = c.id ${search ? searchQuery : ''}`,
        search ? [`%${search}%`, `%${search}%`] : []
    );
    
    return NextResponse.json({
        data: sales,
        pagination: {
            total: totalRows[0].total,
            page,
            limit,
            totalPages: Math.ceil(totalRows[0].total / limit),
        },
    });
  } catch (error: unknown) {
    
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  } finally {
    if (conn) conn.release()
  }
}


// UPDATE (PUT)
export async function PUT(req: NextRequest) {
  const body = await req.json()
  if (!body.id) return NextResponse.json({ error: "Missing id" }, { status: 400 })
  const pool = getConnection()
  let conn: any
  try {
    conn = await pool.getConnection()
    await conn.execute(
      `UPDATE sales SET 
        reference=?, customer_id=?, warehouse_id=?, date=?, subtotal=?, tax_rate=?, tax_amount=?, discount=?, shipping=?, total=?, paid=?, due=?, status=?, payment_status=?, notes=?, updated_at=NOW()
       WHERE id=?`,
      [
        body.reference,
        body.customer_id ?? null,
        body.warehouse_id ?? null,
        body.date,
        body.subtotal ?? 0,
        body.tax_rate ?? 0,
        body.tax_amount ?? 0,
        body.discount ?? 0,
        body.shipping ?? 0,
        body.total,
        body.paid ?? 0,
        body.due ?? 0,
        body.status,
        body.payment_status,
        body.notes ?? null,
        body.id
      ]
    )
    
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  } finally {
    if (conn) conn.release()
  }
}

// DELETE
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })
  
  const pool = getConnection()
  let conn: any
  try {
    conn = await pool.getConnection()
    // Check if sale exists first
    const [sale] = await conn.execute(
      'SELECT id FROM sales WHERE id = ?',
      [id]
    )
    
    if (!sale || (sale as any[]).length === 0) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 })
    }
    
    // Delete sale items first (foreign key constraint)
    await conn.execute(`DELETE FROM sale_items WHERE sale_id = ?`, [id])
    
    // Then delete the sale
    const [deleteResult] = await conn.execute(`DELETE FROM sales WHERE id = ?`, [id])
    
    // Check if the delete was successful
    if ((deleteResult as any).affectedRows === 0) {
      return NextResponse.json({ error: "Failed to delete sale" }, { status: 500 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error("Error deleting sale:", error)
    const message = error instanceof Error ? error.message : "Unknown error occurred during sale deletion"
    return NextResponse.json({ error: message }, { status: 500 })
  } finally {
    if (conn) conn.release()
  }
}