import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"
import * as jwt from "jsonwebtoken"

const prisma = new PrismaClient()

// Helper function to verify JWT token
const verifyToken = (request: NextRequest) => {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  
  const token = authHeader.substring(7)
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any
    return decoded
  } catch (error) {
    return null
  }
}

// Helper function to check if user is admin
const isAdmin = (user: any) => {
  return user && user.role === 'admin'
}

// POST - Create new user (Signup)
export async function POST(req: NextRequest) {
  try {
    const { name, email, password, role = 'user' } = await req.json()
    
    if (!name || !email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if email is already registered
    const existing = await prisma.users.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const user = await prisma.users.create({
      data: { 
        name, 
        email, 
        password: hashedPassword,
        role: role === 'admin' || role === 'manager' ? role : 'user' // Ensure valid role
      },
      select: { id: true, name: true, email: true, role: true, status: true, created_at: true },
    })

    return NextResponse.json({ 
      message: "User created successfully",
      user 
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// GET - Get all users or single user by ID
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('id')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role')
    const status = searchParams.get('status')

    // Get single user by ID
    if (userId) {
      const user = await prisma.users.findUnique({
        where: { id: userId },
        select: { 
          id: true, 
          name: true, 
          email: true, 
          role: true, 
          status: true,
          avatar: true,
          created_at: true,
          updated_at: true
        }
      })

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }

      return NextResponse.json(user)
    }

    // Build where clause for filtering
    const where: any = {}
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (role) {
      where.role = role
    }

    if (status) {
      where.status = status
    }

    // Get paginated users
    const skip = (page - 1) * limit
    const [users, total] = await Promise.all([
      prisma.users.findMany({
        where,
        select: { 
          id: true, 
          name: true, 
          email: true, 
          role: true, 
          status: true,
          avatar: true,
          created_at: true,
          updated_at: true
        },
        skip,
        take: limit,
        orderBy: { created_at: 'desc' }
      }),
      prisma.users.count({ where })
    ])

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT - Update user
export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('id')
    
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const { name, email, role, status, avatar, password } = await req.json()
    
    // Verify token and get current user
    const currentUser = verifyToken(req)
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user exists
    const existingUser = await prisma.users.findUnique({
      where: { id: userId }
    })

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check permissions - users can only update themselves unless they're admin
    if (currentUser.userId !== userId && !isAdmin(currentUser)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // If email is being changed, check if it's already taken
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.users.findUnique({
        where: { email }
      })
      if (emailExists) {
        return NextResponse.json({ error: "Email already in use" }, { status: 400 })
      }
    }

    // Prepare update data
    const updateData: any = {}
    if (name) updateData.name = name
    if (email) updateData.email = email
    if (avatar !== undefined) updateData.avatar = avatar

    // Only admins can change role and status
    if (isAdmin(currentUser)) {
      if (role) updateData.role = role
      if (status) updateData.status = status
    }

    // Hash password if provided
    if (password) {
      updateData.password = await bcrypt.hash(password, 10)
    }

    // Update user
    const updatedUser = await prisma.users.update({
      where: { id: userId },
      data: updateData,
      select: { 
        id: true, 
        name: true, 
        email: true, 
        role: true, 
        status: true,
        avatar: true,
        updated_at: true
      }
    })

    return NextResponse.json({
      message: "User updated successfully",
      user: updatedUser
    })

  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE - Delete user
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('id')
    
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Verify token and get current user
    const currentUser = verifyToken(req)
    if (!currentUser || !isAdmin(currentUser)) {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 401 })
    }

    // Check if user exists
    const existingUser = await prisma.users.findUnique({
      where: { id: userId }
    })

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Prevent self-deletion
    if (currentUser.userId === userId) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 })
    }

    // Soft delete by setting status to inactive instead of hard delete
    // This preserves data integrity for related records
    const deletedUser = await prisma.users.update({
      where: { id: userId },
      data: { status: 'inactive' },
      select: { id: true, name: true, email: true }
    })

    // For hard delete, use this instead:
    // await prisma.users.delete({ where: { id: userId } })

    return NextResponse.json({
      message: "User deactivated successfully",
      user: deletedUser
    })

  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH - Partial update (for status changes, etc.)
export async function PATCH(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('id')
    
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const updates = await req.json()
    
    // Verify token and get current user
    const currentUser = verifyToken(req)
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check permissions
    if (currentUser.userId !== userId && !isAdmin(currentUser)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Check if user exists
    const existingUser = await prisma.users.findUnique({
      where: { id: userId }
    })

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Filter allowed updates based on user role
    const allowedUpdates: any = {}
    
    // Self-updates allowed for all users
    if (currentUser.userId === userId) {
      if (updates.name) allowedUpdates.name = updates.name
      if (updates.avatar !== undefined) allowedUpdates.avatar = updates.avatar
      if (updates.password) {
        allowedUpdates.password = await bcrypt.hash(updates.password, 10)
      }
    }

    // Admin-only updates
    if (isAdmin(currentUser)) {
      if (updates.role) allowedUpdates.role = updates.role
      if (updates.status) allowedUpdates.status = updates.status
      if (updates.email) allowedUpdates.email = updates.email
    }

    if (Object.keys(allowedUpdates).length === 0) {
      return NextResponse.json({ error: "No valid updates provided" }, { status: 400 })
    }

    // Update user
    const updatedUser = await prisma.users.update({
      where: { id: userId },
      data: allowedUpdates,
      select: { 
        id: true, 
        name: true, 
        email: true, 
        role: true, 
        status: true,
        avatar: true,
        updated_at: true
      }
    })

    return NextResponse.json({
      message: "User updated successfully",
      user: updatedUser
    })

  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}