'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
    Play,
    Square,
    Clock,
    Flame,
    MessageSquare,
    Users,
    Calendar,
    Check,
    Plus,
    Trash2
} from 'lucide-react'
import { Button, Card, CardHeader, CardTitle, CardContent } from '@/components/ui'
import { useStudyStore } from '@/stores'
import { formatDuration, getStreakEmoji } from '@/lib/utils'
import { Sidebar } from '@/components/layout/Sidebar'
import { useAuth } from '@/components/providers'

export default function DashboardPage() {
    const {
        isStudying,
        sessionStartTime,
        currentStreak,
        todayMinutes,
        activeSessionId,
        startSession,
        endSession,
        fetchStats
    } = useStudyStore()
    const { user } = useAuth()
    const [elapsedTime, setElapsedTime] = useState(0)

    // Fetch stats on mount
    useEffect(() => {
        if (user) {
            fetchStats(user.id)
        }
    }, [user])

    // Timer effect
    useEffect(() => {
        if (!isStudying || !sessionStartTime) {
            setElapsedTime(0)
            return
        }

        const interval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - sessionStartTime.getTime()) / 1000)
            setElapsedTime(elapsed)
        }, 1000)

        return () => clearInterval(interval)
    }, [isStudying, sessionStartTime])

    const formatTime = (seconds: number) => {
        const hrs = Math.floor(seconds / 3600)
        const mins = Math.floor((seconds % 3600) / 60)
        const secs = seconds % 60
        if (hrs > 0) {
            return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
        }
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    const handleStartSession = async () => {
        if (!user) return

        await startSession({
            id: user.id,
            email: user.email,
            name: user.user_metadata?.name,
            avatar: user.user_metadata?.avatarUrl
        })
    }

    const handleEndSession = async () => {
        if (activeSessionId && user) {
            await endSession(activeSessionId, user.id)
            await fetchStats(user.id)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-violet-950/10 to-zinc-950">
            <Sidebar />

            {/* Main Content */}
            <main className="ml-64 p-8">
                <div className="max-w-6xl">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-white mb-2">Welcome back! 👋</h1>
                        <p className="text-zinc-400">Ready to crush your study goals today?</p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <Card variant="glass">
                            <CardContent className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center">
                                    <Flame className="w-7 h-7 text-orange-400" />
                                </div>
                                <div>
                                    <p className="text-zinc-400 text-sm">Current Streak</p>
                                    <p className="text-2xl font-bold text-white">
                                        {currentStreak} days {getStreakEmoji(currentStreak)}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card variant="glass">
                            <CardContent className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 flex items-center justify-center">
                                    <Clock className="w-7 h-7 text-violet-400" />
                                </div>
                                <div>
                                    <p className="text-zinc-400 text-sm">Today's Study Time</p>
                                    <p className="text-2xl font-bold text-white">{formatDuration(todayMinutes)}</p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card variant="glass">
                            <CardContent className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                                    <Calendar className="w-7 h-7 text-green-400" />
                                </div>
                                <div>
                                    <p className="text-zinc-400 text-sm">This Week</p>
                                    <p className="text-2xl font-bold text-white">--</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Main Study Card */}
                    <Card variant="glass" className="mb-8">
                        <div className="flex flex-col items-center py-12">
                            <div className="text-6xl font-mono font-bold text-white mb-8">
                                {formatTime(elapsedTime)}
                            </div>

                            {isStudying ? (
                                <Button
                                    size="lg"
                                    variant="danger"
                                    onClick={handleEndSession}
                                    className="min-w-[200px]"
                                >
                                    <Square className="w-5 h-5" />
                                    End Session
                                </Button>
                            ) : (
                                <Button
                                    size="lg"
                                    onClick={handleStartSession}
                                    className="min-w-[200px]"
                                >
                                    <Play className="w-5 h-5" />
                                    Start Studying
                                </Button>
                            )}

                            {isStudying && (
                                <p className="text-zinc-400 mt-4">
                                    You're doing great! Stay focused 💪
                                </p>
                            )}
                        </div>
                    </Card>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Link href="/chat">
                            <Card className="hover:border-violet-500/50 transition-all cursor-pointer group">
                                <CardContent className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600/20 to-indigo-600/20 flex items-center justify-center group-hover:from-violet-600/30 group-hover:to-indigo-600/30 transition-all">
                                        <MessageSquare className="w-6 h-6 text-violet-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-semibold">Ask AI Assistant</h3>
                                        <p className="text-zinc-400 text-sm">Get personalized study help</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>

                        <Link href="/rooms">
                            <Card className="hover:border-violet-500/50 transition-all cursor-pointer group">
                                <CardContent className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600/20 to-indigo-600/20 flex items-center justify-center group-hover:from-violet-600/30 group-hover:to-indigo-600/30 transition-all">
                                        <Users className="w-6 h-6 text-violet-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-semibold">Join Study Room</h3>
                                        <p className="text-zinc-400 text-sm">Study with friends</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    </div>

                    {/* Todo Widget */}
                    <div className="mt-8">
                        <TodoWidget />
                    </div>
                </div>
            </main>
        </div>
    )
}

function TodoWidget() {
    const { user } = useAuth()
    const [todos, setTodos] = useState<any[]>([])
    const [newTodo, setNewTodo] = useState('')

    useEffect(() => {
        if (!user) return
        const fetchTodos = async () => {
            try {
                const res = await fetch(`/api/todos?userId=${user.id}`)
                if (!res.ok) {
                    console.error('Todo fetch failed:', res.status)
                    return
                }
                const text = await res.text()
                if (!text) return
                const data = JSON.parse(text)
                if (data.todos) setTodos(data.todos)
            } catch (error) {
                console.error('Failed to fetch todos:', error)
            }
        }
        fetchTodos()
    }, [user])

    const handleAdd = async () => {
        if (!newTodo.trim() || !user) return
        const res = await fetch('/api/todos', {
            method: 'POST',
            body: JSON.stringify({ userId: user.id, content: newTodo })
        })
        const data = await res.json()
        if (data.todo) {
            setTodos([data.todo, ...todos])
            setNewTodo('')
        }
    }

    const handleToggle = async (id: string, completed: boolean) => {
        // Optimistic update
        setTodos(prev => prev.map(t => t.id === id ? { ...t, completed } : t))
        await fetch('/api/todos', {
            method: 'PUT',
            body: JSON.stringify({ id, completed })
        })
    }

    const handleDelete = async (id: string) => {
        setTodos(prev => prev.filter(t => t.id !== id))
        await fetch(`/api/todos?id=${id}`, { method: 'DELETE' })
    }

    return (
        <Card variant="glass" className="p-6">
            <h3 className="text-xl font-bold text-white mb-4">Task List</h3>

            <div className="flex gap-2 mb-4">
                <input
                    type="text"
                    value={newTodo}
                    onChange={(e) => setNewTodo(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                    placeholder="Add a new task..."
                    className="flex-1 bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500"
                />
                <Button onClick={handleAdd} size="sm">
                    <Plus className="w-4 h-4" />
                </Button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {todos.map(todo => (
                    <div key={todo.id} className="flex items-center gap-3 group">
                        <button
                            onClick={() => handleToggle(todo.id, !todo.completed)}
                            className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${todo.completed ? 'bg-violet-500 border-violet-500' : 'border-zinc-600 hover:border-zinc-500'
                                }`}
                        >
                            {todo.completed && <Check className="w-3 h-3 text-white" />}
                        </button>
                        <span className={`flex-1 text-sm ${todo.completed ? 'text-zinc-500 line-through' : 'text-zinc-200'}`}>
                            {todo.content}
                        </span>
                        <button
                            onClick={() => handleDelete(todo.id)}
                            className="text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}
                {todos.length === 0 && (
                    <p className="text-zinc-500 text-sm text-center py-4">No tasks yet. Stay organized!</p>
                )}
            </div>
        </Card>
    )
}
