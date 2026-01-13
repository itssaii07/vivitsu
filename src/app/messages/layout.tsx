'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Sidebar } from '@/components/layout/Sidebar'
import { useAuth } from '@/components/providers'
import { MessageSquare, Search, Plus } from 'lucide-react'

export default function MessagesLayout({ children }: { children: React.ReactNode }) {
    const { user } = useAuth()
    const router = useRouter()
    const params = useParams()
    const pathname = usePathname()
    const [chats, setChats] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!user) return
        fetch(`/api/direct-messages?userId=${user.id}`)
            .then(res => res.json())
            .then(data => {
                if (data.chats) setChats(data.chats)
            })
            .finally(() => setLoading(false))
    }, [user])

    // On mobile, if we are in a chat ([id]), we hide the list
    // If we are at /messages, we show the list
    const isChatOpen = pathname !== '/messages'

    return (
        <div className="flex h-screen bg-black">
            <Sidebar />

            <div className="flex-1 flex ml-64">
                {/* Chat List Sidebar */}
                <div className={`w-full md:w-80 border-r border-zinc-800 bg-zinc-950 flex flex-col ${isChatOpen ? 'hidden md:flex' : 'flex'}`}>
                    <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
                        <h1 className="text-xl font-bold text-white">Messages</h1>
                        <button onClick={() => router.push('/profile')} className="text-zinc-400 hover:text-white">
                            <Plus className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="p-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                            <input
                                type="text"
                                placeholder="Search messages"
                                className="w-full h-9 pl-9 bg-zinc-900 rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-700"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <div className="p-4 text-center text-zinc-500">Loading...</div>
                        ) : chats.length === 0 ? (
                            <div className="p-8 text-center text-zinc-500">
                                <p>No messages yet.</p>
                                <button onClick={() => router.push('/profile')} className="text-violet-400 text-sm mt-2 hover:underline">
                                    Start a chat from friends
                                </button>
                            </div>
                        ) : (
                            chats.map(chat => (
                                <Link
                                    key={chat.id}
                                    href={`/messages/${chat.id}`}
                                    className={`flex items-center gap-3 p-4 hover:bg-zinc-900 transition-colors ${pathname.includes(chat.id) ? 'bg-zinc-900' : ''}`}
                                >
                                    <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                                        {chat.avatarUrl ? (
                                            <img src={chat.avatarUrl} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-lg font-medium text-zinc-400">
                                                {chat.name?.[0] || '?'}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline mb-1">
                                            <h3 className="text-sm font-semibold text-white truncate">{chat.name}</h3>
                                            <span className="text-xs text-zinc-500 whitespace-nowrap ml-2">
                                                {new Date(chat.timestamp).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p className="text-sm text-zinc-400 truncate">
                                            {/* You: {chat.lastMessage} logic could be added if userId matches sender */}
                                            {chat.lastMessage}
                                        </p>
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                </div>

                {/* Main Content (Child Page) */}
                <div className={`flex-1 bg-black ${!isChatOpen ? 'hidden md:flex' : 'flex'}`}>
                    {children}
                </div>
            </div>
        </div>
    )
}
