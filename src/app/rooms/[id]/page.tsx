'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    Brain,
    ArrowLeft,
    Send,
    Users,
    Clock,
    Timer,
    Play,
    Pause,
    MessageSquare
} from 'lucide-react'
import { Button, Card } from '@/components/ui'
import { useSocket, useRoomStore } from '@/lib/socket'
import { useAuth } from '@/components/providers'
import { InviteButton } from '@/components/shared/InviteButton'

export default function RoomChatPage() {
    const params = useParams()
    const router = useRouter()
    const roomId = params.id as string
    const { user } = useAuth()
    const { joinRoom, leaveRoom, sendMessage, startTyping, stopTyping, startPomodoro, startBreak } = useSocket()
    const { isConnected, users, messages, typingUsers, pomodoroStatus } = useRoomStore()

    const [input, setInput] = useState('')
    const [roomName, setRoomName] = useState('Study Room')
    const [pomodoroMins, setPomodoroMins] = useState(25)
    const [breakMins, setBreakMins] = useState(5)
    const [timeLeft, setTimeLeft] = useState<number | null>(null)

    const messagesEndRef = useRef<HTMLDivElement>(null)
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    // Join room on mount or when connected
    useEffect(() => {
        if (isConnected && user) {
            const userName = user.user_metadata?.name || 'Anonymous'
            const userAvatar = user.user_metadata?.avatarUrl
            joinRoom(roomId, user.id, userName, userAvatar)
        }
    }, [isConnected, user, roomId, joinRoom])

    // Track user for cleanup
    const userRef = useRef(user)
    useEffect(() => { userRef.current = user }, [user])

    // Cleanup on unmount or room change
    useEffect(() => {
        return () => {
            if (userRef.current) {
                leaveRoom(roomId, userRef.current.id)
            }
        }
    }, [roomId, leaveRoom])

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    // Pomodoro timer
    useEffect(() => {
        if (!pomodoroStatus?.endTime) {
            setTimeLeft(null)
            return
        }

        const interval = setInterval(() => {
            const remaining = Math.max(0, Math.floor((new Date(pomodoroStatus.endTime!).getTime() - Date.now()) / 1000))
            setTimeLeft(remaining)

            if (remaining === 0) {
                // Timer ended
                clearInterval(interval)
            }
        }, 1000)

        return () => clearInterval(interval)
    }, [pomodoroStatus])

    const handleSend = () => {
        if (!input.trim() || !user) return

        const userName = user.user_metadata?.name || 'Anonymous'
        const userAvatar = user.user_metadata?.avatarUrl
        sendMessage(roomId, user.id, userName, userAvatar, input.trim())
        setInput('')
        stopTyping(roomId, user.id)
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInput(e.target.value)

        if (!user) return

        // Handle typing indicator
        const userName = user.user_metadata?.name || 'Anonymous'
        startTyping(roomId, user.id, userName)

        // Clear previous timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current)
        }

        // Stop typing after 2 seconds of inactivity
        typingTimeoutRef.current = setTimeout(() => {
            stopTyping(roomId, user.id)
        }, 2000)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-violet-950/10 to-zinc-950 flex">
            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col h-screen">
                {/* Header */}
                <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" onClick={() => router.push('/rooms')}>
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <h1 className="text-xl font-bold text-white">{roomName}</h1>
                            <div className="flex items-center gap-2 text-sm text-zinc-400">
                                <div className="w-2 h-2 rounded-full bg-green-400" />
                                {users.length} {users.length === 1 ? 'person' : 'people'} studying
                            </div>
                        </div>
                    </div>

                    {/* Pomodoro Timer */}
                    <div className="flex items-center gap-4">
                        {timeLeft !== null && (
                            <div className={`px-4 py-2 rounded-xl font-mono text-xl font-bold ${pomodoroStatus?.status === 'break'
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-violet-500/20 text-violet-400'
                                }`}>
                                {formatTime(timeLeft)}
                                <span className="text-sm ml-2 font-normal">
                                    {pomodoroStatus?.status === 'break' ? 'Break' : 'Focus'}
                                </span>
                            </div>
                        )}
                        {timeLeft === null && (
                            <div className="flex items-center gap-2">
                                <Button
                                    size="sm"
                                    onClick={() => startPomodoro(roomId, pomodoroMins)}
                                >
                                    <Play className="w-4 h-4" />
                                    Start {pomodoroMins}min
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.length === 0 && (
                        <div className="text-center py-16 text-zinc-500">
                            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>No messages yet. Say hello! 👋</p>
                        </div>
                    )}

                    {messages.map((message) => {
                        const isOwnMessage = message.userId === user?.id
                        return (
                            <div
                                key={message.id}
                                className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : ''}`}
                            >
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium overflow-hidden ${isOwnMessage
                                    ? 'bg-violet-600 text-white'
                                    : 'bg-zinc-700 text-zinc-300'
                                    }`}>
                                    {message.userAvatar ? (
                                        <img src={message.userAvatar} alt={message.userName} className="w-full h-full object-cover" />
                                    ) : (
                                        message.userName.charAt(0).toUpperCase()
                                    )}
                                </div>
                                <div className={`max-w-md ${isOwnMessage ? 'text-right' : ''}`}>
                                    <p className="text-xs text-zinc-500 mb-1">
                                        {isOwnMessage ? 'You' : message.userName}
                                    </p>
                                    <div className={`px-4 py-2 rounded-2xl ${isOwnMessage
                                        ? 'bg-violet-600 text-white rounded-br-md'
                                        : 'bg-zinc-800 text-zinc-100 rounded-bl-md'
                                        }`}>
                                        {message.content}
                                    </div>
                                </div>
                            </div>
                        )
                    })}

                    {/* Typing indicator */}
                    {typingUsers.length > 0 && (
                        <div className="flex items-center gap-2 text-zinc-500 text-sm">
                            <div className="flex gap-1">
                                <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" />
                                <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce delay-100" />
                                <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce delay-200" />
                            </div>
                            {typingUsers.map((u) => u.userName).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-zinc-800">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            placeholder="Type a message..."
                            className="flex-1 h-12 px-4 rounded-xl bg-zinc-800/50 border border-zinc-700 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                        />
                        <Button onClick={handleSend} disabled={!input.trim()} className="h-12 w-12 p-0">
                            <Send className="w-5 h-5" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Sidebar - Users */}
            <div className="w-64 border-l border-zinc-800 p-4 hidden lg:block">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-violet-400" />
                    In this room
                </h2>
                <div className="space-y-3">
                    {users.map((roomUser) => (
                        <div key={roomUser.id} className="flex items-center gap-3">
                            <div className="relative">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-medium overflow-hidden ${roomUser.id === user?.id
                                    ? 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white'
                                    : 'bg-zinc-700 text-zinc-300'
                                    }`}>
                                    {roomUser.avatarUrl ? (
                                        <img src={roomUser.avatarUrl} alt={roomUser.name} className="w-full h-full object-cover" />
                                    ) : (
                                        roomUser.name.charAt(0).toUpperCase()
                                    )}
                                </div>
                                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-zinc-900" />
                            </div>
                            <div>
                                <p className="text-white text-sm font-medium">
                                    {roomUser.name}
                                    {roomUser.id === user?.id && ' (You)'}
                                </p>
                                <div className="flex items-center gap-2">
                                    <p className="text-zinc-500 text-xs">Studying</p>
                                    {roomUser.id !== user?.id && (
                                        <InviteButton targetId={roomUser.id} minimal />
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Quick Actions */}
                <div className="mt-8">
                    <h3 className="text-sm font-medium text-zinc-400 mb-3">Quick Actions</h3>
                    <div className="space-y-2">
                        <Button variant="secondary" size="sm" className="w-full justify-start" onClick={() => startPomodoro(roomId, 25)}>
                            <Timer className="w-4 h-4" />
                            Start 25min Focus
                        </Button>
                        <Button variant="secondary" size="sm" className="w-full justify-start" onClick={() => startBreak(roomId, 5)}>
                            <Clock className="w-4 h-4" />
                            Start 5min Break
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
