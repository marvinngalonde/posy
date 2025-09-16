import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import type {
  Category,
  PaginatedResponse,
  ApiResponse,
} from "@/lib/types/prisma"

/**
 * GET - Retrieve categories with pagination and search
 * Supports both list view and single category retrieval by ID
 */
export async function GET(req: NextRequest): Promise<NextResponse<Category | PaginatedResponse<Category> | ApiResponse>> {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status") as 'active' | 'inactive' | null
    const offset = (page - 1) * limit

    // Get single category by ID
    if (id) {
      const category = await prisma.categories.findUnique({
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

      if (!category) {
        return NextResponse.json(
          { error: "Category not found" },
          { status: 404 }
        )
      }

      return NextResponse.json(category)
    }

    // Build where clause for filtering
    const where: any = {}

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' as const } },
        { name: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } },
      ]
    }

    if (status) {
      where.status = status
    }

    const [categories, total] = await Promise.all([
      prisma.categories.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { name: "asc" },
        select: {
          id: true,
          code: true,
          name: true,
          description: true,
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
      prisma.categories.count({ where }),
    ])

    return NextResponse.json({
      data: categories,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('GET categories error:', error)
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    )
  }
}

/**
 * POST - Create a new category
 * Validates required fields and creates category record
 */
export async function POST(request: NextRequest): Promise<NextResponse<Category | ApiResponse>> {
  try {
    const body = await request.json()
    const {
      code,
      name,
      description,
      status = 'active'
    } = body

    // Validation
    if (!code?.trim()) {
      return NextResponse.json(
        { error: "Category code is required" },
        { status: 400 }
      )
    }

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Category name is required" },
        { status: 400 }
      )
    }

    // Check if category code already exists
    const existingCode = await prisma.categories.findFirst({
      where: {
        code: {
          equals: code.trim(),
          mode: 'insensitive'
        }
      }
    })

    if (existingCode) {
      return NextResponse.json(
        { error: "Category with this code already exists" },
        { status: 400 }
      )
    }

    // Check if category name already exists
    const existingName = await prisma.categories.findFirst({
      where: {
        name: {
          equals: name.trim(),
          mode: 'insensitive'
        }
      }
    })

    if (existingName) {
      return NextResponse.json(
        { error: "Category with this name already exists" },
        { status: 400 }
      )
    }

    const newCategory = await prisma.categories.create({
      data: {
        code: code.trim(),
        name: name.trim(),
        description: description?.trim() || '',
        status,
      },
    })

    return NextResponse.json(newCategory, { status: 201 })
  } catch (error) {
    console.error('POST categories error:', error)
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    )
  }
}

/**
 * PUT - Update an existing category
 * Replaces all category data
 */
export async function PUT(request: NextRequest): Promise<NextResponse<Category | ApiResponse>> {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: "Category ID is required" },
        { status: 400 }
      )
    }

    const body = await request.json()
    const {
      code,
      name,
      description,
      status
    } = body

    // Validation
    if (!code?.trim()) {
      return NextResponse.json(
        { error: "Category code is required" },
        { status: 400 }
      )
    }

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Category name is required" },
        { status: 400 }
      )
    }

    // Check if category exists
    const existingCategory = await prisma.categories.findUnique({
      where: { id: parseInt(id) }
    })

    if (!existingCategory) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      )
    }

    // Check if code is being changed and if it already exists
    if (code.trim().toLowerCase() !== existingCategory.code.toLowerCase()) {
      const duplicateCode = await prisma.categories.findFirst({
        where: {
          code: {
            equals: code.trim(),
            mode: 'insensitive'
          },
          id: { not: parseInt(id) }
        }
      })

      if (duplicateCode) {
        return NextResponse.json(
          { error: "Category with this code already exists" },
          { status: 400 }
        )
      }
    }

    // Check if name is being changed and if it already exists
    if (name.trim().toLowerCase() !== existingCategory.name.toLowerCase()) {
      const duplicateName = await prisma.categories.findFirst({
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
          { error: "Category with this name already exists" },
          { status: 400 }
        )
      }
    }

    const updatedCategory = await prisma.categories.update({
      where: { id: parseInt(id) },
      data: {
        code: code.trim(),
        name: name.trim(),
        description: description?.trim() || '',
        status: status || existingCategory.status,
        updated_at: new Date(),
      },
    })

    return NextResponse.json(updatedCategory)
  } catch (error) {
    console.error('PUT categories error:', error)
    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 500 }
    )
  }
}

/**
 * PATCH - Partial update of category fields
 * Updates only provided fields
 */
export async function PATCH(request: NextRequest): Promise<NextResponse<Category | ApiResponse>> {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: "Category ID is required" },
        { status: 400 }
      )
    }

    const body = await request.json()

    // Check if category exists
    const existingCategory = await prisma.categories.findUnique({
      where: { id: parseInt(id) }
    })

    if (!existingCategory) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      )
    }

    // Validate code if being updated
    if (body.code) {
      if (!body.code.trim()) {
        return NextResponse.json(
          { error: "Category code cannot be empty" },
          { status: 400 }
        )
      }

      // Check code uniqueness if being updated
      if (body.code.trim().toLowerCase() !== existingCategory.code.toLowerCase()) {
        const duplicateCode = await prisma.categories.findFirst({
          where: {
            code: {
              equals: body.code.trim(),
              mode: 'insensitive'
            },
            id: { not: parseInt(id) }
          }
        })

        if (duplicateCode) {
          return NextResponse.json(
            { error: "Category with this code already exists" },
            { status: 400 }
          )
        }
      }

      body.code = body.code.trim()
    }

    // Validate name if being updated
    if (body.name) {
      if (!body.name.trim()) {
        return NextResponse.json(
          { error: "Category name cannot be empty" },
          { status: 400 }
        )
      }

      // Check name uniqueness if being updated
      if (body.name.trim().toLowerCase() !== existingCategory.name.toLowerCase()) {
        const duplicateName = await prisma.categories.findFirst({
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
            { error: "Category with this name already exists" },
            { status: 400 }
          )
        }
      }

      body.name = body.name.trim()
    }

    // Clean description field
    if (body.description !== undefined) {
      body.description = body.description?.trim() || ''
    }

    const updatedCategory = await prisma.categories.update({
      where: { id: parseInt(id) },
      data: {
        ...body,
        updated_at: new Date(),
      },
    })

    return NextResponse.json(updatedCategory)
  } catch (error) {
    console.error('PATCH categories error:', error)
    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Remove a category
 * Checks for associated products before deletion
 */
export async function DELETE(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "Category ID is required" },
        { status: 400 }
      )
    }

    // Check if category exists
    const existingCategory = await prisma.categories.findUnique({
      where: { id: parseInt(id) },
      include: {
        products: { select: { id: true } }
      }
    })

    if (!existingCategory) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      )
    }

    // Check for associated products
    if (existingCategory.products.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete category with associated products. Please reassign or delete the products first." },
        { status: 400 }
      )
    }

    await prisma.categories.delete({ where: { id: parseInt(id) } })

    return NextResponse.json({
      message: "Category deleted successfully",
      success: true
    })
  } catch (error) {
    console.error('DELETE categories error:', error)
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 }
    )
  }
}