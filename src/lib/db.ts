import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
}

function createPrismaClient() {
    // Create a PostgreSQL connection pool
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
    })

    // Create the Prisma adapter
    const adapter = new PrismaPg(pool)

    // Create the PrismaClient with the adapter
    return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
