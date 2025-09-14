import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from '@prisma/client' // Adjust import if your Prisma client is elsewhere
import bcrypt from "bcryptjs"

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    // Find user by email using Prisma
    const user = await prisma.users.findUnique({
      where: { email },
      select: { id: true, name: true, email: true, password: true, role: true }
    });
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }
    // Remove password before sending user object
    const { password: _, ...userSafe } = user;
    return NextResponse.json({
      user: userSafe,
      token: "mock-jwt-token", // Replace with real JWT in production
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}