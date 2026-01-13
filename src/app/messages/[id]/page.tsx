'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    ArrowLeft,
    Send,
    MessageSquare,
    MoreVertical,
    Phone,
    Video,
    Image as ImageIcon,
    Paperclip,
    FileText,
    Download
} from 'lucide-react'
import { Button } from '@/components/ui'
import { useSocket, useRoomStore } from '@/lib/socket'
import { useAuth } from '@/components/providers'
import { supabase } from '@/lib/supabase'

export default function DirectMessagePage() {
    const params = useParams()
    const router = useRouter()
    const roomId = params.id as string
    const { user } = useAuth()
    const { joinRoom, leaveRoom, sendMessage, startTyping, stopTyping } = useSocket()
    const { isConnected, users, messages, typingUsers, setMessages } = useRoomStore()

    const [input, setInput] = useState('')
    const [uploading, setUploading] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Identify the other user
    const otherUser = users.find(u => u.id !== user?.id)

    // Load history
    useEffect(() => {
        if (roomId) {
            fetch(`/api/messages?roomId=${roomId}`)
                .then(res => res.json())
                .then(data => {
                    if (data.messages) {
                        setMessages(data.messages)
                    }
                })
        }
    }, [roomId, setMessages])

    // Join room logic
    useEffect(() => {
        if (isConnected && user) {
            const userName = user.user_metadata?.name || 'Anonymous'
            const userAvatar = user.user_metadata?.avatarUrl
            joinRoom(roomId, user.id, userName, userAvatar)
        }
    }, [isConnected, user, roomId, joinRoom])

    // Cleanup
    const userRef = useRef(user)
    useEffect(() => { userRef.current = user }, [user])
    useEffect(() => {
        return () => {
            if (userRef.current) {
                leaveRoom(roomId, userRef.current.id)
            }
        }
    }, [roomId, leaveRoom])

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const handleSend = async (content: string, type: 'TEXT' | 'IMAGE' | 'FILE' = 'TEXT', fileUrl?: string) => {
        if (!content.trim() && !fileUrl) return
        if (!user) return

        try {
            const res = await fetch('/api/messages', {
                method: 'POST',
                body: JSON.stringify({
                    roomId,
                    userId: user.id,
                    content,
                    type,
                    fileUrl
                })
            })

            // We emit the full message details to the socket so everyone (including us) receives it correctly
            const userName = user.user_metadata?.name || 'Anonymous'
            const userAvatar = user.user_metadata?.avatarUrl

            sendMessage(roomId, user.id, userName, userAvatar, content, type, fileUrl)

            setInput('')
            stopTyping(roomId, user.id)
        } catch (error) {
            console.error('Failed to send', error)
        }
    }

    // ... (rest of component until render loop)
    // I need to skip lines 140-237 to target the render loop effectively, but replace_file_content needs contiguous block.
    // I will split this into two calls or use multi_replace if needed. 
    // Wait, I can target the handleSend separately and then the render map.
    // Let's do handleSend first as it's cleaner.

    // Actually, I'll do handleSend first.
    // Then I'll do the UI update in a second call.

    // WAIT, I must return matching content for the StartLine/EndLine I chose.
    // Previous call failed because I tried to include too much context or mismatched something.
    // I will use `replace_file_content` for `handleSend` ONLY first.


    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !user) return

        setUploading(true)
        try {
            // Upload to Supabase
            const fileExt = file.name.split('.').pop()
            const fileName = `${Math.random()}.${fileExt}`
            const filePath = `${roomId}/${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('chat-uploads') // Bucket we asked user to create
                .upload(filePath, file)

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('chat-uploads')
                .getPublicUrl(filePath)

            const type = file.type.startsWith('image/') ? 'IMAGE' : 'FILE'
            await handleSend(file.name, type, publicUrl)

        } catch (error) {
            console.error('Upload failed', error)
            alert('Failed to upload file. Make sure "chat-uploads" bucket exists and is public.')
        } finally {
            setUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInput(e.target.value)
        if (!user) return
        const userName = user.user_metadata?.name || 'Anonymous'
        startTyping(roomId, user.id, userName)
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = setTimeout(() => {
            stopTyping(roomId, user.id)
        }, 2000)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend(input)
        }
    }

    return (
        <div className="flex-1 flex flex-col h-screen bg-black w-full">
            {/* Header */}
            <div className="h-[73px] border-b border-zinc-800 flex items-center justify-between px-6 bg-zinc-950 flex-shrink-0">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" className="md:hidden -ml-2" onClick={() => router.push('/messages')}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden">
                            {otherUser?.avatarUrl ? (
                                <img src={otherUser.avatarUrl} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-zinc-400 font-medium">
                                    {otherUser?.name?.[0] || '?'}
                                </span>
                            )}
                        </div>
                        <div>
                            <h1 className="font-semibold text-white">
                                {otherUser?.name || 'Loading...'}
                            </h1>
                            <p className="text-xs text-zinc-500">
                                {otherUser ? 'Active now' : 'Connecting...'}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <Phone className="w-6 h-6 text-zinc-400 cursor-pointer hover:text-white transition-colors" />
                    <Video className="w-6 h-6 text-zinc-400 cursor-pointer hover:text-white transition-colors" />
                    <MoreVertical className="w-6 h-6 text-zinc-400 cursor-pointer hover:text-white transition-colors" />
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-zinc-500 space-y-4">
                        <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center">
                            <MessageSquare className="w-8 h-8 opacity-50" />
                        </div>
                        <p>Start the conversation!</p>
                    </div>
                )}

                {messages.map((message: any) => { // using any to bypass strict type check for now on updated message shape
                    const isOwn = message.userId === user?.id
                    return (
                        <div key={message.id} className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}>
                            {!isOwn && (
                                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                                    {message.userAvatar ? <img src={message.userAvatar} className="w-full h-full object-cover" /> : message.userName[0]}
                                </div>
                            )}
                            <div className={`max-w-[70%] space-y-1 ${isOwn ? 'items-end flex flex-col' : ''}`}>
                                <div className={`px-4 py-2 rounded-2xl ${isOwn
                                    ? 'bg-violet-600 text-white rounded-br-sm'
                                    : 'bg-zinc-800 text-zinc-100 rounded-bl-sm'
                                    }`}>
                                    {message.type === 'IMAGE' ? (
                                        <div className="space-y-2 cursor-pointer" onClick={() => window.open(message.fileUrl, '_blank')}>
                                            <img
                                                src={message.fileUrl}
                                                alt="Shared image"
                                                className="max-w-full rounded-lg max-h-72 object-cover hover:opacity-90 transition-opacity"
                                            />
                                            {message.content && <p className="text-sm opacity-90">{message.content}</p>}
                                        </div>
                                    ) : message.type === 'FILE' ? (
                                        <a
                                            href={message.fileUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-3 p-1 rounded-lg hover:bg-white/10 transition-colors group"
                                        >
                                            <div className="w-10 h-10 rounded bg-white/20 flex items-center justify-center flex-shrink-0">
                                                <FileText className="w-6 h-6" />
                                            </div>
                                            <div className="min-w-[120px]">
                                                <p className="text-sm font-medium truncate max-w-[150px] group-hover:underline">
                                                    {message.content}
                                                </p>
                                                <p className="text-xs opacity-70 flex items-center gap-1">
                                                    Attachment <Download className="w-3 h-3" />
                                                </p>
                                            </div>
                                        </a>
                                    ) : (
                                        message.content
                                    )}
                                </div>
                                <span className="text-[10px] text-zinc-600 px-1 block">
                                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    )
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Typing Indicator */}
            {typingUsers.length > 0 && (
                <div className="px-4 py-2 text-xs text-zinc-500 flex items-center gap-2">
                    <span className="animate-pulse">Typing...</span>
                </div>
            )}

            {/* Input Area */}
            <div className="p-4 bg-zinc-900/50 border-t border-zinc-800">
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileUpload}
                />

                <div className="max-w-4xl mx-auto flex gap-2">
                    <button
                        className="p-2 text-zinc-400 hover:text-white transition-colors"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                    >
                        <Paperclip className="w-6 h-6" />
                    </button>
                    <input
                        type="text"
                        value={input}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        placeholder={uploading ? "Uploading..." : "Type a message..."}
                        className="flex-1 h-11 px-4 rounded-full bg-zinc-800 border-none text-white focus:ring-2 focus:ring-violet-500 placeholder:text-zinc-600"
                        disabled={uploading}
                    />
                    <Button onClick={() => handleSend(input)} disabled={!input.trim() || uploading} className="rounded-full w-11 h-11 p-0 bg-violet-600 hover:bg-violet-700">
                        <Send className="w-5 h-5 ml-0.5" />
                    </Button>
                </div>
            </div>
        </div>
    )
}
