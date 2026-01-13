import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Start a study session
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { userId, userEmail, userName, userAvatar } = body

        if (!userId) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 })
        }

        // Ensure user exists (Upsert)
        // We only upsert if email is provided, otherwise we assume user exists or risk FK error
        if (userEmail) {
            await prisma.user.upsert({
                where: { email: userEmail },
                update: {
                    name: userName,
                    avatarUrl: userAvatar,
                    updatedAt: new Date()
                },
                create: {
                    id: userId,
                    email: userEmail,
                    name: userName,
                    avatarUrl: userAvatar
                }
            })
        }

        // Check if user already has an active session
        const activeSession = await prisma.studySession.findFirst({
            where: {
                userId,
                endedAt: null,
            },
        })

        if (activeSession) {
            return NextResponse.json({
                session: activeSession,
                message: 'Session already active',
            })
        }

        // Create new session
        const session = await prisma.studySession.create({
            data: {
                userId,
                startedAt: new Date(),
            },
        })

        return NextResponse.json({ session })
    } catch (error) {
        console.error('Start session error:', error)
        return NextResponse.json(
            { error: 'Failed to start session' },
            { status: 500 }
        )
    }
}

// Get current session status
export async function GET(request: NextRequest) {
    try {
        const userId = request.nextUrl.searchParams.get('userId')

        if (!userId) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 })
        }

        const activeSession = await prisma.studySession.findFirst({
            where: {
                userId,
                endedAt: null,
            },
        })

        // Get today's total study time
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const todaySessions = await prisma.studySession.findMany({
            where: {
                userId,
                startedAt: { gte: today },
                endedAt: { not: null },
            },
        })

        const todayMinutes = todaySessions.reduce(
            (acc: number, s: any) => acc + (s.durationMins || 0),
            0
        )

        // Get streak
        const streak = await prisma.streak.findUnique({
            where: { userId },
        })

        return NextResponse.json({
            activeSession,
            todayMinutes,
            streak: streak || { current: 0, longest: 0 },
        })
    } catch (error) {
        console.error('Get session error:', error)
        return NextResponse.json(
            { error: 'Failed to get session' },
            { status: 500 }
        )
    }
}
