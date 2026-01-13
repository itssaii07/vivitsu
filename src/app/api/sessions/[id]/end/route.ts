import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// End a study session
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

        // Find and update the session
        const session = await prisma.studySession.findUnique({
            where: { id },
        })

        if (!session) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 })
        }

        if (session.userId !== userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        const endedAt = new Date()
        const durationMins = Math.max(1, Math.ceil(
            (endedAt.getTime() - session.startedAt.getTime()) / 60000
        ))

        const updatedSession = await prisma.studySession.update({
            where: { id },
            data: {
                endedAt,
                durationMins,
            },
        })

        // Update streak
        await updateStreak(userId)

        return NextResponse.json({ session: updatedSession })
    } catch (error) {
        console.error('End session error:', error)
        return NextResponse.json(
            { error: 'Failed to end session' },
            { status: 500 }
        )
    }
}

async function updateStreak(userId: string) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    let streak = await prisma.streak.findUnique({
        where: { userId },
    })

    if (!streak) {
        // Create new streak
        streak = await prisma.streak.create({
            data: {
                userId,
                current: 1,
                longest: 1,
                lastStudy: today,
            },
        })
    } else {
        const lastStudy = streak.lastStudy ? new Date(streak.lastStudy) : null
        lastStudy?.setHours(0, 0, 0, 0)

        if (!lastStudy) {
            // First study ever
            await prisma.streak.update({
                where: { userId },
                data: {
                    current: 1,
                    longest: Math.max(streak.longest, 1),
                    lastStudy: today,
                },
            })
        } else if (lastStudy.getTime() === today.getTime()) {
            // Already studied today, no change
        } else if (lastStudy.getTime() === yesterday.getTime()) {
            // Consecutive day!
            const newStreak = streak.current + 1
            await prisma.streak.update({
                where: { userId },
                data: {
                    current: newStreak,
                    longest: Math.max(streak.longest, newStreak),
                    lastStudy: today,
                },
            })
        } else {
            // Streak broken, reset
            await prisma.streak.update({
                where: { userId },
                data: {
                    current: 1,
                    lastStudy: today,
                },
            })
        }
    }
}
