import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Join a room
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const { userId } = await request.json()

        if (!userId) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 })
        }

        // Check if already a member
        const existingMember = await prisma.roomMember.findUnique({
            where: {
                roomId_userId: { roomId: id, userId },
            },
        })

        if (existingMember) {
            // Update to online
            await prisma.roomMember.update({
                where: { roomId_userId: { roomId: id, userId } },
                data: { isOnline: true },
            })
        } else {
            // Add as member
            await prisma.roomMember.create({
                data: {
                    roomId: id,
                    userId,
                    isOnline: true,
                },
            })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Join room error:', error)
        return NextResponse.json(
            { error: 'Failed to join room' },
            { status: 500 }
        )
    }
}

// Leave a room
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const { userId, deleteRoom } = await request.json()
        console.log(`[DELETE ROOM] Request for room ${id}:`, { userId, deleteRoom })

        if (!userId) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 })
        }

        if (deleteRoom) {
            // Verify ownership
            const room = await prisma.room.findUnique({ where: { id } })
            if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 })

            if (room.createdById !== userId) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
            }

            await prisma.room.delete({ where: { id } })
            return NextResponse.json({ success: true, deleted: true })
        }

        // Leave room logic (existing)
        await prisma.roomMember.update({
            where: { roomId_userId: { roomId: id, userId } },
            data: { isOnline: false },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Leave room error:', error)
        return NextResponse.json(
            { error: 'Failed to leave room' },
            { status: 500 }
        )
    }
}

// Get room details
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        const room = await prisma.room.findUnique({
            where: { id },
            include: {
                createdBy: {
                    select: { id: true, name: true },
                },
                members: {
                    include: {
                        user: {
                            select: { id: true, name: true },
                        },
                    },
                },
                messages: {
                    take: 50,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        user: {
                            select: { id: true, name: true },
                        },
                    },
                },
            },
        })

        if (!room) {
            return NextResponse.json({ error: 'Room not found' }, { status: 404 })
        }

        return NextResponse.json({ room })
    } catch (error) {
        console.error('Get room error:', error)
        return NextResponse.json(
            { error: 'Failed to get room' },
            { status: 500 }
        )
    }
}
