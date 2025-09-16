import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import type {
  PaginatedResponse,
  ApiResponse,
} from "@/lib/types/prisma"

// Currency type (we'll need to define this if it doesn't exist in types)
type Currency = {
  id: number
  code: string
  name: string
  symbol: string
  exchange_rate: number
  status: 'active' | 'inactive'
  created_at: Date
  updated_at: Date
}

/**
 * GET - Retrieve currencies with pagination and search
 * Supports both list view and single currency retrieval by ID
 */
export async function GET(req: NextRequest): Promise<NextResponse<Currency | PaginatedResponse<Currency> | ApiResponse>> {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status") as 'active' | 'inactive' | null
    const offset = (page - 1) * limit

    // Get single currency by ID
    if (id) {
      const currency = await prisma.currencies.findUnique({
        where: { id: parseInt(id) }
      })

      if (!currency) {
        return NextResponse.json(
          { error: "Currency not found" },
          { status: 404 }
        )
      }

      return NextResponse.json(currency)
    }

    // Build where clause for filtering
    const where: any = {}

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' as const } },
        { name: { contains: search, mode: 'insensitive' as const } },
        { symbol: { contains: search, mode: 'insensitive' as const } },
      ]
    }

    if (status) {
      where.status = status
    }

    const [currencies, total] = await Promise.all([
      prisma.currencies.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { name: "asc" },
        select: {
          id: true,
          code: true,
          name: true,
          symbol: true,
          exchange_rate: true,
          status: true,
          created_at: true,
          updated_at: true,
        },
      }),
      prisma.currencies.count({ where }),
    ])

    return NextResponse.json({
      data: currencies,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('GET currencies error:', error)
    return NextResponse.json(
      { error: "Failed to fetch currencies" },
      { status: 500 }
    )
  }
}

/**
 * POST - Create a new currency
 * Validates required fields and creates currency record
 */
export async function POST(request: NextRequest): Promise<NextResponse<Currency | ApiResponse>> {
  try {
    const body = await request.json()
    const {
      code,
      name,
      symbol,
      exchange_rate,
      status = 'active'
    } = body

    // Validation
    if (!code?.trim()) {
      return NextResponse.json(
        { error: "Currency code is required" },
        { status: 400 }
      )
    }

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Currency name is required" },
        { status: 400 }
      )
    }

    if (!symbol?.trim()) {
      return NextResponse.json(
        { error: "Currency symbol is required" },
        { status: 400 }
      )
    }

    if (exchange_rate === undefined || exchange_rate === null) {
      return NextResponse.json(
        { error: "Exchange rate is required" },
        { status: 400 }
      )
    }

    const exchangeRateNum = parseFloat(exchange_rate)
    if (isNaN(exchangeRateNum) || exchangeRateNum <= 0) {
      return NextResponse.json(
        { error: "Exchange rate must be a positive number" },
        { status: 400 }
      )
    }

    // Check if currency code already exists
    const existingCode = await prisma.currencies.findFirst({
      where: {
        code: {
          equals: code.trim(),
          mode: 'insensitive'
        }
      }
    })

    if (existingCode) {
      return NextResponse.json(
        { error: "Currency with this code already exists" },
        { status: 400 }
      )
    }

    // Check if currency name already exists
    const existingName = await prisma.currencies.findFirst({
      where: {
        name: {
          equals: name.trim(),
          mode: 'insensitive'
        }
      }
    })

    if (existingName) {
      return NextResponse.json(
        { error: "Currency with this name already exists" },
        { status: 400 }
      )
    }

    const newCurrency = await prisma.currencies.create({
      data: {
        code: code.trim().toUpperCase(),
        name: name.trim(),
        symbol: symbol.trim(),
        exchange_rate: exchangeRateNum,
        status,
      },
    })

    return NextResponse.json(newCurrency, { status: 201 })
  } catch (error) {
    console.error('POST currencies error:', error)
    return NextResponse.json(
      { error: "Failed to create currency" },
      { status: 500 }
    )
  }
}

/**
 * PUT - Update an existing currency
 * Replaces all currency data
 */
export async function PUT(request: NextRequest): Promise<NextResponse<Currency | ApiResponse>> {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: "Currency ID is required" },
        { status: 400 }
      )
    }

    const body = await request.json()
    const {
      code,
      name,
      symbol,
      exchange_rate,
      status
    } = body

    // Validation
    if (!code?.trim()) {
      return NextResponse.json(
        { error: "Currency code is required" },
        { status: 400 }
      )
    }

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Currency name is required" },
        { status: 400 }
      )
    }

    if (!symbol?.trim()) {
      return NextResponse.json(
        { error: "Currency symbol is required" },
        { status: 400 }
      )
    }

    if (exchange_rate === undefined || exchange_rate === null) {
      return NextResponse.json(
        { error: "Exchange rate is required" },
        { status: 400 }
      )
    }

    const exchangeRateNum = parseFloat(exchange_rate)
    if (isNaN(exchangeRateNum) || exchangeRateNum <= 0) {
      return NextResponse.json(
        { error: "Exchange rate must be a positive number" },
        { status: 400 }
      )
    }

    // Check if currency exists
    const existingCurrency = await prisma.currencies.findUnique({
      where: { id: parseInt(id) }
    })

    if (!existingCurrency) {
      return NextResponse.json(
        { error: "Currency not found" },
        { status: 404 }
      )
    }

    // Check if code is being changed and if it already exists
    if (code.trim().toUpperCase() !== existingCurrency.code.toUpperCase()) {
      const duplicateCode = await prisma.currencies.findFirst({
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
          { error: "Currency with this code already exists" },
          { status: 400 }
        )
      }
    }

    // Check if name is being changed and if it already exists
    if (name.trim().toLowerCase() !== existingCurrency.name.toLowerCase()) {
      const duplicateName = await prisma.currencies.findFirst({
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
          { error: "Currency with this name already exists" },
          { status: 400 }
        )
      }
    }

    const updatedCurrency = await prisma.currencies.update({
      where: { id: parseInt(id) },
      data: {
        code: code.trim().toUpperCase(),
        name: name.trim(),
        symbol: symbol.trim(),
        exchange_rate: exchangeRateNum,
        status: status || existingCurrency.status,
        updated_at: new Date(),
      },
    })

    return NextResponse.json(updatedCurrency)
  } catch (error) {
    console.error('PUT currencies error:', error)
    return NextResponse.json(
      { error: "Failed to update currency" },
      { status: 500 }
    )
  }
}

/**
 * PATCH - Partial update of currency fields
 * Updates only provided fields
 */
export async function PATCH(request: NextRequest): Promise<NextResponse<Currency | ApiResponse>> {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: "Currency ID is required" },
        { status: 400 }
      )
    }

    const body = await request.json()

    // Check if currency exists
    const existingCurrency = await prisma.currencies.findUnique({
      where: { id: parseInt(id) }
    })

    if (!existingCurrency) {
      return NextResponse.json(
        { error: "Currency not found" },
        { status: 404 }
      )
    }

    // Validate code if being updated
    if (body.code) {
      if (!body.code.trim()) {
        return NextResponse.json(
          { error: "Currency code cannot be empty" },
          { status: 400 }
        )
      }

      // Check code uniqueness if being updated
      if (body.code.trim().toUpperCase() !== existingCurrency.code.toUpperCase()) {
        const duplicateCode = await prisma.currencies.findFirst({
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
            { error: "Currency with this code already exists" },
            { status: 400 }
          )
        }
      }

      body.code = body.code.trim().toUpperCase()
    }

    // Validate name if being updated
    if (body.name) {
      if (!body.name.trim()) {
        return NextResponse.json(
          { error: "Currency name cannot be empty" },
          { status: 400 }
        )
      }

      // Check name uniqueness if being updated
      if (body.name.trim().toLowerCase() !== existingCurrency.name.toLowerCase()) {
        const duplicateName = await prisma.currencies.findFirst({
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
            { error: "Currency with this name already exists" },
            { status: 400 }
          )
        }
      }

      body.name = body.name.trim()
    }

    // Validate symbol if being updated
    if (body.symbol) {
      if (!body.symbol.trim()) {
        return NextResponse.json(
          { error: "Currency symbol cannot be empty" },
          { status: 400 }
        )
      }

      body.symbol = body.symbol.trim()
    }

    // Validate exchange_rate if being updated
    if (body.exchange_rate !== undefined) {
      const exchangeRateNum = parseFloat(body.exchange_rate)
      if (isNaN(exchangeRateNum) || exchangeRateNum <= 0) {
        return NextResponse.json(
          { error: "Exchange rate must be a positive number" },
          { status: 400 }
        )
      }

      body.exchange_rate = exchangeRateNum
    }

    const updatedCurrency = await prisma.currencies.update({
      where: { id: parseInt(id) },
      data: {
        ...body,
        updated_at: new Date(),
      },
    })

    return NextResponse.json(updatedCurrency)
  } catch (error) {
    console.error('PATCH currencies error:', error)
    return NextResponse.json(
      { error: "Failed to update currency" },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Remove a currency
 * Checks for associated records before deletion
 */
export async function DELETE(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "Currency ID is required" },
        { status: 400 }
      )
    }

    // Check if currency exists
    const existingCurrency = await prisma.currencies.findUnique({
      where: { id: parseInt(id) }
    })

    if (!existingCurrency) {
      return NextResponse.json(
        { error: "Currency not found" },
        { status: 404 }
      )
    }

    // Check for associated records (purchases, sales, etc.)
    // Note: You may need to check additional tables based on your schema
    const hasAssociatedRecords = await prisma.$transaction(async (tx) => {
      const [purchaseCount, saleCount, expenseCount] = await Promise.all([
        tx.purchases?.count?.({ where: { currency_id: parseInt(id) } }) ?? 0,
        tx.sales?.count?.({ where: { currency_id: parseInt(id) } }) ?? 0,
        tx.expenses?.count?.({ where: { currency_id: parseInt(id) } }) ?? 0,
      ])

      return purchaseCount > 0 || saleCount > 0 || expenseCount > 0
    })

    if (hasAssociatedRecords) {
      return NextResponse.json(
        { error: "Cannot delete currency with associated transactions. Please reassign or delete the transactions first." },
        { status: 400 }
      )
    }

    await prisma.currencies.delete({ where: { id: parseInt(id) } })

    return NextResponse.json({
      message: "Currency deleted successfully",
      success: true
    })
  } catch (error) {
    console.error('DELETE currencies error:', error)
    return NextResponse.json(
      { error: "Failed to delete currency" },
      { status: 500 }
    )
  }
}