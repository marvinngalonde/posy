import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import type {
  ExpenseCategory,
  PaginatedResponse,
  ApiResponse,
} from "@/lib/types/prisma"

/**
 * GET - Retrieve expense categories with pagination and search
 * Supports both list view and single expense category retrieval by ID
 */
export async function GET(req: NextRequest): Promise<NextResponse<ExpenseCategory | PaginatedResponse<ExpenseCategory> | ApiResponse>> {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status")
    const offset = (page - 1) * limit

    // Get single expense category by ID
    if (id) {
      const expenseCategory = await prisma.expense_categories.findUnique({
        where: { id: parseInt(id) },
        include: {
          expenses: {
            select: { id: true, reference: true, amount: true, date: true, status: true }
          }
        }
      })

      if (!expenseCategory) {
        return NextResponse.json(
          { error: "Expense category not found" },
          { status: 404 }
        )
      }

      return NextResponse.json(expenseCategory)
    }

    // Build where clause for filters
    const where: any = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } }
      ]
    }

    if (status) {
      where.status = status
    }

    const [expenseCategories, total] = await Promise.all([
      prisma.expense_categories.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          _count: {
            select: { expenses: true }
          }
        }
      }),
      prisma.expense_categories.count({ where })
    ])

    return NextResponse.json({
      data: expenseCategories,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('GET expense categories error:', error)
    return NextResponse.json(
      { error: "Failed to fetch expense categories" },
      { status: 500 }
    )
  }
}

/**
 * POST - Create a new expense category
 * Validates required fields and creates expense category record
 */
export async function POST(req: NextRequest): Promise<NextResponse<ExpenseCategory | ApiResponse>> {
  try {
    const body = await req.json()
    const { name, description, status = 'active' } = body

    // Validation
    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      )
    }

    // Check if name already exists (case-insensitive)
    const allCategories = await prisma.expense_categories.findMany({
      select: { name: true }
    })
    const existingCategory = allCategories.find(
      cat => cat.name.toLowerCase() === name.trim().toLowerCase()
    )

    if (existingCategory) {
      return NextResponse.json(
        { error: "Expense category name already exists" },
        { status: 400 }
      )
    }

    const newExpenseCategory = await prisma.expense_categories.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        status
      }
    })

    return NextResponse.json(newExpenseCategory, { status: 201 })
  } catch (error) {
    console.error('POST expense categories error:', error)
    return NextResponse.json(
      { error: "Failed to create expense category" },
      { status: 500 }
    )
  }
}

/**
 * PUT - Update an existing expense category
 * Replaces all expense category data
 */
export async function PUT(req: NextRequest): Promise<NextResponse<ExpenseCategory | ApiResponse>> {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: "Expense category ID is required" },
        { status: 400 }
      )
    }

    const body = await req.json()
    const { name, description, status } = body

    // Validation
    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      )
    }

    // Check if expense category exists
    const existingCategory = await prisma.expense_categories.findUnique({
      where: { id: parseInt(id) }
    })

    if (!existingCategory) {
      return NextResponse.json(
        { error: "Expense category not found" },
        { status: 404 }
      )
    }

    // Check if name is being changed and if it already exists
    if (name.trim().toLowerCase() !== existingCategory.name.toLowerCase()) {
      const allCategories = await prisma.expense_categories.findMany({
        where: { id: { not: parseInt(id) } },
        select: { name: true }
      })
      const duplicateName = allCategories.find(
        cat => cat.name.toLowerCase() === name.trim().toLowerCase()
      )

      if (duplicateName) {
        return NextResponse.json(
          { error: "Expense category name already exists" },
          { status: 400 }
        )
      }
    }

    const updatedExpenseCategory = await prisma.expense_categories.update({
      where: { id: parseInt(id) },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        status: status || existingCategory.status,
        updated_at: new Date()
      }
    })

    return NextResponse.json(updatedExpenseCategory)
  } catch (error) {
    console.error('PUT expense categories error:', error)
    return NextResponse.json(
      { error: "Failed to update expense category" },
      { status: 500 }
    )
  }
}

/**
 * PATCH - Partial update of expense category fields
 * Updates only provided fields
 */
export async function PATCH(req: NextRequest): Promise<NextResponse<ExpenseCategory | ApiResponse>> {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: "Expense category ID is required" },
        { status: 400 }
      )
    }

    const body = await req.json()

    // Check if expense category exists
    const existingCategory = await prisma.expense_categories.findUnique({
      where: { id: parseInt(id) }
    })

    if (!existingCategory) {
      return NextResponse.json(
        { error: "Expense category not found" },
        { status: 404 }
      )
    }

    // If name is being updated, validate it doesn't exist
    if (body.name && body.name.trim().toLowerCase() !== existingCategory.name.toLowerCase()) {
      const allCategories = await prisma.expense_categories.findMany({
        where: { id: { not: parseInt(id) } },
        select: { name: true }
      })
      const duplicateName = allCategories.find(
        cat => cat.name.toLowerCase() === body.name.trim().toLowerCase()
      )

      if (duplicateName) {
        return NextResponse.json(
          { error: "Expense category name already exists" },
          { status: 400 }
        )
      }
    }

    // Clean up string fields
    if (body.name) body.name = body.name.trim()
    if (body.description) body.description = body.description.trim()

    const updatedExpenseCategory = await prisma.expense_categories.update({
      where: { id: parseInt(id) },
      data: {
        ...body,
        updated_at: new Date()
      }
    })

    return NextResponse.json(updatedExpenseCategory)
  } catch (error) {
    console.error('PATCH expense categories error:', error)
    return NextResponse.json(
      { error: "Failed to update expense category" },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Remove an expense category
 * Checks for existing expenses before deletion
 */
export async function DELETE(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "Expense category ID is required" },
        { status: 400 }
      )
    }

    // Check if expense category exists
    const existingCategory = await prisma.expense_categories.findUnique({
      where: { id: parseInt(id) },
      include: { _count: { select: { expenses: true } } }
    })

    if (!existingCategory) {
      return NextResponse.json(
        { error: "Expense category not found" },
        { status: 404 }
      )
    }

    // Check if category has expenses
    if (existingCategory._count.expenses > 0) {
      return NextResponse.json(
        { error: "Cannot delete expense category with existing expenses" },
        { status: 400 }
      )
    }

    await prisma.expense_categories.delete({ where: { id: parseInt(id) } })

    return NextResponse.json({
      message: "Expense category deleted successfully",
      success: true
    })
  } catch (error) {
    console.error('DELETE expense categories error:', error)
    return NextResponse.json(
      { error: "Failed to delete expense category" },
      { status: 500 }
    )
  }
}