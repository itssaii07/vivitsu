import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Update POST to accept targetUserId
export async function POST(request: NextRequest) {
    try {
        const { noteId, ownerId, targetEmail, targetUserId, role = 'VIEWER' } = await request.json()

        if (!noteId || !ownerId || (!targetEmail && !targetUserId)) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // 1. Verify owner rights
        const note = await prisma.note.findUnique({
            where: { id: noteId },
            include: { user: true }
        })

        if (!note) {
            return NextResponse.json({ error: 'Note not found' }, { status: 404 })
        }

        if (note.userId !== ownerId) {
            return NextResponse.json({ error: 'Only the owner can share this note' }, { status: 403 })
        }

        // 2. Find target user
        let targetUser = null
        if (targetUserId) {
            targetUser = await prisma.user.findUnique({ where: { id: targetUserId } })
        } else {
            targetUser = await prisma.user.findUnique({ where: { email: targetEmail } })
        }

        if (!targetUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        if (targetUser.id === ownerId) {
            return NextResponse.json({ error: 'Cannot share with yourself' }, { status: 400 })
        }

        // 3. Create or update collaboration
        const collaboration = await prisma.noteCollaborator.upsert({
            where: {
                noteId_userId: {
                    noteId,
                    userId: targetUser.id
                }
            },
            update: { role },
            create: {
                noteId,
                userId: targetUser.id,
                role
            }
        })

        return NextResponse.json({ success: true, collaboration })
    } catch (error) {
        console.error('Share note error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const noteId = searchParams.get('noteId')
    const userId = searchParams.get('userId')
    const ownerId = searchParams.get('ownerId') // Current user performing action

    if (!noteId || !userId || !ownerId) {
        return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
    }

    // Verify owner
    const note = await prisma.note.findUnique({ where: { id: noteId } })
    if (!note || note.userId !== ownerId) {
        return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    await prisma.noteCollaborator.delete({
        where: {
            noteId_userId: {
                noteId,
                userId
            }
        }
    })

    return NextResponse.json({ success: true })
}
