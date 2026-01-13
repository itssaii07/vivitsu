
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import 'dotenv/config'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
    console.log('--- USERS ---')
    const users = await prisma.user.findMany()
    users.forEach(u => console.log(`User: ${u.name} | ID: ${u.id} | Email: ${u.email}`))

    console.log('\n--- ROOMS ---')
    const rooms = await prisma.room.findMany({
        include: { createdBy: true }
    })
    rooms.forEach(r => console.log(`Room: ${r.name} | ID: ${r.id} | Creator: ${r.createdBy?.name} (${r.createdById})`))
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
