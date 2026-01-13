import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
    try {
        const { joinCode, userId } = await request.json()

        if (!joinCode || !userId) {
            return NextResponse.json({ error: 'Code and User ID required' }, { status: 400 })
        }

        // Find room by code
        const room = await prisma.room.findUnique({
            where: { joinCode: joinCode.toUpperCase() }
        })

        if (!room) {
            return NextResponse.json({ error: 'Invalid room code' }, { status: 404 })
        }

        // Add user to room (upsert to handle re-joining)
        await prisma.roomMember.upsert({
            where: {
                roomId_userId: { roomId: room.id, userId }
            },
            create: {
                roomId: room.id,
                userId,
                isOnline: true
            },
            update: {
                isOnline: true
            }
        })

        return NextResponse.json({ success: true, roomId: room.id })
    } catch (error) {
        console.error('Join room error:', error)
        return NextResponse.json({ error: 'Failed to join room' }, { status: 500 })
    }
}
