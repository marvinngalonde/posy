/**
 * Shared Prisma client instance
 * This prevents multiple Prisma clients being created in development
 */

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * Shared Prisma client instance with proper connection pooling
 * Uses singleton pattern to prevent multiple connections in development
 */
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  errorFormat: 'pretty',
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

/**
 * Helper function to disconnect Prisma on app shutdown
 */
export const disconnectPrisma = async () => {
  await prisma.$disconnect()
}

export default prisma