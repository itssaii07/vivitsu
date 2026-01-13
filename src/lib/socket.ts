'use client'

import { useEffect, useRef, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { create } from 'zustand'

interface RoomUser {
    id: string
    name: string
    avatarUrl?: string
    joinedAt: Date
}

interface RoomMessage {
    id: string
    userId: string
    userName: string
    userAvatar?: string
    content: string
    timestamp: Date
}

// ... (skipping RoomState definition as interfaces above are what matters, but I should be careful not to break it)

interface RoomState {
    socket: Socket | null
    isConnected: boolean
    currentRoomId: string | null
    users: RoomUser[]
    messages: RoomMessage[]
    typingUsers: { userId: string; userName: string }[]
    pomodoroStatus: { status: 'idle' | 'active' | 'break'; endTime?: Date } | null
    setSocket: (socket: Socket | null) => void
    setConnected: (connected: boolean) => void
    setRoomId: (roomId: string | null) => void
    setUsers: (users: RoomUser[]) => void
    addUser: (user: RoomUser) => void
    removeUser: (userId: string) => void
    addMessage: (message: RoomMessage) => void
    setMessages: (messages: RoomMessage[]) => void
    setTyping: (userId: string, userName: string, isTyping: boolean) => void
    setPomodoroStatus: (status: RoomState['pomodoroStatus']) => void
    reset: () => void
}

export const useRoomStore = create<RoomState>((set) => ({
    socket: null,
    isConnected: false,
    currentRoomId: null,
    users: [],
    messages: [],
    typingUsers: [],
    pomodoroStatus: null,
    setSocket: (socket) => set({ socket }),
    setConnected: (isConnected) => set({ isConnected }),
    setRoomId: (currentRoomId) => set({ currentRoomId }),
    setUsers: (users) => set({ users }),
    addUser: (user) => set((state) => {
        if (state.users.some(u => u.id === user.id)) return state
        return { users: [...state.users, user] }
    }),
    removeUser: (userId) => set((state) => ({
        users: state.users.filter((u) => u.id !== userId)
    })),
    addMessage: (message) => set((state) => ({
        messages: [...state.messages, message]
    })),
    setMessages: (messages) => set({ messages }),
    setTyping: (userId, userName, isTyping) => set((state) => ({
        typingUsers: isTyping
            ? [...state.typingUsers.filter((u) => u.userId !== userId), { userId, userName }]
            : state.typingUsers.filter((u) => u.userId !== userId),
    })),
    setPomodoroStatus: (pomodoroStatus) => set({ pomodoroStatus }),
    reset: () => set({
        currentRoomId: null,
        users: [],
        messages: [],
        typingUsers: [],
        pomodoroStatus: null,
    }),
}))

export function useSocket() {
    const socketRef = useRef<Socket | null>(null)
    const {
        setSocket,
        setConnected,
        setUsers,
        addUser,
        removeUser,
        addMessage,
        setTyping,
        setPomodoroStatus,
    } = useRoomStore()

    useEffect(() => {
        const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001'

        const socket = io(socketUrl, {
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        })

        socketRef.current = socket
        setSocket(socket)

        socket.on('connect', () => {
            console.log('Socket connected:', socket.id)
            setConnected(true)
        })

        socket.on('disconnect', () => {
            console.log('Socket disconnected')
            setConnected(false)
        })

        socket.on('room_users', (users: any[]) => {
            const parsedUsers = users.map(u => ({
                ...u,
                joinedAt: new Date(u.joinedAt)
            }))
            setUsers(parsedUsers)
        })

        socket.on('user_joined', (data: { userId: string; userName: string; userAvatar?: string }) => {
            addUser({ id: data.userId, name: data.userName, avatarUrl: data.userAvatar, joinedAt: new Date() })
        })

        socket.on('user_left', (data: { userId: string }) => {
            removeUser(data.userId)
        })

        socket.on('new_message', (message: any) => {
            addMessage({
                ...message,
                timestamp: new Date(message.timestamp)
            })
        })

        socket.on('user_typing', (data: { userId: string; userName?: string; isTyping: boolean }) => {
            setTyping(data.userId, data.userName || '', data.isTyping)
        })

        socket.on('pomodoro_update', (status: { status: 'active' | 'break'; endTime?: string }) => {
            setPomodoroStatus({
                status: status.status,
                endTime: status.endTime ? new Date(status.endTime) : undefined,
            })
        })

        return () => {
            socket.disconnect()
            setSocket(null)
            setConnected(false)
        }
    }, [setSocket, setConnected, setUsers, addUser, removeUser, addMessage, setTyping, setPomodoroStatus])

    const joinRoom = useCallback((roomId: string, userId: string, userName: string, userAvatar?: string) => {
        socketRef.current?.emit('join_room', { roomId, userId, userName, userAvatar })
        useRoomStore.getState().setRoomId(roomId)
    }, [])

    const leaveRoom = useCallback((roomId: string, userId: string) => {
        socketRef.current?.emit('leave_room', { roomId, userId })
        useRoomStore.getState().reset()
    }, [])

    const sendMessage = useCallback((roomId: string, userId: string, userName: string, userAvatar: string | undefined, content: string) => {
        socketRef.current?.emit('send_message', { roomId, userId, userName, userAvatar, content })
    }, [])

    const startTyping = useCallback((roomId: string, userId: string, userName: string) => {
        socketRef.current?.emit('typing_start', { roomId, userId, userName })
    }, [])

    const stopTyping = useCallback((roomId: string, userId: string) => {
        socketRef.current?.emit('typing_stop', { roomId, userId })
    }, [])

    const startPomodoro = useCallback((roomId: string, durationMins: number) => {
        const endTime = new Date(Date.now() + durationMins * 60 * 1000)
        socketRef.current?.emit('pomodoro_start', { roomId, endTime })
    }, [])

    const startBreak = useCallback((roomId: string, durationMins: number) => {
        const endTime = new Date(Date.now() + durationMins * 60 * 1000)
        socketRef.current?.emit('pomodoro_break', { roomId, endTime })
    }, [])

    return {
        socket: socketRef.current,
        joinRoom,
        leaveRoom,
        sendMessage,
        startTyping,
        stopTyping,
        startPomodoro,
        startBreak,
    }
}
