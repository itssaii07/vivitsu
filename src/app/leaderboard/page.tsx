'use client'

import { useState, useEffect } from 'react'
import {
    Flame,
    Clock,
    Medal,
    Loader2
} from 'lucide-react'
import { Card } from '@/components/ui'
import { InviteButton } from '@/components/shared/InviteButton'
import { getStreakEmoji, formatDuration } from '@/lib/utils'
import { Sidebar } from '@/components/layout/Sidebar'
import { useAuth } from '@/components/providers'

export default function LeaderboardPage() {
    const { user } = useAuth()
    const [leaderboard, setLeaderboard] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const [connectedIds, setConnectedIds] = useState<Set<string>>(new Set())

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return
            try {
                const [leaderboardRes, friendsRes] = await Promise.all([
                    fetch('/api/leaderboard'),
                    fetch(`/api/friends?userId=${user.id}`)
                ])

                const lbData = await leaderboardRes.json()
                const friendsData = await friendsRes.json()

                if (lbData.leaderboard) {
                    const enhanced = lbData.leaderboard.map((u: any) => ({
                        ...u,
                        isCurrentUser: user.id === u.id
                    }))
                    setLeaderboard(enhanced)
                }

                if (friendsData.connectedUserIds) {
                    setConnectedIds(new Set(friendsData.connectedUserIds))
                }
            } catch (error) {
                console.error('Failed to fetch data', error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [user?.id])

    return (
        <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-violet-950/10 to-zinc-950">
            <Sidebar />

            {/* Main Content */}
            <main className="ml-64 p-8">
                <div className="max-w-4xl">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-white mb-2">Leaderboard</h1>
                        <p className="text-zinc-400">See how you stack up against other students</p>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
                        </div>
                    ) : (
                        <>
                            {/* Top 3 */}
                            {leaderboard.length > 0 && (
                                <div className="grid grid-cols-3 gap-4 mb-8">
                                    {leaderboard.slice(0, 3).map((u, index) => (
                                        <TopUserCard key={u.id} user={u} rank={index + 1} />
                                    ))}
                                </div>
                            )}

                            {/* Full Leaderboard */}
                            <Card variant="glass">
                                <div className="divide-y divide-zinc-800">
                                    {leaderboard.length === 0 ? (
                                        <div className="p-8 text-center text-zinc-400">
                                            No study data yet. Be the first to start studying!
                                        </div>
                                    ) : (
                                        leaderboard.map((u, index) => (
                                            <LeaderboardRow
                                                key={u.id}
                                                user={u}
                                                rank={index + 1}
                                                isFriend={connectedIds.has(u.id)}
                                            />
                                        ))
                                    )}
                                </div>
                            </Card>
                        </>
                    )}
                </div>
            </main>
        </div>
    )
}

function TopUserCard({ user, rank }: { user: any; rank: number }) {
    const getMedalColor = () => {
        if (rank === 1) return 'from-yellow-400 to-amber-600'
        if (rank === 2) return 'from-zinc-300 to-zinc-500'
        return 'from-amber-600 to-amber-800'
    }

    const getMedalIcon = () => {
        if (rank === 1) return '🥇'
        if (rank === 2) return '🥈'
        return '🥉'
    }

    return (
        <Card
            variant="glass"
            className={`text-center relative ${rank === 1 ? 'ring-2 ring-yellow-500/50' : ''}`}
        >
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-2xl">
                {getMedalIcon()}
            </div>
            <div
                className={`w-16 h-16 rounded-full bg-gradient-to-br ${getMedalColor()} flex items-center justify-center text-white text-xl font-bold mx-auto mt-4 mb-3 overflow-hidden`}
            >
                {user.avatar && user.avatar.length > 2 ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                    user.avatar
                )}
            </div>
            <h3 className="text-white font-semibold mb-1">{user.name}</h3>
            <div className="flex items-center justify-center gap-1 text-orange-400 mb-2">
                <Flame className="w-4 h-4" />
                <span className="font-medium">{user.streak} days</span>
            </div>
            <p className="text-zinc-400 text-sm">{formatDuration(user.weeklyHours * 60)} this week</p>
        </Card>
    )
}

function LeaderboardRow({ user, rank, isFriend }: { user: any; rank: number; isFriend: boolean }) {
    return (
        <div
            className={`flex items-center gap-4 p-4 ${user.isCurrentUser ? 'bg-violet-500/10' : ''
                }`}
        >
            <div className="w-8 text-center">
                {rank <= 3 ? (
                    <div className="text-xl">
                        {rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}
                    </div>
                ) : (
                    <span className="text-zinc-500 font-medium">{rank}</span>
                )}
            </div>

            <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium overflow-hidden ${user.isCurrentUser
                    ? 'bg-gradient-to-br from-violet-600 to-indigo-600'
                    : 'bg-zinc-700'
                    }`}
            >
                {user.avatar && user.avatar.length > 2 ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                    user.avatar
                )}
            </div>

            <div className="flex-1">
                <p className={`font-medium ${user.isCurrentUser ? 'text-violet-400' : 'text-white'}`}>
                    {user.name}
                    {user.isCurrentUser && ' (You)'}
                </p>
            </div>

            <div className="flex items-center gap-1 text-orange-400">
                <Flame className="w-4 h-4" />
                <span>{user.streak} {getStreakEmoji(user.streak)}</span>
            </div>

            <div className="flex items-center gap-1 text-zinc-400 w-24 justify-end">
                <Clock className="w-4 h-4" />
                <span>{formatDuration(user.weeklyHours * 60)}</span>

                {!user.isCurrentUser && !isFriend && (
                    <InviteButton targetId={user.id} />
                )}
            </div>
        </div>
    )
}


