import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                avatarUrl: true,
                streak: {
                    select: { current: true }
                },
                sessions: {
                    select: {
                        durationMins: true,
                        startedAt: true
                    }
                }
            }
        })

        const leaderboard = users.map((user: any) => {
            const totalMinutes = user.sessions.reduce((acc: number, s: any) => acc + (s.durationMins || 0), 0)

            const oneWeekAgo = new Date()
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

            const weeklyMinutes = user.sessions
                .reduce((acc: number, s: any) => acc + (s.durationMins || 0), 0)

            return {
                id: user.id,
                name: user.name || 'Student',
                avatar: user.avatarUrl || user.name?.charAt(0).toUpperCase() || 'S',
                streak: user.streak?.current || 0,
                weeklyHours: Math.round(weeklyMinutes / 60 * 10) / 10,
                totalHours: Math.round(totalMinutes / 60 * 10) / 10
            }
        })

        // Sort by weekly hours desc
        leaderboard.sort((a: any, b: any) => b.weeklyHours - a.weeklyHours || b.streak - a.streak)

        return NextResponse.json({ leaderboard: leaderboard.slice(0, 50) })
    } catch (error) {
        console.error('Leaderboard error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch leaderboard' },
            { status: 500 }
        )
    }
}
