import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import type {
  Expense,
  PaginatedResponse,
  ApiResponse,
  SearchParams
} from "@/lib/types/prisma"

/**
 * GET - Retrieve expenses with pagination and search
 * Supports both list view and single expense retrieval by ID
 */
export async function GET(req: NextRequest): Promise<NextResponse<Expense | PaginatedResponse<Expense> | ApiResponse>> {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search") || ""
    const category_id = searchParams.get("category_id")
    const status = searchParams.get("status")
    const date_from = searchParams.get("date_from")
    const date_to = searchParams.get("date_to")
    const offset = (page - 1) * limit

    // Get single expense by ID
    if (id) {
      const expense = await prisma.expenses.findUnique({
        where: { id: parseInt(id) },
        include: {
          category: { select: { id: true, name: true, description: true } },
          createdBy: { select: { id: true, name: true } }
        }
      })

      if (!expense) {
        return NextResponse.json(
          { error: "Expense not found" },
          { status: 404 }
        )
      }

      return NextResponse.json(expense)
    }

    // Build where clause for filters
    const where: any = {}

    if (search) {
      where.OR = [
        { reference: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } },
        { category: { name: { contains: search, mode: 'insensitive' as const } } }
      ]
    }

    if (category_id) {
      where.category_id = parseInt(category_id)
    }

    if (status) {
      where.status = status
    }

    if (date_from || date_to) {
      where.date = {}
      if (date_from) {
        where.date.gte = new Date(date_from)
      }
      if (date_to) {
        where.date.lte = new Date(date_to)
      }
    }

    const [expenses, total] = await Promise.all([
      prisma.expenses.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { date: "desc" },
        include: {
          category: { select: { name: true } },
          createdBy: { select: { name: true } }
        }
      }),
      prisma.expenses.count({ where })
    ])

    return NextResponse.json({
      data: expenses,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('GET expenses error:', error)
    return NextResponse.json(
      { error: "Failed to fetch expenses" },
      { status: 500 }
    )
  }
}

/**
 * POST - Create a new expense
 * Validates required fields and creates expense record
 */
export async function POST(request: NextRequest): Promise<NextResponse<Expense | ApiResponse>> {
  try {
    const body = await request.json()
    const {
      reference,
      category_id,
      amount,
      date,
      description,
      attachment,
      status = 'pending',
      created_by
    } = body

    // Validation
    if (!category_id || !amount || !date) {
      return NextResponse.json(
        { error: "Category ID, amount, and date are required" },
        { status: 400 }
      )
    }

    // Generate reference if not provided
    let expenseReference = reference
    if (!expenseReference) {
      expenseReference = `EXP-${Date.now()}`
    }

    // Check if reference already exists
    const existingExpense = await prisma.expenses.findFirst({
      where: { reference: expenseReference }
    })

    if (existingExpense) {
      return NextResponse.json(
        { error: "Expense reference already exists" },
        { status: 400 }
      )
    }

    // Validate category exists
    const categoryExists = await prisma.expense_categories.findUnique({
      where: { id: category_id }
    })

    if (!categoryExists) {
      return NextResponse.json(
        { error: "Expense category not found" },
        { status: 400 }
      )
    }

    const newExpense = await prisma.expenses.create({
      data: {
        reference: expenseReference,
        category_id,
        amount: parseFloat(amount),
        date: new Date(date),
        description,
        attachment,
        status,
        created_by: created_by || 1
      },
      include: {
        category: { select: { name: true } },
        createdBy: { select: { name: true } }
      }
    })

    return NextResponse.json(newExpense, { status: 201 })
  } catch (error) {
    console.error('POST expenses error:', error)
    return NextResponse.json(
      { error: "Failed to create expense" },
      { status: 500 }
    )
  }
}

/**
 * PUT - Update an existing expense
 * Replaces all expense data
 */
export async function PUT(request: NextRequest): Promise<NextResponse<Expense | ApiResponse>> {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: "Expense ID is required" },
        { status: 400 }
      )
    }

    const body = await request.json()
    const {
      category_id,
      amount,
      date,
      description,
      attachment,
      status
    } = body

    // Validation
    if (!category_id || !amount || !date) {
      return NextResponse.json(
        { error: "Category ID, amount, and date are required" },
        { status: 400 }
      )
    }

    // Check if expense exists
    const existingExpense = await prisma.expenses.findUnique({
      where: { id: parseInt(id) }
    })

    if (!existingExpense) {
      return NextResponse.json(
        { error: "Expense not found" },
        { status: 404 }
      )
    }

    // Validate category exists
    const categoryExists = await prisma.expense_categories.findUnique({
      where: { id: category_id }
    })

    if (!categoryExists) {
      return NextResponse.json(
        { error: "Expense category not found" },
        { status: 400 }
      )
    }

    const updatedExpense = await prisma.expenses.update({
      where: { id: parseInt(id) },
      data: {
        category_id,
        amount: parseFloat(amount),
        date: new Date(date),
        description,
        attachment,
        status: status || existingExpense.status,
        updated_at: new Date()
      },
      include: {
        category: { select: { name: true } },
        createdBy: { select: { name: true } }
      }
    })

    return NextResponse.json(updatedExpense)
  } catch (error) {
    console.error('PUT expenses error:', error)
    return NextResponse.json(
      { error: "Failed to update expense" },
      { status: 500 }
    )
  }
}

/**
 * PATCH - Partial update of expense fields
 * Updates only provided fields
 */
export async function PATCH(request: NextRequest): Promise<NextResponse<Expense | ApiResponse>> {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: "Expense ID is required" },
        { status: 400 }
      )
    }

    const body = await request.json()

    // Check if expense exists
    const existingExpense = await prisma.expenses.findUnique({
      where: { id: parseInt(id) }
    })

    if (!existingExpense) {
      return NextResponse.json(
        { error: "Expense not found" },
        { status: 404 }
      )
    }

    // If category_id is being updated, validate it exists
    if (body.category_id) {
      const categoryExists = await prisma.expense_categories.findUnique({
        where: { id: body.category_id }
      })

      if (!categoryExists) {
        return NextResponse.json(
          { error: "Expense category not found" },
          { status: 400 }
        )
      }
    }

    // Convert amount to float if provided
    if (body.amount !== undefined) {
      body.amount = parseFloat(body.amount)
    }

    // Convert date if provided
    if (body.date) {
      body.date = new Date(body.date)
    }

    const updatedExpense = await prisma.expenses.update({
      where: { id: parseInt(id) },
      data: {
        ...body,
        updated_at: new Date()
      },
      include: {
        category: { select: { name: true } },
        createdBy: { select: { name: true } }
      }
    })

    return NextResponse.json(updatedExpense)
  } catch (error) {
    console.error('PATCH expenses error:', error)
    return NextResponse.json(
      { error: "Failed to update expense" },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Remove an expense
 * Simple deletion with existence check
 */
export async function DELETE(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "Expense ID is required" },
        { status: 400 }
      )
    }

    // Check if expense exists
    const existingExpense = await prisma.expenses.findUnique({
      where: { id: parseInt(id) }
    })

    if (!existingExpense) {
      return NextResponse.json(
        { error: "Expense not found" },
        { status: 404 }
      )
    }

    // Check if expense is approved/processed - may want to prevent deletion
    if (existingExpense.status === 'approved') {
      return NextResponse.json(
        { error: "Cannot delete approved expenses" },
        { status: 400 }
      )
    }

    await prisma.expenses.delete({ where: { id: parseInt(id) } })

    return NextResponse.json({
      message: "Expense deleted successfully",
      success: true
    })
  } catch (error) {
    console.error('DELETE expenses error:', error)
    return NextResponse.json(
      { error: "Failed to delete expense" },
      { status: 500 }
    )
  }
}