import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import type {
  Customer,
  CreateCustomerInput,
  UpdateCustomerInput,
  PaginatedResponse,
  ApiResponse,
  SearchParams
} from "@/lib/types/prisma"

/**
 * GET - Retrieve customers with pagination and search
 * Supports both list view and single customer retrieval by ID
 */
export async function GET(req: NextRequest): Promise<NextResponse<Customer | PaginatedResponse<Customer> | ApiResponse>> {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search") || ""
    const offset = (page - 1) * limit

    // Get single customer by ID
    if (id) {
      const customer = await prisma.customers.findUnique({
        where: { id: parseInt(id) },
        include: {
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
          quotations: {
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

      if (!customer) {
        return NextResponse.json(
          { error: "Customer not found" },
          { status: 404 }
        )
      }

      return NextResponse.json(customer)
    }

    // Get list of customers with pagination and search
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

    const [customers, total] = await Promise.all([
      prisma.customers.findMany({
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
          credit_limit: true,
          total_sales: true,
          total_paid: true,
          total_due: true,
          status: true,
          created_at: true,
          updated_at: true,
        },
      }),
      prisma.customers.count({ where }),
    ])

    return NextResponse.json({
      data: customers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('GET customers error:', error)
    return NextResponse.json(
      { error: "Failed to fetch customers" },
      { status: 500 }
    )
  }
}

/**
 * POST - Create a new customer
 * Validates required fields and creates customer record
 */
export async function POST(request: NextRequest): Promise<NextResponse<Customer | ApiResponse>> {
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
      credit_limit,
      status = 'active'
    } = body

    // Validation
    if (!name) {
      return NextResponse.json(
        { error: "Customer name is required" },
        { status: 400 }
      )
    }

    // Check if email already exists (if provided)
    if (email) {
      const existingCustomer = await prisma.customers.findFirst({
        where: { email }
      })

      if (existingCustomer) {
        return NextResponse.json(
          { error: "Customer with this email already exists" },
          { status: 400 }
        )
      }
    }

    const newCustomer = await prisma.customers.create({
      data: {
        name,
        email,
        phone,
        address,
        city,
        country,
        tax_number,
        credit_limit: credit_limit ? parseFloat(credit_limit) : 0,
        status,
      },
    })

    return NextResponse.json(newCustomer, { status: 201 })
  } catch (error) {
    console.error('POST customers error:', error)
    return NextResponse.json(
      { error: "Failed to create customer" },
      { status: 500 }
    )
  }
}

/**
 * PUT - Update an existing customer
 * Replaces all customer data
 */
export async function PUT(request: NextRequest): Promise<NextResponse<Customer | ApiResponse>> {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: "Customer ID is required" },
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
      credit_limit,
      status
    } = body

    // Validation
    if (!name) {
      return NextResponse.json(
        { error: "Customer name is required" },
        { status: 400 }
      )
    }

    // Check if customer exists
    const existingCustomer = await prisma.customers.findUnique({
      where: { id: parseInt(id) }
    })

    if (!existingCustomer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      )
    }

    // Check if email is being changed and if it already exists
    if (email && email !== existingCustomer.email) {
      const duplicateEmail = await prisma.customers.findFirst({
        where: { email }
      })

      if (duplicateEmail) {
        return NextResponse.json(
          { error: "Customer with this email already exists" },
          { status: 400 }
        )
      }
    }

    const updatedCustomer = await prisma.customers.update({
      where: { id: parseInt(id) },
      data: {
        name,
        email,
        phone,
        address,
        city,
        country,
        tax_number,
        credit_limit: credit_limit ? parseFloat(credit_limit) : existingCustomer.credit_limit,
        status: status || existingCustomer.status,
        updated_at: new Date(),
      },
    })

    return NextResponse.json(updatedCustomer)
  } catch (error) {
    console.error('PUT customers error:', error)
    return NextResponse.json(
      { error: "Failed to update customer" },
      { status: 500 }
    )
  }
}

/**
 * PATCH - Partial update of customer fields
 * Updates only provided fields
 */
export async function PATCH(request: NextRequest): Promise<NextResponse<Customer | ApiResponse>> {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: "Customer ID is required" },
        { status: 400 }
      )
    }

    const body = await request.json()

    // Check if customer exists
    const existingCustomer = await prisma.customers.findUnique({
      where: { id: parseInt(id) }
    })

    if (!existingCustomer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      )
    }

    // Check email uniqueness if being updated
    if (body.email && body.email !== existingCustomer.email) {
      const duplicateEmail = await prisma.customers.findFirst({
        where: { email: body.email }
      })

      if (duplicateEmail) {
        return NextResponse.json(
          { error: "Customer with this email already exists" },
          { status: 400 }
        )
      }
    }

    // Convert credit_limit to float if provided
    if (body.credit_limit !== undefined) {
      body.credit_limit = parseFloat(body.credit_limit)
    }

    const updatedCustomer = await prisma.customers.update({
      where: { id: parseInt(id) },
      data: {
        ...body,
        updated_at: new Date(),
      },
    })

    return NextResponse.json(updatedCustomer)
  } catch (error) {
    console.error('PATCH customers error:', error)
    return NextResponse.json(
      { error: "Failed to update customer" },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Remove a customer
 * Checks for associated records before deletion
 */
export async function DELETE(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "Customer ID is required" },
        { status: 400 }
      )
    }

    // Check if customer exists
    const existingCustomer = await prisma.customers.findUnique({
      where: { id: parseInt(id) },
      include: {
        sales: { select: { id: true } },
        quotations: { select: { id: true } },
        sales_returns: { select: { id: true } }
      }
    })

    if (!existingCustomer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      )
    }

    // Check for associated records
    const hasAssociatedRecords =
      existingCustomer.sales.length > 0 ||
      existingCustomer.quotations.length > 0 ||
      existingCustomer.sales_returns.length > 0

    if (hasAssociatedRecords) {
      return NextResponse.json(
        { error: "Cannot delete customer with associated sales, quotations, or returns" },
        { status: 400 }
      )
    }

    await prisma.customers.delete({ where: { id: parseInt(id) } })

    return NextResponse.json({
      message: "Customer deleted successfully",
      success: true
    })
  } catch (error) {
    console.error('DELETE customers error:', error)
    return NextResponse.json(
      { error: "Failed to delete customer" },
      { status: 500 }
    )
  }
}