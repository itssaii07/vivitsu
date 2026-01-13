'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
    Plus,
    Clock,
    Users as UsersIcon,
    Play,
    Timer
} from 'lucide-react'
import { Button, Card } from '@/components/ui'
import { useAuth } from '@/components/providers'
import { Sidebar } from '@/components/layout/Sidebar'

export default function RoomsPage() {
    const [rooms, setRooms] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const { user } = useAuth()

    const fetchRooms = async () => {
        try {
            const res = await fetch('/api/rooms')
            const data = await res.json()
            if (data.rooms) {
                setRooms(data.rooms)
            }
        } catch (error) {
            console.error('Failed to fetch rooms', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchRooms()
    }, [])

    const handleRoomCreated = () => {
        setShowCreateModal(false)
        fetchRooms()
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-violet-950/10 to-zinc-950">
            <Sidebar />

            {/* Main Content */}
            <main className="ml-64 p-8">
                <div className="max-w-6xl">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-2">Study Rooms</h1>
                            <p className="text-zinc-400">Join a room or create your own to study with friends</p>
                        </div>
                        <Button onClick={() => setShowCreateModal(true)}>
                            <Plus className="w-5 h-5" />
                            Create Room
                        </Button>
                    </div>

                    {/* Active Rooms */}
                    <div className="mb-8">
                        <h2 className="text-xl font-semibold text-white mb-4">Active Rooms</h2>
                        {loading ? (
                            <div className="text-zinc-400">Loading rooms...</div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {rooms.map((room) => (
                                    <RoomCard key={room.id} room={room} />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Empty state for when there are no rooms */}
                    {!loading && rooms.length === 0 && (
                        <Card variant="glass" className="text-center py-16">
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-600/20 to-indigo-600/20 flex items-center justify-center mx-auto mb-6">
                                <UsersIcon className="w-10 h-10 text-violet-400" />
                            </div>
                            <h2 className="text-xl font-bold text-white mb-2">No active rooms</h2>
                            <p className="text-zinc-400 mb-6">Create a room to start studying with friends!</p>
                            <Button onClick={() => setShowCreateModal(true)}>
                                <Plus className="w-5 h-5" />
                                Create Your First Room
                            </Button>
                        </Card>
                    )}
                </div>
            </main>

            {/* Create Room Modal */}
            {showCreateModal && (
                <CreateRoomModal
                    onClose={() => setShowCreateModal(false)}
                    onCreated={handleRoomCreated}
                />
            )}
        </div>
    )
}

function RoomCard({ room }: { room: any }) {
    return (
        <Link href={`/rooms/${room.id}`}>
            <Card className="hover:border-violet-500/50 transition-all group cursor-pointer">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-1">{room.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-zinc-400">
                            {room.roomType === 'pomodoro' ? (
                                <>
                                    <Timer className="w-4 h-4" />
                                    <span>{room.pomodoroMins}min Pomodoro</span>
                                </>
                            ) : (
                                <>
                                    <Clock className="w-4 h-4" />
                                    <span>Open Session</span>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs">
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        Live
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-zinc-400">
                        <UsersIcon className="w-4 h-4" />
                        <span>{room.membersOnline} / {room.totalMembers || room._count?.members || 0} online</span>
                    </div>
                    <Button size="sm" variant="secondary">
                        <Play className="w-4 h-4" />
                        Join
                    </Button>
                </div>
            </Card>
        </Link>
    )
}

function CreateRoomModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
    const { user } = useAuth()
    const [name, setName] = useState('')
    const [roomType, setRoomType] = useState<'open' | 'pomodoro'>('pomodoro')
    const [pomodoroMins, setPomodoroMins] = useState(25)
    const [creating, setCreating] = useState(false)

    const handleCreate = async () => {
        if (!user) return

        setCreating(true)
        try {
            const res = await fetch('/api/rooms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    roomType,
                    pomodoroMins: roomType === 'pomodoro' ? pomodoroMins : 0,
                    userId: user.id,
                    userEmail: user.email,
                    userName: user.user_metadata?.name || user.email?.split('@')[0] || 'Anonymous'
                })
            })

            if (res.ok) {
                onCreated()
            }
        } catch (error) {
            console.error('Failed to create room', error)
        } finally {
            setCreating(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-6">
            <Card variant="glass" className="w-full max-w-md">
                <h2 className="text-xl font-bold text-white mb-6">Create Study Room</h2>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-2">
                            Room Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Math Study Group"
                            className="w-full h-12 px-4 rounded-xl bg-zinc-800/50 border border-zinc-700 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-2">
                            Room Type
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setRoomType('pomodoro')}
                                className={`p-4 rounded-xl border transition-all ${roomType === 'pomodoro'
                                    ? 'border-violet-500 bg-violet-500/10'
                                    : 'border-zinc-700 hover:border-zinc-600'
                                    }`}
                            >
                                <Timer className={`w-6 h-6 mb-2 ${roomType === 'pomodoro' ? 'text-violet-400' : 'text-zinc-400'}`} />
                                <p className={`font-medium ${roomType === 'pomodoro' ? 'text-white' : 'text-zinc-400'}`}>
                                    Pomodoro
                                </p>
                                <p className="text-xs text-zinc-500 mt-1">Timed sessions</p>
                            </button>
                            <button
                                onClick={() => setRoomType('open')}
                                className={`p-4 rounded-xl border transition-all ${roomType === 'open'
                                    ? 'border-violet-500 bg-violet-500/10'
                                    : 'border-zinc-700 hover:border-zinc-600'
                                    }`}
                            >
                                <Clock className={`w-6 h-6 mb-2 ${roomType === 'open' ? 'text-violet-400' : 'text-zinc-400'}`} />
                                <p className={`font-medium ${roomType === 'open' ? 'text-white' : 'text-zinc-400'}`}>
                                    Open
                                </p>
                                <p className="text-xs text-zinc-500 mt-1">Free-form study</p>
                            </button>
                        </div>
                    </div>

                    {roomType === 'pomodoro' && (
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-2">
                                Session Length: {pomodoroMins} minutes
                            </label>
                            <input
                                type="range"
                                min="15"
                                max="60"
                                step="5"
                                value={pomodoroMins}
                                onChange={(e) => setPomodoroMins(Number(e.target.value))}
                                className="w-full accent-violet-500"
                            />
                        </div>
                    )}

                    <div className="flex gap-4 pt-4">
                        <Button variant="secondary" onClick={onClose} className="flex-1">
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreate}
                            className="flex-1"
                            disabled={!name.trim() || creating}
                        >
                            {creating ? 'Creating...' : 'Create Room'}
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    )
}
