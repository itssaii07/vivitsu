import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import dotenv from 'dotenv'
import fs from 'fs'

dotenv.config()

async function main() {
    try {
        console.log('Initializing PrismaClient with PG Adapter...')

        // Create connection pool
        const pool = new Pool({ connectionString: process.env.DATABASE_URL })
        const adapter = new PrismaPg(pool)
        const prisma = new PrismaClient({ adapter })

        const userId = '85ccb92e-fec9-4bd2-9620-0fbe0a11dd04'

        // Test 1: Check if model exists on client
        // @ts-ignore
        if (!prisma.noteCollaborator) {
            console.error('ERROR: prisma.noteCollaborator is undefined!')
            fs.writeFileSync('debug-result.txt', 'ERROR: prisma.noteCollaborator is undefined!')
        } else {
            console.log('SUCCESS: prisma.noteCollaborator exists.')
            fs.writeFileSync('debug-result.txt', 'SUCCESS: prisma.noteCollaborator exists.')
        }

        // Test 2: Try the Query from /api/notes
        console.log('Testing GET notes query...')
        const notes = await prisma.note.findMany({
            where: {
                OR: [
                    { userId },
                    {
                        collaborators: {
                            some: {
                                userId: userId
                            }
                        }
                    }
                ]
            },
            include: {
                collaborators: true
            },
            take: 1
        })
        console.log('SUCCESS: Fetched notes:', notes.length)
        fs.appendFileSync('debug-result.txt', '\nSUCCESS: Fetched notes: ' + notes.length)

        await prisma.$disconnect()
    } catch (e: any) {
        console.error('FAILURE:', e)
        fs.writeFileSync('debug-error.log', JSON.stringify(e, null, 2) + '\n' + e.message + '\n' + e.stack)
    }
}

main().catch(e => {
    console.error('Unhandled:', e)
    fs.writeFileSync('debug-fatal.log', String(e))
})
