import { NextRequest, NextResponse } from "next/server"
import { getConnection } from "@/lib/mysql"
import { ResultSetHeader, RowDataPacket, FieldPacket } from "mysql2/promise"

interface QuotationItem {
  id: string
  itemid: string
  price: number
  quantity: number
  discount: number
  tax: number
  subtotal: number
}

interface QuotationRequest {
  reference: string
  date: string
  valid_until?: string
  customer_id: string
  warehouse_id: string
  subtotal: number
  tax_rate: number
  tax_amount: number
  discount: number
  shipping: number
  total: number
  status?: string
  notes?: string
  user_id: string
  items: QuotationItem[]
}

interface Quotation extends RowDataPacket {
  id: string
  reference: string
  date: string
  valid_until: string | null
  customer_id: string
  warehouse_id: string
  subtotal: number
  tax_rate: number
  tax_amount: number
  discount: number
  shipping: number
  total: number
  status: string
  notes: string | null
  created_by: string
  created_at: string
  updated_at: string
  customer_name?: string
  warehouse_name?: string
  created_by_name?: string
}

interface QuotationItemWithProduct extends RowDataPacket {
  id: string
  quotation_id: string
  product_id: string
  quantity: number
  unit_price: number
  discount: number
  tax: number
  subtotal: number
  product_name?: string
  product_code?: string
}


export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = await req.json();
  const pool = getConnection();
  let conn;
  
  try {
    conn = await pool.getConnection();
    // Insert quotation with type-safe values
    const [quotationResult] = await conn.execute<ResultSetHeader>(
      `INSERT INTO quotations 
        (reference, date, valid_until, customer_id, warehouse_id, subtotal, 
         tax_rate, tax_amount, discount, shipping, total, status, notes, created_by, 
         created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        body.reference,
        body.date ? new Date(body.date).toISOString().split('T')[0] : null,
        body.valid_until ? new Date(body.valid_until).toISOString().split('T')[0] : null,
        body.customer_id,
        body.warehouse_id,
        Number(body.subtotal),
        Number(body.tax_rate || 0),
        Number(body.tax_amount || 0),
        Number(body.discount || 0),
        Number(body.shipping || 0),
        Number(body.total),
        body.status || 'pending',
        body.notes ?? null,
        body.created_by
      ]
    );

    const quotationId = quotationResult.insertId;
    console.log('Inserted quotation ID:', quotationId); // Debug log

    if (!quotationId) {
      return NextResponse.json({ error: "Failed to create quotation" }, { status: 500 });
    }

    // Insert items with proper type conversion
    for (const item of body.items) {
      await conn.execute<ResultSetHeader>(
        `INSERT INTO quotation_items 
          (quotation_id, product_id, quantity, unit_price, discount, tax, subtotal)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          quotationId,
          item.product_id,
          Number(item.quantity),
          Number(item.unit_price),
          Number(item.discount || 0),
          Number(item.tax || 0),
          Number(
            (Number(item.unit_price) * Number(item.quantity) - 
            Number(item.discount || 0) + 
            Number(item.tax || 0)
          ))
        ]
      );
    }

    return NextResponse.json({ 
      success: true, 
      id: quotationId 
    });

  } catch (error: unknown) {
    console.error('Database Error:', error);
    const message = error instanceof Error ? error.message : 'Database operation failed';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  } finally {
    if (conn) conn.release();
  }
}



export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  const test = searchParams.get('test')
  const pool = getConnection()
  let conn
  try {
    conn = await pool.getConnection()
    
    // Test endpoint to check database status
    if (test === 'db-status') {
      try {
        const [quotationsCount]: [RowDataPacket[], FieldPacket[]] = await conn.query('SELECT COUNT(*) as count FROM quotations')
        const [customersCount]: [RowDataPacket[], FieldPacket[]] = await conn.query('SELECT COUNT(*) as count FROM customers')
        const [warehousesCount]: [RowDataPacket[], FieldPacket[]] = await conn.query('SELECT COUNT(*) as count FROM warehouses')
        const [usersCount]: [RowDataPacket[], FieldPacket[]] = await conn.query('SELECT COUNT(*) as count FROM users')
        
        return NextResponse.json({
          quotations: quotationsCount[0]?.count || 0,
          customers: customersCount[0]?.count || 0,
          warehouses: warehousesCount[0]?.count || 0,
          users: usersCount[0]?.count || 0
        })
      } catch (error) {
        console.error('Database status check error:', error)
        return NextResponse.json({ error: 'Database tables not accessible' }, { status: 500 })
      }
    }
    
    // Test if quotations table exists and has data
    try {
      const [testResult]: [RowDataPacket[], FieldPacket[]] = await conn.query('SELECT COUNT(*) as count FROM quotations')
      console.log('Quotations table exists, count:', testResult[0]?.count)
    } catch (tableError) {
      console.error('Quotations table error:', tableError)
      return NextResponse.json({ error: 'Quotations table not found or inaccessible' }, { status: 500 })
    }
    
    if (id) {
      // Get single quotation with items
      const [quotation] = await conn.execute<Quotation[]>(
        `SELECT 
          q.*, 
          c.name as customer_name, 
          w.name as warehouse_name,
          u.name as created_by
         FROM quotations q
         LEFT JOIN customers c ON q.customer_id = c.id
         LEFT JOIN warehouses w ON q.warehouse_id = w.id
         LEFT JOIN users u ON q.created_by = u.id
         WHERE q.id = ?`,
        [id]
      )

      if (quotation.length === 0) {
        return NextResponse.json({ error: "Quotation not found" }, { status: 404 })
      }

      const [items] = await conn.execute<QuotationItemWithProduct[]>(
        `SELECT 
          qi.*,
          p.name as product_name,
          p.code as product_code
         FROM quotation_items qi
         LEFT JOIN products p ON qi.product_id = p.id
         WHERE qi.quotation_id = ?`,
        [id]
      )

      return NextResponse.json({
        ...quotation[0],
        items
      })
    } else {
      // Get all quotations with pagination
      const page = parseInt(searchParams.get("page") || "1")
      const limit = parseInt(searchParams.get("limit") || "10")
      const search = searchParams.get("search") || ""
      const offset = (page - 1) * limit

      let whereClause = ""
      let queryParams: any[] = []
      
      if (search) {
        whereClause = "WHERE q.reference LIKE ? OR c.name LIKE ?"
        queryParams = [`%${search}%`, `%${search}%`]
      }

      const finalParams = [...queryParams, limit, offset]

      const [rows]: [RowDataPacket[], FieldPacket[]] = await conn.query(
        `SELECT 
          q.id, 
          q.reference, 
          q.date, 
          q.valid_until,
          COALESCE(c.name, 'Unknown') as customer_name, 
          COALESCE(w.name, 'Unknown') as warehouse_name, 
          q.status, 
          q.total,
          COALESCE(u.name, 'Unknown') as created_by
         FROM quotations q
         LEFT JOIN customers c ON q.customer_id = c.id
         LEFT JOIN warehouses w ON q.warehouse_id = w.id
         LEFT JOIN users u ON q.created_by = u.id
         ${whereClause}
         ORDER BY q.created_at DESC
         LIMIT ? OFFSET ?`,
        finalParams
      )

      const [totalRows]: [RowDataPacket[], FieldPacket[]] = await conn.query(
        `SELECT COUNT(*) as total FROM quotations q LEFT JOIN customers c ON q.customer_id = c.id ${whereClause}`,
        queryParams
      );

      return NextResponse.json({
        data: rows,
        pagination: {
          total: totalRows[0].total,
          page,
          limit,
          totalPages: Math.ceil(totalRows[0].total / limit),
        },
      });
    }
  } catch (error: unknown) {
    console.error('Quotations API Error:', error);
    const err = error instanceof Error ? error : new Error('Unknown error')
    return NextResponse.json({ error: err.message }, { status: 500 })
  } finally {
    if (conn) conn.release()
  }
}

export async function PUT(req: NextRequest): Promise<NextResponse> {
  const body: QuotationRequest & { id: string } = await req.json()
  const pool = getConnection()
  let conn
  try {
    conn = await pool.getConnection()
    // Update quotation
    await conn.execute<ResultSetHeader>(
      `UPDATE quotations SET
        reference = ?,
        date = ?,
        valid_until = ?,
        customer_id = ?,
        warehouse_id = ?,
        subtotal = ?,
        tax_rate = ?,
        tax_amount = ?,
        discount = ?,
        shipping = ?,
        total = ?,
        status = ?,
        notes = ?,
        updated_at = NOW()
       WHERE id = ?`,
      [
        body.reference,
        body.date ? new Date(body.date).toISOString().split('T')[0] : null,
        body.valid_until ? new Date(body.valid_until).toISOString().split('T')[0] : null,
        body.customer_id,
        body.warehouse_id,
        body.subtotal,
        body.tax_rate,
        body.tax_amount,
        body.discount,
        body.shipping,
        body.total,
        body.status || 'pending',
        body.notes || null,
        body.id
      ]
    )

    // Delete existing items
    await conn.execute<ResultSetHeader>(
      `DELETE FROM quotation_items WHERE quotation_id = ?`,
      [body.id]
    )

    // Insert updated items
    for (const item of body.items) {
      await conn.execute<ResultSetHeader>(
        `INSERT INTO quotation_items 
          (quotation_id, product_id, quantity, unit_price, discount, tax, subtotal)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          body.id,
          item.id,
          item.quantity,
          item.price,       
          item.discount,
          item.tax,
          (item.price * item.quantity) - item.discount + item.tax,
        ]
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error('Unknown error')
    return NextResponse.json({ error: err.message }, { status: 500 })
  } finally {
    if (conn) conn.release()
  }
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  const pool = getConnection()
  let conn

  if (!id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 })
  }

  try {
    conn = await pool.getConnection()
    // First delete items to maintain referential integrity
    await conn.execute<ResultSetHeader>(
      `DELETE FROM quotation_items WHERE quotation_id = ?`,
      [id]
    )

    // Then delete the quotation
    const [result] = await conn.execute<ResultSetHeader>(
      `DELETE FROM quotations WHERE id = ?`,
      [id]
    )

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error('Unknown error')
    return NextResponse.json({ error: err.message }, { status: 500 })
  } finally {
    if (conn) conn.release()
  }
}

// Add this new endpoint to your existing API route file
export async function GET_ITEMS(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url)
  const quotationId = searchParams.get('quotation_id')
  const pool = getConnection()
  let conn

  if (!quotationId) {
    return NextResponse.json({ error: "Quotation ID is required" }, { status: 400 })
  }

  try {
    conn = await pool.getConnection()
    const [items] = await conn.execute<QuotationItemWithProduct[]>(
      `SELECT 
        qi.id,
        qi.product_id,
        p.name as product_name,
        p.code as product_code,
        qi.quantity,
        qi.unit_price as price,
        qi.discount,
        qi.tax,
        qi.subtotal,
        p.stock,
        p.unit_name
       FROM quotation_items qi
       LEFT JOIN products p ON qi.product_id = p.id
       WHERE qi.quotation_id = ?
       ORDER BY qi.id`,
      [quotationId]
    )

    return NextResponse.json(items)
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error('Unknown error')
    return NextResponse.json({ error: err.message }, { status: 500 })
  } finally {
    if (conn) conn.release()
  }
}