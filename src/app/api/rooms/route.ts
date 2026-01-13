import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Generate a random 6-character code
function generateRoomCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase()
}

// Get all active rooms (Public + relevant Private)
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const userId = searchParams.get('userId')

        const rooms = await prisma.room.findMany({
            where: {
                isActive: true,
                roomType: { not: 'direct' },
                OR: [
                    { isPrivate: false }, // Public rooms
                    ...(userId ? [
                        { createdById: userId }, // Created by me
                        { members: { some: { userId: userId } } } // Joined by me
                    ] : [])
                ]
            },
            include: {
                createdBy: {
                    select: { id: true, name: true },
                },
                members: {
                    select: { userId: true, isOnline: true },
                },
                _count: {
                    select: { members: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        })

        const formattedRooms = rooms.map((room) => ({
            id: room.id,
            name: room.name,
            description: room.description,
            roomType: room.roomType,
            pomodoroMins: room.pomodoroMins,
            breakMins: room.breakMins,
            createdBy: room.createdBy.name,
            createdById: room.createdById,
            isPrivate: room.isPrivate,
            joinCode: room.joinCode,
            maxParticipants: room.maxParticipants,
            membersOnline: room.members.filter((m) => m.isOnline).length,
            totalMembers: room._count.members,
            createdAt: room.createdAt,
        }))

        return NextResponse.json({ rooms: formattedRooms })
    } catch (error) {
        console.error('Get rooms error:', error)
        return NextResponse.json({ error: 'Failed to fetch rooms' }, { status: 500 })
    }
}

// Create a new room
export async function POST(request: NextRequest) {
    try {
        const { name, description, roomType, pomodoroMins, breakMins, userId, userEmail, userName, isPrivate, maxParticipants } =
            await request.json()

        if (!name || !userId) {
            return NextResponse.json(
                { error: 'Name and user ID required' },
                { status: 400 }
            )
        }

        // Ensure user exists
        await prisma.user.upsert({
            where: { id: userId },
            create: {
                id: userId,
                email: userEmail || `user_${userId}@placeholder.com`,
                name: userName || 'Anonymous',
            },
            update: {
                ...(userEmail && { email: userEmail }),
                ...(userName && { name: userName }),
            }
        })

        const joinCode = generateRoomCode()

        const room = await prisma.room.create({
            data: {
                name,
                description,
                roomType: roomType || 'open',
                pomodoroMins: pomodoroMins || 25,
                breakMins: breakMins || 5,
                createdById: userId,
                isPrivate: isPrivate || false,
                joinCode,
                maxParticipants: maxParticipants || 50,
                members: {
                    create: {
                        userId,
                        isOnline: true,
                    },
                },
            },
            include: {
                createdBy: {
                    select: { id: true, name: true },
                },
            },
        })

        return NextResponse.json({ room })
    } catch (error) {
        console.error('Create room error:', error)
        return NextResponse.json(
            { error: 'Failed to create room' },
            { status: 500 }
        )
    }
}
