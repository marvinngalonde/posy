import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { saveUploadedFile, deleteUploadedFile } from "@/lib/utils/file-upload"
import type {
  Product,
  ProductBasic,
  PaginatedResponse,
  ApiResponse,
  ProductSearchParams
} from "@/lib/types/prisma"

/**
 * GET - Retrieve products with pagination and search
 * Supports both list view and single product retrieval by ID
 */
export async function GET(req: NextRequest): Promise<NextResponse<Product | PaginatedResponse<Product> | ApiResponse>> {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search") || ""
    const category_id = searchParams.get("category_id")
    const brand_id = searchParams.get("brand_id")
    const warehouse_id = searchParams.get("warehouse_id")
    const status = searchParams.get("status")
    const low_stock = searchParams.get("low_stock") === "true"
    const offset = (page - 1) * limit

    // Get single product by ID
    if (id) {
      const product = await prisma.products.findUnique({
        where: { id: parseInt(id) },
        include: {
          category: { select: { id: true, name: true, code: true } },
          brand: { select: { id: true, name: true } },
          unit: { select: { id: true, name: true, short_name: true } },
          warehouse: { select: { id: true, name: true } },
          adjustment_items: {
            select: {
              id: true,
              quantity: true,
              type: true,
              created_at: true,
              adjustment: {
                select: {
                  reference: true,
                  date: true
                }
              }
            },
            orderBy: { created_at: 'desc' },
            take: 10
          },
          sale_items: {
            select: {
              id: true,
              quantity: true,
              unit_price: true,
              created_at: true,
              sale: {
                select: {
                  reference: true,
                  date: true
                }
              }
            },
            orderBy: { created_at: 'desc' },
            take: 10
          }
        },
      })

      if (!product) {
        return NextResponse.json(
          { error: "Product not found" },
          { status: 404 }
        )
      }

      return NextResponse.json(product)
    }

    // Build where clause for filtering
    const where: any = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (category_id) {
      where.category_id = parseInt(category_id)
    }

    if (brand_id) {
      where.brand_id = parseInt(brand_id)
    }

    if (warehouse_id) {
      where.warehouse_id = parseInt(warehouse_id)
    }

    if (status) {
      where.status = status
    }

    if (low_stock) {
      where.stock = { lte: prisma.products.fields.alert_quantity }
    }

    const [products, total] = await Promise.all([
      prisma.products.findMany({
        where,
        skip: offset,
        take: limit,
        include: {
          categories: { select: { id: true, name: true, code: true } },
          brands: { select: { id: true, name: true } },
          units: { select: { id: true, name: true, short_name: true } },
          warehouses: { select: { id: true, name: true } },
        },
        orderBy: { name: 'asc' }
      }),
      prisma.products.count({ where }),
    ])

    return NextResponse.json({
      data: products,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('GET products error:', error)
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    )
  }
}

/**
 * POST - Create a new product
 * Validates required fields and creates product record
 */
export async function POST(request: NextRequest): Promise<NextResponse<Product | ApiResponse>> {
  try {
    const contentType = request.headers.get('content-type') || ''

    let body: any = {}

    if (contentType.includes('multipart/form-data')) {
      // Handle FormData (with potential file uploads)
      const formData = await request.formData()

      // Convert FormData to regular object
      for (const [key, value] of formData.entries()) {
        if (value instanceof File && value.size > 0) {
          // Handle file upload - save to uploads directory
          const uploadResult = await saveUploadedFile(value, 'products')
          if (uploadResult.success && uploadResult.publicUrl) {
            body[key] = uploadResult.publicUrl
          } else {
            return NextResponse.json(
              { error: `File upload failed: ${uploadResult.error}` },
              { status: 400 }
            )
          }
        } else {
          body[key] = value
        }
      }
    } else {
      // Handle JSON request
      try {
        body = await request.json()
      } catch (jsonError) {
        return NextResponse.json(
          { error: "Invalid request format", details: "Expected JSON or FormData" },
          { status: 400 }
        )
      }
    }

    const {
      name,
      code,
      barcode,
      category_id,
      brand_id,
      unit_id,
      warehouse_id,
      cost,
      price,
      stock,
      alert_quantity,
      description,
      image,
      status = 'active'
    } = body

    // Convert and validate numeric fields from FormData strings
    const parsedCategoryId = category_id ? parseInt(category_id.toString()) : null
    const parsedBrandId = brand_id ? parseInt(brand_id.toString()) : null
    const parsedUnitId = unit_id ? parseInt(unit_id.toString()) : null
    const parsedWarehouseId = warehouse_id ? parseInt(warehouse_id.toString()) : null

    // Validation
    if (!name || !code || !parsedCategoryId || !parsedBrandId || !parsedUnitId || !parsedWarehouseId) {
      return NextResponse.json(
        { error: "Name, code, category, brand, unit, and warehouse are required" },
        { status: 400 }
      )
    }

    // Validate that numeric conversions worked
    if (isNaN(parsedCategoryId) || isNaN(parsedBrandId) || isNaN(parsedUnitId) || isNaN(parsedWarehouseId)) {
      return NextResponse.json(
        { error: "Category, brand, unit, and warehouse must be valid numbers" },
        { status: 400 }
      )
    }

    // Check if code already exists
    const existingProduct = await prisma.products.findUnique({
      where: { code }
    })

    if (existingProduct) {
      return NextResponse.json(
        { error: "Product code already exists" },
        { status: 400 }
      )
    }

    // Check if barcode exists (if provided)
    if (barcode) {
      const existingBarcode = await prisma.products.findFirst({
        where: { barcode }
      })

      if (existingBarcode) {
        return NextResponse.json(
          { error: "Product barcode already exists" },
          { status: 400 }
        )
      }
    }

    const newProduct = await prisma.products.create({
      data: {
        name,
        code,
        barcode: barcode || null,
        category_id: parsedCategoryId,
        brand_id: parsedBrandId,
        unit_id: parsedUnitId,
        warehouse_id: parsedWarehouseId,
        cost: cost ? parseFloat(cost.toString()) : 0,
        price: price ? parseFloat(price.toString()) : 0,
        stock: stock ? parseFloat(stock.toString()) : 0,
        alert_quantity: alert_quantity ? parseFloat(alert_quantity.toString()) : 0,
        description: description || null,
        image: image || null,
        status: status || 'active',
      },
      include: {
        categories: { select: { id: true, name: true, code: true } },
        brands: { select: { id: true, name: true } },
        units: { select: { id: true, name: true, short_name: true } },
        warehouses: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json(newProduct, { status: 201 })
  } catch (error) {
    console.error('POST products error:', error)
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    )
  }
}

/**
 * PUT - Update an existing product
 * Replaces all product data
 */
export async function PUT(request: NextRequest): Promise<NextResponse<Product | ApiResponse>> {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      )
    }

    const contentType = request.headers.get('content-type') || ''
    let body: any = {}

    if (contentType.includes('multipart/form-data')) {
      // Handle FormData (with potential file uploads)
      const formData = await request.formData()

      for (const [key, value] of formData.entries()) {
        if (value instanceof File && value.size > 0) {
          const uploadResult = await saveUploadedFile(value, 'products')
          if (uploadResult.success && uploadResult.publicUrl) {
            body[key] = uploadResult.publicUrl
          } else {
            return NextResponse.json(
              { error: `File upload failed: ${uploadResult.error}` },
              { status: 400 }
            )
          }
        } else {
          body[key] = value
        }
      }
    } else {
      body = await request.json()
    }
    const {
      name,
      code,
      barcode,
      category_id,
      brand_id,
      unit_id,
      warehouse_id,
      cost,
      price,
      stock,
      alert_quantity,
      description,
      image,
      status
    } = body

    // Check if product exists
    const existingProduct = await prisma.products.findUnique({
      where: { id: parseInt(id) }
    })

    if (!existingProduct) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      )
    }

    // Check if code is being changed and if it already exists
    if (code && code !== existingProduct.code) {
      const duplicateCode = await prisma.products.findUnique({
        where: { code }
      })

      if (duplicateCode) {
        return NextResponse.json(
          { error: "Product code already exists" },
          { status: 400 }
        )
      }
    }

    // Check if barcode is being changed and if it already exists
    if (barcode && barcode !== existingProduct.barcode) {
      const duplicateBarcode = await prisma.products.findFirst({
        where: { barcode }
      })

      if (duplicateBarcode) {
        return NextResponse.json(
          { error: "Product barcode already exists" },
          { status: 400 }
        )
      }
    }

    // If new image was uploaded, delete the old one
    if (body.image && existingProduct.image && body.image !== existingProduct.image) {
      await deleteUploadedFile(existingProduct.image)
    }

    const updatedProduct = await prisma.products.update({
      where: { id: parseInt(id) },
      data: {
        name: name || existingProduct.name,
        code: code || existingProduct.code,
        barcode: barcode !== undefined ? barcode : existingProduct.barcode,
        category_id: category_id ? parseInt(category_id) : existingProduct.category_id,
        brand_id: brand_id ? parseInt(brand_id) : existingProduct.brand_id,
        unit_id: unit_id ? parseInt(unit_id) : existingProduct.unit_id,
        warehouse_id: warehouse_id ? parseInt(warehouse_id) : existingProduct.warehouse_id,
        cost: cost !== undefined ? parseFloat(cost) : existingProduct.cost,
        price: price !== undefined ? parseFloat(price) : existingProduct.price,
        stock: stock !== undefined ? parseFloat(stock) : existingProduct.stock,
        alert_quantity: alert_quantity !== undefined ? parseFloat(alert_quantity) : existingProduct.alert_quantity,
        description: description !== undefined ? description : existingProduct.description,
        image: image !== undefined ? image : existingProduct.image,
        status: status || existingProduct.status,
        updated_at: new Date(),
      },
      include: {
        categories: { select: { id: true, name: true, code: true } },
        brands: { select: { id: true, name: true } },
        units: { select: { id: true, name: true, short_name: true } },
        warehouses: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json(updatedProduct)
  } catch (error) {
    console.error('PUT products error:', error)
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    )
  }
}

/**
 * PATCH - Partial update of product fields
 * Updates only provided fields
 */
export async function PATCH(request: NextRequest): Promise<NextResponse<Product | ApiResponse>> {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      )
    }

    const contentType = request.headers.get('content-type') || ''
    let body: any = {}

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()

      for (const [key, value] of formData.entries()) {
        if (value instanceof File && value.size > 0) {
          const uploadResult = await saveUploadedFile(value, 'products')
          if (uploadResult.success && uploadResult.publicUrl) {
            body[key] = uploadResult.publicUrl
          } else {
            return NextResponse.json(
              { error: `File upload failed: ${uploadResult.error}` },
              { status: 400 }
            )
          }
        } else {
          body[key] = value
        }
      }
    } else {
      body = await request.json()
    }

    // Check if product exists
    const existingProduct = await prisma.products.findUnique({
      where: { id: parseInt(id) }
    })

    if (!existingProduct) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      )
    }

    // Check code uniqueness if being updated
    if (body.code && body.code !== existingProduct.code) {
      const duplicateCode = await prisma.products.findUnique({
        where: { code: body.code }
      })

      if (duplicateCode) {
        return NextResponse.json(
          { error: "Product code already exists" },
          { status: 400 }
        )
      }
    }

    // Check barcode uniqueness if being updated
    if (body.barcode && body.barcode !== existingProduct.barcode) {
      const duplicateBarcode = await prisma.products.findFirst({
        where: { barcode: body.barcode }
      })

      if (duplicateBarcode) {
        return NextResponse.json(
          { error: "Product barcode already exists" },
          { status: 400 }
        )
      }
    }

    // Convert numeric fields
    if (body.category_id !== undefined) body.category_id = parseInt(body.category_id)
    if (body.brand_id !== undefined) body.brand_id = parseInt(body.brand_id)
    if (body.unit_id !== undefined) body.unit_id = parseInt(body.unit_id)
    if (body.warehouse_id !== undefined) body.warehouse_id = parseInt(body.warehouse_id)
    if (body.cost !== undefined) body.cost = parseFloat(body.cost)
    if (body.price !== undefined) body.price = parseFloat(body.price)
    if (body.stock !== undefined) body.stock = parseFloat(body.stock)
    if (body.alert_quantity !== undefined) body.alert_quantity = parseFloat(body.alert_quantity)

    // If new image was uploaded, delete the old one
    if (body.image && existingProduct.image && body.image !== existingProduct.image) {
      await deleteUploadedFile(existingProduct.image)
    }

    const updatedProduct = await prisma.products.update({
      where: { id: parseInt(id) },
      data: {
        ...body,
        updated_at: new Date(),
      },
      include: {
        categories: { select: { id: true, name: true, code: true } },
        brands: { select: { id: true, name: true } },
        units: { select: { id: true, name: true, short_name: true } },
        warehouses: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json(updatedProduct)
  } catch (error) {
    console.error('PATCH products error:', error)
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Remove a product
 * Checks for associated records before deletion
 */
export async function DELETE(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      )
    }

    // Check if product exists
    const existingProduct = await prisma.products.findUnique({
      where: { id: parseInt(id) },
      include: {
        adjustment_items: { select: { id: true } },
        purchase_items: { select: { id: true } },
        sale_items: { select: { id: true } },
        transfer_items: { select: { id: true } },
        quotation_items: { select: { id: true } }
      }
    })

    if (!existingProduct) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      )
    }

    // Check for associated records
    const hasAssociatedRecords =
      existingProduct.adjustment_items.length > 0 ||
      existingProduct.purchase_items.length > 0 ||
      existingProduct.sale_items.length > 0 ||
      existingProduct.transfer_items.length > 0 ||
      existingProduct.quotation_items.length > 0

    if (hasAssociatedRecords) {
      return NextResponse.json(
        { error: "Cannot delete product with associated transactions" },
        { status: 400 }
      )
    }

    // Delete uploaded image file if exists
    if (existingProduct.image) {
      await deleteUploadedFile(existingProduct.image)
    }

    await prisma.products.delete({ where: { id: parseInt(id) } })

    return NextResponse.json({
      message: "Product deleted successfully",
      success: true
    })
  } catch (error) {
    console.error('DELETE products error:', error)
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    )
  }
}