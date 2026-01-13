import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
    try {
        const { id, email, name, avatarUrl } = await request.json()

        if (!id || !email) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
        }

        const user = await prisma.user.upsert({
            where: { id },
            update: {
                email,
                name: name || undefined,
                avatarUrl: avatarUrl || undefined
            },
            create: {
                id,
                email,
                name: name || email.split('@')[0],
                avatarUrl
            }
        })

        return NextResponse.json({ user })
    } catch (error) {
        console.error('User sync error:', error)
        return NextResponse.json({ error: 'Sync failed' }, { status: 500 })
    }
}
