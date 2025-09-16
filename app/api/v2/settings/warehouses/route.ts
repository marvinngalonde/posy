import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import type {
  Warehouse,
  PaginatedResponse,
  ApiResponse,
} from "@/lib/types/prisma"

/**
 * GET - Retrieve warehouses with pagination and search
 * Supports both list view and single warehouse retrieval by ID
 */
export async function GET(req: NextRequest): Promise<NextResponse<Warehouse | PaginatedResponse<Warehouse> | ApiResponse>> {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status") as 'active' | 'inactive' | null
    const city = searchParams.get("city") || ""
    const country = searchParams.get("country") || ""
    const offset = (page - 1) * limit

    // Get single warehouse by ID
    if (id) {
      const warehouse = await prisma.warehouses.findUnique({
        where: { id: parseInt(id) },
        include: {
          products: {
            select: {
              id: true,
              name: true,
              code: true,
              stock_quantity: true,
              status: true
            },
            take: 10,
            orderBy: { name: 'asc' }
          },
          sales: {
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
          }
        }
      })

      if (!warehouse) {
        return NextResponse.json(
          { error: "Warehouse not found" },
          { status: 404 }
        )
      }

      return NextResponse.json(warehouse)
    }

    // Build where clause for filtering
    const where: any = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' as const } },
        { phone: { contains: search, mode: 'insensitive' as const } },
        { email: { contains: search, mode: 'insensitive' as const } },
        { address: { contains: search, mode: 'insensitive' as const } },
        { city: { contains: search, mode: 'insensitive' as const } },
        { country: { contains: search, mode: 'insensitive' as const } },
      ]
    }

    if (status) {
      where.status = status
    }

    if (city) {
      where.city = { contains: city, mode: 'insensitive' as const }
    }

    if (country) {
      where.country = { contains: country, mode: 'insensitive' as const }
    }

    const [warehouses, total] = await Promise.all([
      prisma.warehouses.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          address: true,
          city: true,
          country: true,
          zip_code: true,
          status: true,
          created_at: true,
          updated_at: true,
          _count: {
            select: {
              products: true,
              sales: true,
              purchases: true
            }
          }
        },
      }),
      prisma.warehouses.count({ where }),
    ])

    return NextResponse.json({
      data: warehouses,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('GET warehouses error:', error)
    return NextResponse.json(
      { error: "Failed to fetch warehouses" },
      { status: 500 }
    )
  }
}

/**
 * POST - Create a new warehouse
 * Validates required fields and creates warehouse record
 */
export async function POST(request: NextRequest): Promise<NextResponse<Warehouse | ApiResponse>> {
  try {
    const body = await request.json()
    const {
      name,
      phone,
      email,
      address,
      city,
      country,
      zip_code,
      status = 'active'
    } = body

    // Validation
    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Warehouse name is required" },
        { status: 400 }
      )
    }

    if (!phone?.trim()) {
      return NextResponse.json(
        { error: "Warehouse phone is required" },
        { status: 400 }
      )
    }

    if (!email?.trim()) {
      return NextResponse.json(
        { error: "Warehouse email is required" },
        { status: 400 }
      )
    }

    if (!city?.trim()) {
      return NextResponse.json(
        { error: "City is required" },
        { status: 400 }
      )
    }

    if (!country?.trim()) {
      return NextResponse.json(
        { error: "Country is required" },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      )
    }

    // Check if warehouse name already exists
    const existingName = await prisma.warehouses.findFirst({
      where: {
        name: {
          equals: name.trim(),
          mode: 'insensitive'
        }
      }
    })

    if (existingName) {
      return NextResponse.json(
        { error: "Warehouse with this name already exists" },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingEmail = await prisma.warehouses.findFirst({
      where: {
        email: {
          equals: email.trim(),
          mode: 'insensitive'
        }
      }
    })

    if (existingEmail) {
      return NextResponse.json(
        { error: "Warehouse with this email already exists" },
        { status: 400 }
      )
    }

    const newWarehouse = await prisma.warehouses.create({
      data: {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
        address: address?.trim() || '',
        city: city.trim(),
        country: country.trim(),
        zip_code: zip_code?.trim() || '',
        status,
      },
    })

    return NextResponse.json(newWarehouse, { status: 201 })
  } catch (error) {
    console.error('POST warehouses error:', error)
    return NextResponse.json(
      { error: "Failed to create warehouse" },
      { status: 500 }
    )
  }
}

/**
 * PUT - Update an existing warehouse
 * Replaces all warehouse data
 */
export async function PUT(request: NextRequest): Promise<NextResponse<Warehouse | ApiResponse>> {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: "Warehouse ID is required" },
        { status: 400 }
      )
    }

    const body = await request.json()
    const {
      name,
      phone,
      email,
      address,
      city,
      country,
      zip_code,
      status
    } = body

    // Validation
    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Warehouse name is required" },
        { status: 400 }
      )
    }

    if (!phone?.trim()) {
      return NextResponse.json(
        { error: "Warehouse phone is required" },
        { status: 400 }
      )
    }

    if (!email?.trim()) {
      return NextResponse.json(
        { error: "Warehouse email is required" },
        { status: 400 }
      )
    }

    if (!city?.trim()) {
      return NextResponse.json(
        { error: "City is required" },
        { status: 400 }
      )
    }

    if (!country?.trim()) {
      return NextResponse.json(
        { error: "Country is required" },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      )
    }

    // Check if warehouse exists
    const existingWarehouse = await prisma.warehouses.findUnique({
      where: { id: parseInt(id) }
    })

    if (!existingWarehouse) {
      return NextResponse.json(
        { error: "Warehouse not found" },
        { status: 404 }
      )
    }

    // Check if name is being changed and if it already exists
    if (name.trim().toLowerCase() !== existingWarehouse.name.toLowerCase()) {
      const duplicateName = await prisma.warehouses.findFirst({
        where: {
          name: {
            equals: name.trim(),
            mode: 'insensitive'
          },
          id: { not: parseInt(id) }
        }
      })

      if (duplicateName) {
        return NextResponse.json(
          { error: "Warehouse with this name already exists" },
          { status: 400 }
        )
      }
    }

    // Check if email is being changed and if it already exists
    if (email.trim().toLowerCase() !== existingWarehouse.email.toLowerCase()) {
      const duplicateEmail = await prisma.warehouses.findFirst({
        where: {
          email: {
            equals: email.trim(),
            mode: 'insensitive'
          },
          id: { not: parseInt(id) }
        }
      })

      if (duplicateEmail) {
        return NextResponse.json(
          { error: "Warehouse with this email already exists" },
          { status: 400 }
        )
      }
    }

    const updatedWarehouse = await prisma.warehouses.update({
      where: { id: parseInt(id) },
      data: {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
        address: address?.trim() || '',
        city: city.trim(),
        country: country.trim(),
        zip_code: zip_code?.trim() || '',
        status: status || existingWarehouse.status,
        updated_at: new Date(),
      },
    })

    return NextResponse.json(updatedWarehouse)
  } catch (error) {
    console.error('PUT warehouses error:', error)
    return NextResponse.json(
      { error: "Failed to update warehouse" },
      { status: 500 }
    )
  }
}

/**
 * PATCH - Partial update of warehouse fields
 * Updates only provided fields
 */
export async function PATCH(request: NextRequest): Promise<NextResponse<Warehouse | ApiResponse>> {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: "Warehouse ID is required" },
        { status: 400 }
      )
    }

    const body = await request.json()

    // Check if warehouse exists
    const existingWarehouse = await prisma.warehouses.findUnique({
      where: { id: parseInt(id) }
    })

    if (!existingWarehouse) {
      return NextResponse.json(
        { error: "Warehouse not found" },
        { status: 404 }
      )
    }

    // Validate name if being updated
    if (body.name) {
      if (!body.name.trim()) {
        return NextResponse.json(
          { error: "Warehouse name cannot be empty" },
          { status: 400 }
        )
      }

      // Check name uniqueness if being updated
      if (body.name.trim().toLowerCase() !== existingWarehouse.name.toLowerCase()) {
        const duplicateName = await prisma.warehouses.findFirst({
          where: {
            name: {
              equals: body.name.trim(),
              mode: 'insensitive'
            },
            id: { not: parseInt(id) }
          }
        })

        if (duplicateName) {
          return NextResponse.json(
            { error: "Warehouse with this name already exists" },
            { status: 400 }
          )
        }
      }

      body.name = body.name.trim()
    }

    // Validate email if being updated
    if (body.email) {
      if (!body.email.trim()) {
        return NextResponse.json(
          { error: "Warehouse email cannot be empty" },
          { status: 400 }
        )
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(body.email.trim())) {
        return NextResponse.json(
          { error: "Invalid email format" },
          { status: 400 }
        )
      }

      // Check email uniqueness if being updated
      if (body.email.trim().toLowerCase() !== existingWarehouse.email.toLowerCase()) {
        const duplicateEmail = await prisma.warehouses.findFirst({
          where: {
            email: {
              equals: body.email.trim(),
              mode: 'insensitive'
            },
            id: { not: parseInt(id) }
          }
        })

        if (duplicateEmail) {
          return NextResponse.json(
            { error: "Warehouse with this email already exists" },
            { status: 400 }
          )
        }
      }

      body.email = body.email.trim().toLowerCase()
    }

    // Validate other required fields if being updated
    if (body.phone && !body.phone.trim()) {
      return NextResponse.json(
        { error: "Warehouse phone cannot be empty" },
        { status: 400 }
      )
    }

    if (body.city && !body.city.trim()) {
      return NextResponse.json(
        { error: "City cannot be empty" },
        { status: 400 }
      )
    }

    if (body.country && !body.country.trim()) {
      return NextResponse.json(
        { error: "Country cannot be empty" },
        { status: 400 }
      )
    }

    // Clean string fields
    if (body.phone !== undefined) {
      body.phone = body.phone?.trim() || ''
    }
    if (body.address !== undefined) {
      body.address = body.address?.trim() || ''
    }
    if (body.city !== undefined) {
      body.city = body.city?.trim() || ''
    }
    if (body.country !== undefined) {
      body.country = body.country?.trim() || ''
    }
    if (body.zip_code !== undefined) {
      body.zip_code = body.zip_code?.trim() || ''
    }

    const updatedWarehouse = await prisma.warehouses.update({
      where: { id: parseInt(id) },
      data: {
        ...body,
        updated_at: new Date(),
      },
    })

    return NextResponse.json(updatedWarehouse)
  } catch (error) {
    console.error('PATCH warehouses error:', error)
    return NextResponse.json(
      { error: "Failed to update warehouse" },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Remove a warehouse
 * Checks for associated products, sales, and purchases before deletion
 */
export async function DELETE(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "Warehouse ID is required" },
        { status: 400 }
      )
    }

    // Check if warehouse exists
    const existingWarehouse = await prisma.warehouses.findUnique({
      where: { id: parseInt(id) },
      include: {
        products: { select: { id: true } },
        sales: { select: { id: true } },
        purchases: { select: { id: true } },
        quotations: { select: { id: true } }
      }
    })

    if (!existingWarehouse) {
      return NextResponse.json(
        { error: "Warehouse not found" },
        { status: 404 }
      )
    }

    // Check for associated records
    const hasAssociatedRecords =
      existingWarehouse.products.length > 0 ||
      existingWarehouse.sales.length > 0 ||
      existingWarehouse.purchases.length > 0 ||
      existingWarehouse.quotations.length > 0

    if (hasAssociatedRecords) {
      const associations = []
      if (existingWarehouse.products.length > 0) associations.push('products')
      if (existingWarehouse.sales.length > 0) associations.push('sales')
      if (existingWarehouse.purchases.length > 0) associations.push('purchases')
      if (existingWarehouse.quotations.length > 0) associations.push('quotations')

      return NextResponse.json(
        { error: `Cannot delete warehouse with associated ${associations.join(', ')}. Please reassign or delete them first.` },
        { status: 400 }
      )
    }

    await prisma.warehouses.delete({ where: { id: parseInt(id) } })

    return NextResponse.json({
      message: "Warehouse deleted successfully",
      success: true
    })
  } catch (error) {
    console.error('DELETE warehouses error:', error)
    return NextResponse.json(
      { error: "Failed to delete warehouse" },
      { status: 500 }
    )
  }
}