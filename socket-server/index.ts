import { Server as SocketServer } from 'socket.io'
import { createServer } from 'http'

const httpServer = createServer()
const io = new SocketServer(httpServer, {
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
    },
})

// Track users in rooms
const roomUsers = new Map<string, Map<string, { id: string; name: string; avatarUrl?: string; joinedAt: Date }>>()

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`)

    let currentRoom: string | null = null
    let currentUser: { id: string; name: string; avatarUrl?: string } | null = null

    // Join a room
    socket.on('join_room', ({ roomId, userId, userName, userAvatar }) => {
        currentRoom = roomId
        currentUser = { id: userId, name: userName, avatarUrl: userAvatar }

        socket.join(roomId)

        // Track user in room
        if (!roomUsers.has(roomId)) {
            roomUsers.set(roomId, new Map())
        }
        roomUsers.get(roomId)!.set(userId, {
            id: userId,
            name: userName,
            avatarUrl: userAvatar,
            joinedAt: new Date(),
        })

        // Notify others
        socket.to(roomId).emit('user_joined', {
            userId,
            userName,
            userAvatar,
            timestamp: new Date(),
        })

        // Send current room users to the joining user
        const users = Array.from(roomUsers.get(roomId)!.values())
        socket.emit('room_users', users)

        console.log(`${userName} joined room ${roomId}`)
    })

    // Leave a room
    socket.on('leave_room', ({ roomId, userId }) => {
        socket.leave(roomId)

        if (roomUsers.has(roomId)) {
            const user = roomUsers.get(roomId)!.get(userId)
            roomUsers.get(roomId)!.delete(userId)

            // Notify others
            socket.to(roomId).emit('user_left', {
                userId,
                userName: user?.name || 'Unknown',
                timestamp: new Date(),
            })
        }

        currentRoom = null
        currentUser = null
    })

    // Send a message
    socket.on('send_message', ({ roomId, userId, userName, userAvatar, content }) => {
        const message = {
            id: `${Date.now()}-${userId}`,
            userId,
            userName,
            userAvatar,
            content,
            timestamp: new Date(),
        }

        // Broadcast to room (including sender)
        io.to(roomId).emit('new_message', message)

        console.log(`[${roomId}] ${userName}: ${content}`)
    })

    // Typing indicator
    socket.on('typing_start', ({ roomId, userId, userName }) => {
        socket.to(roomId).emit('user_typing', { userId, userName, isTyping: true })
    })

    socket.on('typing_stop', ({ roomId, userId }) => {
        socket.to(roomId).emit('user_typing', { userId, isTyping: false })
    })

    // Pomodoro sync
    socket.on('pomodoro_start', ({ roomId, endTime }) => {
        io.to(roomId).emit('pomodoro_update', { status: 'active', endTime })
    })

    socket.on('pomodoro_break', ({ roomId, endTime }) => {
        io.to(roomId).emit('pomodoro_update', { status: 'break', endTime })
    })

    // Disconnect
    socket.on('disconnect', () => {
        if (currentRoom && currentUser) {
            if (roomUsers.has(currentRoom)) {
                roomUsers.get(currentRoom)!.delete(currentUser.id)

                socket.to(currentRoom).emit('user_left', {
                    userId: currentUser.id,
                    userName: currentUser.name,
                    timestamp: new Date(),
                })
            }
        }
        console.log(`User disconnected: ${socket.id}`)
    })
})

const PORT = process.env.SOCKET_PORT || 3001

httpServer.listen(PORT, () => {
    console.log(`🔌 Socket.io server running on port ${PORT}`)
})

export { io }
