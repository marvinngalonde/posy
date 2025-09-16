import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import type {
  Organization,
  CreateOrganizationInput,
  UpdateOrganizationInput,
  ApiResponse
} from "@/lib/types/prisma"

/**
 * GET - Retrieve organization details
 * Returns the organization information or creates default if none exists
 */
export async function GET(req: NextRequest): Promise<NextResponse<Organization | ApiResponse>> {
  try {
    // Try to get existing organization (should only be one)
    let organization = await prisma.organization.findFirst()

    // If no organization exists, create a default one
    if (!organization) {
      organization = await prisma.organization.create({
        data: {
          name: "Your Company Name",
          email: "",
          phone: "",
          address: "",
          city: "",
          country: "",
          currency: "USD",
          timezone: "UTC"
        }
      })
    }

    return NextResponse.json(organization)
  } catch (error) {
    console.error('GET organization error:', error)
    return NextResponse.json(
      { error: "Failed to fetch organization details" },
      { status: 500 }
    )
  }
}

/**
 * POST - Create organization (if none exists)
 * Creates the initial organization record
 */
export async function POST(request: NextRequest): Promise<NextResponse<Organization | ApiResponse>> {
  try {
    // Check if organization already exists
    const existingOrganization = await prisma.organization.findFirst()

    if (existingOrganization) {
      return NextResponse.json(
        { error: "Organization already exists. Use PUT to update." },
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
      state,
      country,
      postal_code,
      tax_number,
      website,
      logo,
      bank_name,
      bank_account,
      bank_branch,
      swift_code,
      iban,
      currency = 'USD',
      timezone = 'UTC'
    } = body

    // Validation
    if (!name) {
      return NextResponse.json(
        { error: "Organization name is required" },
        { status: 400 }
      )
    }

    const newOrganization = await prisma.organization.create({
      data: {
        name,
        email,
        phone,
        address,
        city,
        state,
        country,
        postal_code,
        tax_number,
        website,
        logo,
        bank_name,
        bank_account,
        bank_branch,
        swift_code,
        iban,
        currency,
        timezone,
      }
    })

    return NextResponse.json(newOrganization, { status: 201 })
  } catch (error) {
    console.error('POST organization error:', error)
    return NextResponse.json(
      { error: "Failed to create organization" },
      { status: 500 }
    )
  }
}

/**
 * PUT - Update organization details
 * Updates the organization information (there should only be one)
 */
export async function PUT(request: NextRequest): Promise<NextResponse<Organization | ApiResponse>> {
  try {
    const body = await request.json()
    const {
      name,
      email,
      phone,
      address,
      city,
      state,
      country,
      postal_code,
      tax_number,
      website,
      logo,
      bank_name,
      bank_account,
      bank_branch,
      swift_code,
      iban,
      currency,
      timezone
    } = body

    // Validation
    if (!name) {
      return NextResponse.json(
        { error: "Organization name is required" },
        { status: 400 }
      )
    }

    // Get the organization (should only be one)
    const existingOrganization = await prisma.organization.findFirst()

    if (!existingOrganization) {
      return NextResponse.json(
        { error: "Organization not found. Use POST to create." },
        { status: 404 }
      )
    }

    const updatedOrganization = await prisma.organization.update({
      where: { id: existingOrganization.id },
      data: {
        name,
        email,
        phone,
        address,
        city,
        state,
        country,
        postal_code,
        tax_number,
        website,
        logo,
        bank_name,
        bank_account,
        bank_branch,
        swift_code,
        iban,
        currency: currency || existingOrganization.currency,
        timezone: timezone || existingOrganization.timezone,
        updated_at: new Date(),
      }
    })

    return NextResponse.json(updatedOrganization)
  } catch (error) {
    console.error('PUT organization error:', error)
    return NextResponse.json(
      { error: "Failed to update organization" },
      { status: 500 }
    )
  }
}

/**
 * PATCH - Partial update of organization fields
 * Updates only provided fields
 */
export async function PATCH(request: NextRequest): Promise<NextResponse<Organization | ApiResponse>> {
  try {
    const body = await request.json()

    // Get the organization (should only be one)
    const existingOrganization = await prisma.organization.findFirst()

    if (!existingOrganization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      )
    }

    // Validate name if provided
    if (body.name === "") {
      return NextResponse.json(
        { error: "Organization name cannot be empty" },
        { status: 400 }
      )
    }

    // Only allow fields that exist in the actual database table
    const allowedFields = [
      'name', 'email', 'phone', 'address', 'city', 'state', 'country',
      'postal_code', 'tax_number', 'website', 'logo', 'currency', 'timezone',
      'bank_name', 'bank_account', 'bank_branch', 'swift_code', 'iban',
      'currency_symbol', 'date_format', 'fax', 'invoice_footer', 'invoice_prefix',
      'language', 'payment_terms', 'quotation_footer', 'quotation_prefix',
      'registration_number', 'terms_conditions'
    ]

    const updateData: any = {}
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }


    const updatedOrganization = await prisma.organization.update({
      where: { id: existingOrganization.id },
      data: {
        ...updateData,
        updated_at: new Date(),
      }
    })

    return NextResponse.json(updatedOrganization)
  } catch (error) {
    console.error('PATCH organization error:', error)
    return NextResponse.json(
      { error: "Failed to update organization" },
      { status: 500 }
    )
  }
}