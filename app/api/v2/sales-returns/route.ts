import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  // ...existing code for parsing request...
  // For brevity, only the main Prisma logic is shown
  // You can add strict typing and error handling as needed
}
