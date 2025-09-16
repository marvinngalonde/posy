import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import type {
  Supplier,
  PaginatedResponse,
  ApiResponse,
  SearchParams
} from "@/lib/types/prisma"

/**
 * GET - Retrieve suppliers with pagination and search
 * Supports both list view and single supplier retrieval by ID
 */
export async function GET(req: NextRequest): Promise<NextResponse<Supplier | PaginatedResponse<Supplier> | ApiResponse>> {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search") || ""
    const offset = (page - 1) * limit

    // Get single supplier by ID
    if (id) {
      const supplier = await prisma.suppliers.findUnique({
        where: { id: parseInt(id) },
        include: {
          purchases: {
            select: {
              id: true,
              reference: true,
              total: true,
              status: true,
              date: true
            },
            orderBy: { date: 'desc' },
            take: 10
          },
          purchase_returns: {
            select: {
              id: true,
              reference: true,
              total: true,
              status: true,
              date: true
            },
            orderBy: { date: 'desc' },
            take: 10
          }
        }
      })

      if (!supplier) {
        return NextResponse.json(
          { error: "Supplier not found" },
          { status: 404 }
        )
      }

      return NextResponse.json(supplier)
    }

    // Get list of suppliers with pagination and search
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
            { phone: { contains: search, mode: 'insensitive' as const } },
            { city: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}

    const [suppliers, total] = await Promise.all([
      prisma.suppliers.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          address: true,
          city: true,
          country: true,
          tax_number: true,
          total_purchases: true,
          total_paid: true,
          total_due: true,
          status: true,
          created_at: true,
          updated_at: true,
        },
      }),
      prisma.suppliers.count({ where }),
    ])

    return NextResponse.json({
      data: suppliers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('GET suppliers error:', error)
    return NextResponse.json(
      { error: "Failed to fetch suppliers" },
      { status: 500 }
    )
  }
}

/**
 * POST - Create a new supplier
 * Validates required fields and creates supplier record
 */
export async function POST(request: NextRequest): Promise<NextResponse<Supplier | ApiResponse>> {
  try {
    const body = await request.json()
    const {
      name,
      email,
      phone,
      address,
      city,
      country,
      tax_number,
      status = 'active'
    } = body

    // Validation
    if (!name) {
      return NextResponse.json(
        { error: "Supplier name is required" },
        { status: 400 }
      )
    }

    // Check if email already exists (if provided)
    if (email) {
      const existingSupplier = await prisma.suppliers.findFirst({
        where: { email }
      })

      if (existingSupplier) {
        return NextResponse.json(
          { error: "Supplier with this email already exists" },
          { status: 400 }
        )
      }
    }

    const newSupplier = await prisma.suppliers.create({
      data: {
        name,
        email,
        phone,
        address,
        city,
        country,
        tax_number,
        status,
      },
    })

    return NextResponse.json(newSupplier, { status: 201 })
  } catch (error) {
    console.error('POST suppliers error:', error)
    return NextResponse.json(
      { error: "Failed to create supplier" },
      { status: 500 }
    )
  }
}

/**
 * PUT - Update an existing supplier
 * Replaces all supplier data
 */
export async function PUT(request: NextRequest): Promise<NextResponse<Supplier | ApiResponse>> {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: "Supplier ID is required" },
        { status: 400 }
      )
    }

    const body = await request.json()
    const {
      name,
      email,
      phone,
      address,
      city,
      country,
      tax_number,
      status
    } = body

    // Validation
    if (!name) {
      return NextResponse.json(
        { error: "Supplier name is required" },
        { status: 400 }
      )
    }

    // Check if supplier exists
    const existingSupplier = await prisma.suppliers.findUnique({
      where: { id: parseInt(id) }
    })

    if (!existingSupplier) {
      return NextResponse.json(
        { error: "Supplier not found" },
        { status: 404 }
      )
    }

    // Check if email is being changed and if it already exists
    if (email && email !== existingSupplier.email) {
      const duplicateEmail = await prisma.suppliers.findFirst({
        where: { email }
      })

      if (duplicateEmail) {
        return NextResponse.json(
          { error: "Supplier with this email already exists" },
          { status: 400 }
        )
      }
    }

    const updatedSupplier = await prisma.suppliers.update({
      where: { id: parseInt(id) },
      data: {
        name,
        email,
        phone,
        address,
        city,
        country,
        tax_number,
        status: status || existingSupplier.status,
        updated_at: new Date(),
      },
    })

    return NextResponse.json(updatedSupplier)
  } catch (error) {
    console.error('PUT suppliers error:', error)
    return NextResponse.json(
      { error: "Failed to update supplier" },
      { status: 500 }
    )
  }
}

/**
 * PATCH - Partial update of supplier fields
 * Updates only provided fields
 */
export async function PATCH(request: NextRequest): Promise<NextResponse<Supplier | ApiResponse>> {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: "Supplier ID is required" },
        { status: 400 }
      )
    }

    const body = await request.json()

    // Check if supplier exists
    const existingSupplier = await prisma.suppliers.findUnique({
      where: { id: parseInt(id) }
    })

    if (!existingSupplier) {
      return NextResponse.json(
        { error: "Supplier not found" },
        { status: 404 }
      )
    }

    // Check email uniqueness if being updated
    if (body.email && body.email !== existingSupplier.email) {
      const duplicateEmail = await prisma.suppliers.findFirst({
        where: { email: body.email }
      })

      if (duplicateEmail) {
        return NextResponse.json(
          { error: "Supplier with this email already exists" },
          { status: 400 }
        )
      }
    }

    const updatedSupplier = await prisma.suppliers.update({
      where: { id: parseInt(id) },
      data: {
        ...body,
        updated_at: new Date(),
      },
    })

    return NextResponse.json(updatedSupplier)
  } catch (error) {
    console.error('PATCH suppliers error:', error)
    return NextResponse.json(
      { error: "Failed to update supplier" },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Remove a supplier
 * Checks for associated records before deletion
 */
export async function DELETE(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "Supplier ID is required" },
        { status: 400 }
      )
    }

    // Check if supplier exists
    const existingSupplier = await prisma.suppliers.findUnique({
      where: { id: parseInt(id) },
      include: {
        purchases: { select: { id: true } },
        purchase_returns: { select: { id: true } }
      }
    })

    if (!existingSupplier) {
      return NextResponse.json(
        { error: "Supplier not found" },
        { status: 404 }
      )
    }

    // Check for associated records
    const hasAssociatedRecords =
      existingSupplier.purchases.length > 0 ||
      existingSupplier.purchase_returns.length > 0

    if (hasAssociatedRecords) {
      return NextResponse.json(
        { error: "Cannot delete supplier with associated purchases or returns" },
        { status: 400 }
      )
    }

    await prisma.suppliers.delete({ where: { id: parseInt(id) } })

    return NextResponse.json({
      message: "Supplier deleted successfully",
      success: true
    })
  } catch (error) {
    console.error('DELETE suppliers error:', error)
    return NextResponse.json(
      { error: "Failed to delete supplier" },
      { status: 500 }
    )
  }
}