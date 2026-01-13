import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Get all active rooms
export async function GET() {
    try {
        const rooms = await prisma.room.findMany({
            where: { isActive: true },
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
            membersOnline: room.members.filter((m) => m.isOnline).length,
            totalMembers: room._count.members,
            createdAt: room.createdAt,
        }))

        return NextResponse.json({ rooms: formattedRooms })
    } catch (error) {
        console.error('Get rooms error:', error)
        // Return mock data if DB not connected
        return NextResponse.json({
            rooms: [
                {
                    id: '1',
                    name: 'Math Study Group',
                    roomType: 'pomodoro',
                    pomodoroMins: 25,
                    membersOnline: 3,
                    totalMembers: 8,
                },
                {
                    id: '2',
                    name: 'Coding Practice',
                    roomType: 'open',
                    pomodoroMins: 0,
                    membersOnline: 5,
                    totalMembers: 12,
                },
            ],
        })
    }
}

// Create a new room
export async function POST(request: NextRequest) {
    try {
        const { name, description, roomType, pomodoroMins, breakMins, userId, userEmail, userName } =
            await request.json()

        if (!name || !userId) {
            return NextResponse.json(
                { error: 'Name and user ID required' },
                { status: 400 }
            )
        }

        // Ensure user exists in our database
        await prisma.user.upsert({
            where: { id: userId },
            create: {
                id: userId,
                email: userEmail || `user_${userId}@placeholder.com`,
                name: userName || 'Anonymous',
            },
            update: {
                // Optional: keep profile synced
                ...(userEmail && { email: userEmail }),
                ...(userName && { name: userName }),
            }
        })

        const room = await prisma.room.create({
            data: {
                name,
                description,
                roomType: roomType || 'open',
                pomodoroMins: pomodoroMins || 25,
                breakMins: breakMins || 5,
                createdById: userId,
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
