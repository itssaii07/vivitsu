'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
    Plus,
    Clock,
    Users as UsersIcon,
    Play,
    Timer,
    Trash2,
    Lock,
    Copy,
    Share2
} from 'lucide-react'
import { PageTransition, StaggerContainer, StaggerItem } from '@/components/ui/Motion'
import { TiltCard } from '@/components/ui/TiltCard'
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
            // Pass userId to get my private rooms too
            const query = user?.id ? `?userId=${user.id}` : ''
            const res = await fetch(`/api/rooms${query}`)
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
        if (user) fetchRooms()
    }, [user]) // Re-fetch when user loads

    const handleRoomCreated = () => {
        setShowCreateModal(false)
        fetchRooms()
    }

    const handleJoinByCode = async (code: string) => {
        if (!user || !code) return
        try {
            const res = await fetch('/api/rooms/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ joinCode: code, userId: user.id })
            })
            const data = await res.json()
            if (res.ok) {
                // Refresh to show in "Private Rooms" list, then redirect
                fetchRooms()
                window.location.href = `/rooms/${data.roomId}`
            } else {
                alert(data.error || 'Failed to join')
            }
        } catch (error) {
            console.error('Join error', error)
        }
    }

    const privateRooms = rooms.filter(r => r.isPrivate)
    const publicRooms = rooms.filter(r => !r.isPrivate)

    return (
        <div className="min-h-screen">
            <Sidebar />

            {/* Main Content */}
            <main className="ml-64 p-8">
                <PageTransition className="max-w-6xl">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-2">Study Rooms</h1>
                            <p className="text-zinc-400">Join a room or create your own to study with friends</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center bg-zinc-800/50 rounded-lg p-1 border border-zinc-700">
                                <input
                                    type="text"
                                    placeholder="Enter Room Code"
                                    className="bg-transparent border-none text-sm px-3 py-1.5 focus:outline-none text-white w-32 uppercase"
                                    maxLength={6}
                                    id="join-code-input"
                                />
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                        const input = document.getElementById('join-code-input') as HTMLInputElement
                                        if (input.value) handleJoinByCode(input.value)
                                    }}
                                >
                                    Join
                                </Button>
                            </div>
                            <Button onClick={() => setShowCreateModal(true)}>
                                <Plus className="w-5 h-5" />
                                Create Room
                            </Button>
                        </div>
                    </div>



                    {/* Private Rooms Section */}
                    {privateRooms.length > 0 && (
                        <div className="mb-10">
                            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                                <Lock className="w-5 h-5 text-violet-400" />
                                My Private Rooms
                            </h2>
                            <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {privateRooms.map((room) => (
                                    <StaggerItem key={room.id}>
                                        <RoomCard
                                            room={room}
                                            userId={user?.id}
                                            onDelete={fetchRooms}
                                        />
                                    </StaggerItem>
                                ))}
                            </StaggerContainer>
                        </div>
                    )}

                    {/* Public Rooms Section */}
                    <div className="mb-8">
                        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                            <UsersIcon className="w-5 h-5 text-zinc-400" />
                            Public Rooms
                        </h2>
                        {loading ? (
                            <div className="text-zinc-400">Loading rooms...</div>
                        ) : publicRooms.length > 0 ? (
                            <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {publicRooms.map((room) => (
                                    <StaggerItem key={room.id}>
                                        <RoomCard
                                            room={room}
                                            userId={user?.id}
                                            onDelete={fetchRooms}
                                        />
                                    </StaggerItem>
                                ))}
                            </StaggerContainer>
                        ) : (
                            <div className="text-zinc-500 italic">No public rooms active right now.</div>
                        )}
                    </div>

                    {/* Empty state for when there are no rooms at all */}
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
                </PageTransition>
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

const RoomCard = ({ room, userId, onDelete }: { room: any, userId?: string, onDelete: () => void }) => {
    const isCreator = room.createdById === userId || room.createdBy?.id === userId

    const handleDelete = async (e: React.MouseEvent) => {
        e.preventDefault() // Prevent navigation
        if (!confirm('Are you sure you want to delete this room?')) return

        try {
            const res = await fetch(`/api/rooms/${room.id}`, {
                method: 'DELETE',
                body: JSON.stringify({ userId, deleteRoom: true })
            })
            if (res.ok) {
                onDelete()
            }
        } catch (error) {
            console.error('Failed to delete room', error)
        }
    }

    const copyCode = (e: React.MouseEvent) => {
        e.preventDefault()
        navigator.clipboard.writeText(room.joinCode)
        alert(`Room code copied: ${room.joinCode}`)
    }

    return (
        <Link href={`/rooms/${room.id}`}>
            <TiltCard className="h-full">
                <Card variant="glass" className="hover:border-violet-500/50 transition-all group cursor-pointer relative h-full flex flex-col">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-lg font-semibold text-white">{room.name}</h3>
                                {room.isPrivate && <Lock className="w-4 h-4 text-zinc-500" />}
                            </div>

                            <div className="flex items-center gap-2 text-sm text-zinc-400">
                                {room.roomType === 'pomodoro' ? (
                                    <>
                                        <Timer className="w-4 h-4" />
                                        <span>{room.pomodoroMins}min</span>
                                    </>
                                ) : (
                                    <>
                                        <Clock className="w-4 h-4" />
                                        <span>Open</span>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-1">
                            {isCreator && (
                                <button
                                    onClick={handleDelete}
                                    className="p-2 text-zinc-500 hover:text-red-500 rounded-full hover:bg-red-500/10 transition-colors z-10"
                                    title="Delete Room"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                            {!isCreator && (
                                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs">
                                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                                    Live
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-zinc-400">
                            <UsersIcon className="w-4 h-4" />
                            <span>{room.membersOnline} / {room.maxParticipants || room.totalMembers} online</span>
                        </div>

                        {isCreator && room.joinCode && (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={(e) => {
                                        e.preventDefault()
                                        const text = `Join my private study room "${room.name}" on Vivitsu! Code: ${room.joinCode}`
                                        navigator.clipboard.writeText(text)
                                        alert('Invite message copied!')
                                    }}
                                    className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-white px-2 py-1 rounded hover:bg-zinc-800 transition-colors"
                                >
                                    <Share2 className="w-3 h-3" />
                                    Invite
                                </button>
                                <button
                                    onClick={copyCode}
                                    className="flex items-center gap-1.5 text-xs font-medium text-violet-400 hover:text-violet-300 px-2 py-1 rounded bg-violet-500/10 hover:bg-violet-500/20 transition-colors"
                                >
                                    <Copy className="w-3 h-3" />
                                    {room.joinCode}
                                </button>
                            </div>
                        )}
                    </div>
                </Card>
            </TiltCard>
        </Link>
    )
}

function CreateRoomModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
    const { user } = useAuth()
    const [name, setName] = useState('')
    const [roomType, setRoomType] = useState<'open' | 'pomodoro'>('open')
    const [isPrivate, setIsPrivate] = useState(false)
    const [pomodoroMins, setPomodoroMins] = useState(25)
    const [maxParticipants, setMaxParticipants] = useState(10)
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
                    isPrivate,
                    maxParticipants,
                    pomodoroMins: roomType === 'pomodoro' ? pomodoroMins : 0,
                    userId: user.id,
                    userEmail: user.email,
                    userName: user.user_metadata?.name || user.email?.split('@')[0] || 'Anonymous'
                })
            })

            if (res.ok) {
                const data = await res.json()
                onCreated() // Refresh list (though private won't show)
                window.location.href = `/rooms/${data.room.id}` // Redirect to room
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
                            Privacy
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setIsPrivate(false)}
                                className={`p-4 rounded-xl border transition-all text-left group ${!isPrivate
                                    ? 'border-violet-500 bg-violet-500/10'
                                    : 'border-zinc-700 hover:border-zinc-600'
                                    }`}
                            >
                                <UsersIcon className={`w-6 h-6 mb-2 ${!isPrivate ? 'text-violet-400' : 'text-zinc-400'}`} />
                                <p className={`font-medium ${!isPrivate ? 'text-white' : 'text-zinc-400'}`}>
                                    Public
                                </p>
                                <p className="text-xs text-zinc-500 mt-1">Visible to everyone</p>
                            </button>
                            <button
                                onClick={() => setIsPrivate(true)}
                                className={`p-4 rounded-xl border transition-all text-left group ${isPrivate
                                    ? 'border-violet-500 bg-violet-500/10'
                                    : 'border-zinc-700 hover:border-zinc-600'
                                    }`}
                            >
                                <Lock className={`w-6 h-6 mb-2 ${isPrivate ? 'text-violet-400' : 'text-zinc-400'}`} />
                                <p className={`font-medium ${isPrivate ? 'text-white' : 'text-zinc-400'}`}>
                                    Private
                                </p>
                                <p className="text-xs text-zinc-500 mt-1">Invite only</p>
                            </button>
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-sm font-medium text-zinc-400">
                                Max Participants
                            </label>
                            <span className="text-violet-400 font-bold">{maxParticipants}</span>
                        </div>
                        <input
                            type="range"
                            min="2"
                            max="50"
                            step="1"
                            value={maxParticipants}
                            onChange={(e) => setMaxParticipants(Number(e.target.value))}
                            className="w-full accent-violet-500 h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
                        />
                        <p className="text-xs text-zinc-500 mt-2">
                            Limit the number of people who can join this room.
                        </p>
                    </div>


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
