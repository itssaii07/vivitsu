import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// List user's direct messages
export async function GET(request: NextRequest) {
    try {
        const userId = request.nextUrl.searchParams.get('userId')
        if (!userId) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 })
        }

        const rooms = await prisma.room.findMany({
            where: {
                roomType: 'direct',
                members: {
                    some: { userId }
                }
            },
            include: {
                members: {
                    include: {
                        user: {
                            select: { id: true, name: true, avatarUrl: true, email: true }
                        }
                    }
                },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        // Format for UI
        const chats = rooms.map(room => {
            const otherMember = room.members.find(m => m.userId !== userId)?.user
            const lastMessage = room.messages[0]

            return {
                id: room.id,
                name: otherMember?.name || 'Unknown User',
                avatarUrl: otherMember?.avatarUrl,
                lastMessage: lastMessage ? lastMessage.content : 'No messages yet',
                timestamp: lastMessage ? lastMessage.createdAt : room.createdAt,
                otherUserId: otherMember?.id
            }
        })

        return NextResponse.json({ chats })
    } catch (error) {
        console.error('List chats error:', error)
        return NextResponse.json({ error: 'Failed to fetch chats' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const { userId, targetUserId } = await request.json()

        if (!userId || !targetUserId) {
            return NextResponse.json({ error: 'Missing requirements' }, { status: 400 })
        }

        // 1. Check if a direct room already exists between these two
        // We look for a room of type 'direct' where both users are members
        // This is complex in Prisma, so we might fetch user's direct rooms and check members
        const userDirectRooms = await prisma.room.findMany({
            where: {
                roomType: 'direct',
                members: {
                    some: { userId: userId }
                }
            },
            include: {
                members: true
            }
        })

        const existingRoom = userDirectRooms.find(room =>
            room.members.some(m => m.userId === targetUserId)
        )

        if (existingRoom) {
            return NextResponse.json({ roomId: existingRoom.id })
        }

        // 2. If not, create a new room
        const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } })
        const sender = await prisma.user.findUnique({ where: { id: userId } })

        const roomName = `Chat: ${sender?.name} & ${targetUser?.name}`

        const newRoom = await prisma.room.create({
            data: {
                name: roomName,
                roomType: 'direct',
                createdById: userId,
                members: {
                    create: [
                        { userId: userId, isOnline: true },
                        { userId: targetUserId, isOnline: false }
                    ]
                }
            }
        })

        return NextResponse.json({ roomId: newRoom.id })

    } catch (error) {
        console.error('Direct message error:', error)
        return NextResponse.json({ error: 'Failed to access chat' }, { status: 500 })
    }
}
