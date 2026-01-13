import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Get friends and requests
export async function GET(request: NextRequest) {
    try {
        const userId = request.nextUrl.searchParams.get('userId')
        if (!userId) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 })
        }

        const friendships = await prisma.friendship.findMany({
            where: {
                OR: [
                    { senderId: userId, status: 'ACCEPTED' },
                    { receiverId: userId, status: 'ACCEPTED' }
                ]
            },
            include: {
                sender: { select: { id: true, name: true, avatarUrl: true, email: true } },
                receiver: { select: { id: true, name: true, avatarUrl: true, email: true } }
            }
        })

        const friends = friendships.map((f: any) => ({
            id: f.id,
            friend: f.senderId === userId ? f.receiver : f.sender,
            status: f.status
        }))

        const requests = await prisma.friendship.findMany({
            where: {
                receiverId: userId,
                status: 'PENDING'
            },
            include: {
                sender: { select: { id: true, name: true, avatarUrl: true, email: true } }
            }
        })

        return NextResponse.json({ friends, requests })
    } catch (error) {
        console.error('Get friends error:', error)
        return NextResponse.json({ error: 'Failed to fetch friends' }, { status: 500 })
    }
}

// Send Friend Request
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        console.log('FRIEND REQUEST BODY:', body)
        const { userId, targetEmail, targetId } = body

        if (!userId || (!targetEmail && !targetId)) {
            console.error('Missing requirements', { userId, targetEmail, targetId })
            return NextResponse.json({ error: 'Missing requirements' }, { status: 400 })
        }

        // Verify Sender Exists
        const sender = await prisma.user.findUnique({ where: { id: userId } })
        if (!sender) {
            console.error('SENDER NOT FOUND IN DB:', userId)
            // Ideally we should sync sender here if possible, but for now error
            return NextResponse.json({ error: 'Your account is not synced. Please go to Profile and Save.' }, { status: 404 })
        }

        let targetUser;
        if (targetId) {
            console.log('Looking for targetId:', targetId)
            targetUser = await prisma.user.findUnique({ where: { id: targetId } })
        } else {
            console.log('Looking for targetEmail:', targetEmail)
            targetUser = await prisma.user.findUnique({ where: { email: targetEmail } })
        }

        if (!targetUser) {
            console.error('TARGET USER NOT FOUND:', { targetId, targetEmail })
            return NextResponse.json({ error: 'User not found in database. They must log in and save their profile.' }, { status: 404 })
        }

        if (targetUser.id === userId) {
            return NextResponse.json({ error: 'Cannot add yourself' }, { status: 400 })
        }

        const existing = await prisma.friendship.findFirst({
            where: {
                OR: [
                    { senderId: userId, receiverId: targetUser.id },
                    { senderId: targetUser.id, receiverId: userId }
                ]
            }
        })

        if (existing) {
            return NextResponse.json({ error: 'Friendship already exists' }, { status: 400 })
        }

        const friendship = await prisma.friendship.create({
            data: {
                senderId: userId,
                receiverId: targetUser.id,
                status: 'PENDING'
            }
        })

        return NextResponse.json({ friendship })
    } catch (error) {
        console.error('Add friend error details:', error)
        return NextResponse.json({ error: 'Failed to add friend' }, { status: 500 })
    }
}

export async function PUT(request: NextRequest) {
    try {
        const { friendshipId, status } = await request.json()
        const friendship = await prisma.friendship.update({
            where: { id: friendshipId },
            data: { status }
        })
        return NextResponse.json({ friendship })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
    }
}
