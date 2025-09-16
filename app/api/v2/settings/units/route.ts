import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import type {
  Unit,
  PaginatedResponse,
  ApiResponse,
} from "@/lib/types/prisma"

/**
 * GET - Retrieve units with pagination and search
 * Supports both list view and single unit retrieval by ID
 */
export async function GET(req: NextRequest): Promise<NextResponse<Unit | PaginatedResponse<Unit> | ApiResponse>> {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status") as 'active' | 'inactive' | null
    const offset = (page - 1) * limit

    // Get single unit by ID
    if (id) {
      const unit = await prisma.units.findUnique({
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
          },
          base_unit_relation: {
            select: {
              id: true,
              name: true,
              short_name: true
            }
          },
          sub_units: {
            select: {
              id: true,
              name: true,
              short_name: true,
              operator: true,
              operation_value: true
            }
          }
        }
      })

      if (!unit) {
        return NextResponse.json(
          { error: "Unit not found" },
          { status: 404 }
        )
      }

      return NextResponse.json(unit)
    }

    // Build where clause for filtering
    const where: any = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' as const } },
        { short_name: { contains: search, mode: 'insensitive' as const } },
      ]
    }

    if (status) {
      where.status = status
    }

    const [units, total] = await Promise.all([
      prisma.units.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          short_name: true,
          base_unit: true,
          operator: true,
          operation_value: true,
          status: true,
          created_at: true,
          updated_at: true,
          base_unit_relation: {
            select: {
              name: true,
              short_name: true
            }
          },
          _count: {
            select: {
              products: true,
              sub_units: true
            }
          }
        },
      }),
      prisma.units.count({ where }),
    ])

    return NextResponse.json({
      data: units,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('GET units error:', error)
    return NextResponse.json(
      { error: "Failed to fetch units" },
      { status: 500 }
    )
  }
}

/**
 * POST - Create a new unit
 * Validates required fields and creates unit record
 */
export async function POST(request: NextRequest): Promise<NextResponse<Unit | ApiResponse>> {
  try {
    const body = await request.json()
    const {
      name,
      short_name,
      base_unit,
      operator,
      operation_value,
      status = 'active'
    } = body

    // Validation
    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Unit name is required" },
        { status: 400 }
      )
    }

    if (!short_name?.trim()) {
      return NextResponse.json(
        { error: "Unit short name is required" },
        { status: 400 }
      )
    }

    if (!operator?.trim()) {
      return NextResponse.json(
        { error: "Unit operator is required" },
        { status: 400 }
      )
    }

    if (!['*', '/', '+', '-'].includes(operator.trim())) {
      return NextResponse.json(
        { error: "Unit operator must be one of: *, /, +, -" },
        { status: 400 }
      )
    }

    if (operation_value === undefined || operation_value === null) {
      return NextResponse.json(
        { error: "Operation value is required" },
        { status: 400 }
      )
    }

    const operationValueNum = parseFloat(operation_value)
    if (isNaN(operationValueNum) || operationValueNum <= 0) {
      return NextResponse.json(
        { error: "Operation value must be a positive number" },
        { status: 400 }
      )
    }

    // Check if unit name already exists
    const existingName = await prisma.units.findFirst({
      where: {
        name: {
          equals: name.trim(),
          mode: 'insensitive'
        }
      }
    })

    if (existingName) {
      return NextResponse.json(
        { error: "Unit with this name already exists" },
        { status: 400 }
      )
    }

    // Check if short name already exists
    const existingShortName = await prisma.units.findFirst({
      where: {
        short_name: {
          equals: short_name.trim(),
          mode: 'insensitive'
        }
      }
    })

    if (existingShortName) {
      return NextResponse.json(
        { error: "Unit with this short name already exists" },
        { status: 400 }
      )
    }

    // Validate base_unit if provided
    if (base_unit && base_unit !== "-") {
      const baseUnitExists = await prisma.units.findUnique({
        where: { id: parseInt(base_unit) }
      })

      if (!baseUnitExists) {
        return NextResponse.json(
          { error: "Base unit not found" },
          { status: 400 }
        )
      }
    }

    const newUnit = await prisma.units.create({
      data: {
        name: name.trim(),
        short_name: short_name.trim(),
        base_unit: base_unit && base_unit !== "-" ? parseInt(base_unit) : null,
        operator: operator.trim(),
        operation_value: operationValueNum,
        status,
      },
    })

    return NextResponse.json(newUnit, { status: 201 })
  } catch (error) {
    console.error('POST units error:', error)
    return NextResponse.json(
      { error: "Failed to create unit" },
      { status: 500 }
    )
  }
}

/**
 * PUT - Update an existing unit
 * Replaces all unit data
 */
export async function PUT(request: NextRequest): Promise<NextResponse<Unit | ApiResponse>> {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: "Unit ID is required" },
        { status: 400 }
      )
    }

    const body = await request.json()
    const {
      name,
      short_name,
      base_unit,
      operator,
      operation_value,
      status
    } = body

    // Validation
    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Unit name is required" },
        { status: 400 }
      )
    }

    if (!short_name?.trim()) {
      return NextResponse.json(
        { error: "Unit short name is required" },
        { status: 400 }
      )
    }

    if (!operator?.trim()) {
      return NextResponse.json(
        { error: "Unit operator is required" },
        { status: 400 }
      )
    }

    if (!['*', '/', '+', '-'].includes(operator.trim())) {
      return NextResponse.json(
        { error: "Unit operator must be one of: *, /, +, -" },
        { status: 400 }
      )
    }

    if (operation_value === undefined || operation_value === null) {
      return NextResponse.json(
        { error: "Operation value is required" },
        { status: 400 }
      )
    }

    const operationValueNum = parseFloat(operation_value)
    if (isNaN(operationValueNum) || operationValueNum <= 0) {
      return NextResponse.json(
        { error: "Operation value must be a positive number" },
        { status: 400 }
      )
    }

    // Check if unit exists
    const existingUnit = await prisma.units.findUnique({
      where: { id: parseInt(id) }
    })

    if (!existingUnit) {
      return NextResponse.json(
        { error: "Unit not found" },
        { status: 404 }
      )
    }

    // Check if name is being changed and if it already exists
    if (name.trim().toLowerCase() !== existingUnit.name.toLowerCase()) {
      const duplicateName = await prisma.units.findFirst({
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
          { error: "Unit with this name already exists" },
          { status: 400 }
        )
      }
    }

    // Check if short name is being changed and if it already exists
    if (short_name.trim().toLowerCase() !== existingUnit.short_name.toLowerCase()) {
      const duplicateShortName = await prisma.units.findFirst({
        where: {
          short_name: {
            equals: short_name.trim(),
            mode: 'insensitive'
          },
          id: { not: parseInt(id) }
        }
      })

      if (duplicateShortName) {
        return NextResponse.json(
          { error: "Unit with this short name already exists" },
          { status: 400 }
        )
      }
    }

    // Validate base_unit if provided
    let baseUnitValue = null
    if (base_unit && base_unit !== "-") {
      const baseUnitExists = await prisma.units.findUnique({
        where: { id: parseInt(base_unit) }
      })

      if (!baseUnitExists) {
        return NextResponse.json(
          { error: "Base unit not found" },
          { status: 400 }
        )
      }

      // Check for circular reference
      if (parseInt(base_unit) === parseInt(id)) {
        return NextResponse.json(
          { error: "Unit cannot be its own base unit" },
          { status: 400 }
        )
      }

      baseUnitValue = parseInt(base_unit)
    }

    const updatedUnit = await prisma.units.update({
      where: { id: parseInt(id) },
      data: {
        name: name.trim(),
        short_name: short_name.trim(),
        base_unit: baseUnitValue,
        operator: operator.trim(),
        operation_value: operationValueNum,
        status: status || existingUnit.status,
        updated_at: new Date(),
      },
    })

    return NextResponse.json(updatedUnit)
  } catch (error) {
    console.error('PUT units error:', error)
    return NextResponse.json(
      { error: "Failed to update unit" },
      { status: 500 }
    )
  }
}

/**
 * PATCH - Partial update of unit fields
 * Updates only provided fields
 */
export async function PATCH(request: NextRequest): Promise<NextResponse<Unit | ApiResponse>> {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: "Unit ID is required" },
        { status: 400 }
      )
    }

    const body = await request.json()

    // Check if unit exists
    const existingUnit = await prisma.units.findUnique({
      where: { id: parseInt(id) }
    })

    if (!existingUnit) {
      return NextResponse.json(
        { error: "Unit not found" },
        { status: 404 }
      )
    }

    // Validate name if being updated
    if (body.name) {
      if (!body.name.trim()) {
        return NextResponse.json(
          { error: "Unit name cannot be empty" },
          { status: 400 }
        )
      }

      // Check name uniqueness if being updated
      if (body.name.trim().toLowerCase() !== existingUnit.name.toLowerCase()) {
        const duplicateName = await prisma.units.findFirst({
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
            { error: "Unit with this name already exists" },
            { status: 400 }
          )
        }
      }

      body.name = body.name.trim()
    }

    // Validate short name if being updated
    if (body.short_name) {
      if (!body.short_name.trim()) {
        return NextResponse.json(
          { error: "Unit short name cannot be empty" },
          { status: 400 }
        )
      }

      // Check short name uniqueness if being updated
      if (body.short_name.trim().toLowerCase() !== existingUnit.short_name.toLowerCase()) {
        const duplicateShortName = await prisma.units.findFirst({
          where: {
            short_name: {
              equals: body.short_name.trim(),
              mode: 'insensitive'
            },
            id: { not: parseInt(id) }
          }
        })

        if (duplicateShortName) {
          return NextResponse.json(
            { error: "Unit with this short name already exists" },
            { status: 400 }
          )
        }
      }

      body.short_name = body.short_name.trim()
    }

    // Validate operator if being updated
    if (body.operator) {
      if (!body.operator.trim()) {
        return NextResponse.json(
          { error: "Unit operator cannot be empty" },
          { status: 400 }
        )
      }

      if (!['*', '/', '+', '-'].includes(body.operator.trim())) {
        return NextResponse.json(
          { error: "Unit operator must be one of: *, /, +, -" },
          { status: 400 }
        )
      }

      body.operator = body.operator.trim()
    }

    // Validate operation_value if being updated
    if (body.operation_value !== undefined) {
      const operationValueNum = parseFloat(body.operation_value)
      if (isNaN(operationValueNum) || operationValueNum <= 0) {
        return NextResponse.json(
          { error: "Operation value must be a positive number" },
          { status: 400 }
        )
      }

      body.operation_value = operationValueNum
    }

    // Validate base_unit if being updated
    if (body.base_unit !== undefined) {
      if (body.base_unit && body.base_unit !== "-") {
        const baseUnitExists = await prisma.units.findUnique({
          where: { id: parseInt(body.base_unit) }
        })

        if (!baseUnitExists) {
          return NextResponse.json(
            { error: "Base unit not found" },
            { status: 400 }
          )
        }

        // Check for circular reference
        if (parseInt(body.base_unit) === parseInt(id)) {
          return NextResponse.json(
            { error: "Unit cannot be its own base unit" },
            { status: 400 }
          )
        }

        body.base_unit = parseInt(body.base_unit)
      } else {
        body.base_unit = null
      }
    }

    const updatedUnit = await prisma.units.update({
      where: { id: parseInt(id) },
      data: {
        ...body,
        updated_at: new Date(),
      },
    })

    return NextResponse.json(updatedUnit)
  } catch (error) {
    console.error('PATCH units error:', error)
    return NextResponse.json(
      { error: "Failed to update unit" },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Remove a unit
 * Checks for associated products and sub-units before deletion
 */
export async function DELETE(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "Unit ID is required" },
        { status: 400 }
      )
    }

    // Check if unit exists
    const existingUnit = await prisma.units.findUnique({
      where: { id: parseInt(id) },
      include: {
        products: { select: { id: true } },
        sub_units: { select: { id: true } }
      }
    })

    if (!existingUnit) {
      return NextResponse.json(
        { error: "Unit not found" },
        { status: 404 }
      )
    }

    // Check for associated products
    if (existingUnit.products.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete unit with associated products. Please reassign or delete the products first." },
        { status: 400 }
      )
    }

    // Check for sub-units
    if (existingUnit.sub_units.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete unit with sub-units. Please reassign or delete the sub-units first." },
        { status: 400 }
      )
    }

    await prisma.units.delete({ where: { id: parseInt(id) } })

    return NextResponse.json({
      message: "Unit deleted successfully",
      success: true
    })
  } catch (error) {
    console.error('DELETE units error:', error)
    return NextResponse.json(
      { error: "Failed to delete unit" },
      { status: 500 }
    )
  }
}