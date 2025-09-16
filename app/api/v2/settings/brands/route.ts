import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import type {
  Brand,
  PaginatedResponse,
  ApiResponse,
} from "@/lib/types/prisma"

/**
 * GET - Retrieve brands with pagination and search
 * Supports both list view and single brand retrieval by ID
 */
export async function GET(req: NextRequest): Promise<NextResponse<Brand | PaginatedResponse<Brand> | ApiResponse>> {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status") as 'active' | 'inactive' | null
    const offset = (page - 1) * limit

    // Get single brand by ID
    if (id) {
      const brand = await prisma.brands.findUnique({
        where: { id: parseInt(id) },
        include: {
          products: {
            select: {
              id: true,
              name: true,
              code: true,
              status: true
            },
            take: 10,
            orderBy: { name: 'asc' }
          }
        }
      })

      if (!brand) {
        return NextResponse.json(
          { error: "Brand not found" },
          { status: 404 }
        )
      }

      return NextResponse.json(brand)
    }

    // Build where clause for filtering
    const where: any = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } },
      ]
    }

    if (status) {
      where.status = status
    }

    const [brands, total] = await Promise.all([
      prisma.brands.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          description: true,
          image: true,
          status: true,
          created_at: true,
          updated_at: true,
          _count: {
            select: {
              products: true
            }
          }
        },
      }),
      prisma.brands.count({ where }),
    ])

    return NextResponse.json({
      data: brands,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('GET brands error:', error)
    return NextResponse.json(
      { error: "Failed to fetch brands" },
      { status: 500 }
    )
  }
}

/**
 * POST - Create a new brand
 * Validates required fields and creates brand record
 */
export async function POST(request: NextRequest): Promise<NextResponse<Brand | ApiResponse>> {
  try {
    const body = await request.json()
    const {
      name,
      description,
      image,
      status = 'active'
    } = body

    // Validation
    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Brand name is required" },
        { status: 400 }
      )
    }

    // Check if brand name already exists
    const existingBrand = await prisma.brands.findFirst({
      where: {
        name: {
          equals: name.trim(),
          mode: 'insensitive'
        }
      }
    })

    if (existingBrand) {
      return NextResponse.json(
        { error: "Brand with this name already exists" },
        { status: 400 }
      )
    }

    const newBrand = await prisma.brands.create({
      data: {
        name: name.trim(),
        description: description?.trim() || '',
        image: image?.trim() || null,
        status,
      },
    })

    return NextResponse.json(newBrand, { status: 201 })
  } catch (error) {
    console.error('POST brands error:', error)
    return NextResponse.json(
      { error: "Failed to create brand" },
      { status: 500 }
    )
  }
}

/**
 * PUT - Update an existing brand
 * Replaces all brand data
 */
export async function PUT(request: NextRequest): Promise<NextResponse<Brand | ApiResponse>> {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: "Brand ID is required" },
        { status: 400 }
      )
    }

    const body = await request.json()
    const {
      name,
      description,
      image,
      status
    } = body

    // Validation
    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Brand name is required" },
        { status: 400 }
      )
    }

    // Check if brand exists
    const existingBrand = await prisma.brands.findUnique({
      where: { id: parseInt(id) }
    })

    if (!existingBrand) {
      return NextResponse.json(
        { error: "Brand not found" },
        { status: 404 }
      )
    }

    // Check if name is being changed and if it already exists
    if (name.trim().toLowerCase() !== existingBrand.name.toLowerCase()) {
      const duplicateName = await prisma.brands.findFirst({
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
          { error: "Brand with this name already exists" },
          { status: 400 }
        )
      }
    }

    const updatedBrand = await prisma.brands.update({
      where: { id: parseInt(id) },
      data: {
        name: name.trim(),
        description: description?.trim() || '',
        image: image?.trim() || null,
        status: status || existingBrand.status,
        updated_at: new Date(),
      },
    })

    return NextResponse.json(updatedBrand)
  } catch (error) {
    console.error('PUT brands error:', error)
    return NextResponse.json(
      { error: "Failed to update brand" },
      { status: 500 }
    )
  }
}

/**
 * PATCH - Partial update of brand fields
 * Updates only provided fields
 */
export async function PATCH(request: NextRequest): Promise<NextResponse<Brand | ApiResponse>> {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: "Brand ID is required" },
        { status: 400 }
      )
    }

    const body = await request.json()

    // Check if brand exists
    const existingBrand = await prisma.brands.findUnique({
      where: { id: parseInt(id) }
    })

    if (!existingBrand) {
      return NextResponse.json(
        { error: "Brand not found" },
        { status: 404 }
      )
    }

    // Validate name if being updated
    if (body.name) {
      if (!body.name.trim()) {
        return NextResponse.json(
          { error: "Brand name cannot be empty" },
          { status: 400 }
        )
      }

      // Check name uniqueness if being updated
      if (body.name.trim().toLowerCase() !== existingBrand.name.toLowerCase()) {
        const duplicateName = await prisma.brands.findFirst({
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
            { error: "Brand with this name already exists" },
            { status: 400 }
          )
        }
      }

      body.name = body.name.trim()
    }

    // Clean other string fields
    if (body.description !== undefined) {
      body.description = body.description?.trim() || ''
    }
    if (body.image !== undefined) {
      body.image = body.image?.trim() || null
    }

    const updatedBrand = await prisma.brands.update({
      where: { id: parseInt(id) },
      data: {
        ...body,
        updated_at: new Date(),
      },
    })

    return NextResponse.json(updatedBrand)
  } catch (error) {
    console.error('PATCH brands error:', error)
    return NextResponse.json(
      { error: "Failed to update brand" },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Remove a brand
 * Checks for associated products before deletion
 */
export async function DELETE(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "Brand ID is required" },
        { status: 400 }
      )
    }

    // Check if brand exists
    const existingBrand = await prisma.brands.findUnique({
      where: { id: parseInt(id) },
      include: {
        products: { select: { id: true } }
      }
    })

    if (!existingBrand) {
      return NextResponse.json(
        { error: "Brand not found" },
        { status: 404 }
      )
    }

    // Check for associated products
    if (existingBrand.products.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete brand with associated products. Please reassign or delete the products first." },
        { status: 400 }
      )
    }

    await prisma.brands.delete({ where: { id: parseInt(id) } })

    return NextResponse.json({
      message: "Brand deleted successfully",
      success: true
    })
  } catch (error) {
    console.error('DELETE brands error:', error)
    return NextResponse.json(
      { error: "Failed to delete brand" },
      { status: 500 }
    )
  }
}