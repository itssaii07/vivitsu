import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const roomId = searchParams.get('roomId')

        if (!roomId) {
            return NextResponse.json({ error: 'Room ID required' }, { status: 400 })
        }

        const messages = await prisma.roomMessage.findMany({
            where: { roomId },
            orderBy: { createdAt: 'asc' },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        avatarUrl: true
                    }
                }
            },
            take: 100 // Limit for now
        })

        const formattedMessages = messages.map(msg => ({
            id: msg.id,
            userId: msg.userId,
            userName: msg.user.name || 'Unknown',
            userAvatar: msg.user.avatarUrl,
            content: msg.content,
            type: msg.type,
            fileUrl: msg.fileUrl,
            timestamp: msg.createdAt
        }))

        return NextResponse.json({ messages: formattedMessages })
    } catch (error) {
        console.error('Fetch messages error:', error)
        return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const { roomId, userId, content, type, fileUrl } = await request.json()

        if (!roomId || !userId || (!content && !fileUrl)) {
            return NextResponse.json({ error: 'Missing requirements' }, { status: 400 })
        }

        console.log('Creating message:', { roomId, userId, content, type, fileUrl })

        const message = await prisma.roomMessage.create({
            data: {
                roomId,
                userId,
                content: content || '', // Ensure valid string
                type: type || 'TEXT',
                fileUrl: fileUrl
            },
            include: {
                user: {
                    select: { name: true, avatarUrl: true }
                }
            }
        })

        console.log('Message created:', message)

        return NextResponse.json({ message })
    } catch (error) {
        console.error('Send message error:', error)
        return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
    }
}
