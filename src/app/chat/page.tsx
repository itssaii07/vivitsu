'use client'

import { useState, useRef, useEffect } from 'react'
import {
    Brain,
    Send,
    Sparkles,
    User,
    MessageSquare,
    FileText
} from 'lucide-react'
import { Button, Card } from '@/components/ui'
import { useChatStore } from '@/stores'
import { Sidebar } from '@/components/layout/Sidebar'
import { useAuth } from '@/components/providers'
import { SummarizerTool } from '@/components/tools/SummarizerTool'

export default function ChatPage() {
    const { messages, isLoading, addMessage, setLoading, fetchHistory } = useChatStore()
    const [input, setInput] = useState('')
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const { user } = useAuth()

    // Tabs state
    const [activeTab, setActiveTab] = useState<'chat' | 'summarizer'>('chat')

    useEffect(() => {
        if (user) {
            fetchHistory(user.id)
        }
    }, [user])

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        if (activeTab === 'chat') {
            scrollToBottom()
        }
    }, [messages, activeTab])

    const handleSend = async () => {
        if (!input.trim() || isLoading) return

        const userMessage = {
            id: Date.now().toString(),
            role: 'user' as const,
            content: input.trim(),
            createdAt: new Date(),
        }

        addMessage(userMessage)
        setInput('')
        setLoading(true)

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: input.trim() }),
            })

            const data = await response.json()

            addMessage({
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.response || "I'm here to help! What would you like to study today?",
                createdAt: new Date(),
            })
        } catch {
            addMessage({
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: "I'm having trouble connecting. Please try again!",
                createdAt: new Date(),
            })
        } finally {
            setLoading(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-violet-950/10 to-zinc-950">
            <Sidebar />

            <main className="ml-64 h-screen flex flex-col">
                {/* Header with Tabs */}
                <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white">AI Assistant</h1>
                            <p className="text-zinc-400 text-sm">Your all-in-one study companion</p>
                        </div>
                    </div>

                    {/* Tab Switcher */}
                    <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800">
                        <button
                            onClick={() => setActiveTab('chat')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'chat'
                                    ? 'bg-zinc-800 text-white shadow-sm'
                                    : 'text-zinc-500 hover:text-zinc-300'
                                }`}
                        >
                            <MessageSquare className="w-4 h-4" />
                            Chat
                        </button>
                        <button
                            onClick={() => setActiveTab('summarizer')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'summarizer'
                                    ? 'bg-zinc-800 text-white shadow-sm'
                                    : 'text-zinc-500 hover:text-zinc-300'
                                }`}
                        >
                            <FileText className="w-4 h-4" />
                            Summarizer
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto relative">

                    {/* Chat Tab */}
                    {activeTab === 'chat' && (
                        <div className="flex flex-col h-full">
                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                {messages.length === 0 && (
                                    <div className="flex flex-col items-center justify-center h-full text-center">
                                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-600/20 to-indigo-600/20 flex items-center justify-center mb-6">
                                            <Brain className="w-10 h-10 text-violet-400" />
                                        </div>
                                        <h2 className="text-2xl font-bold text-white mb-2">How can I help you study?</h2>
                                        <p className="text-zinc-400 max-w-md mb-8">
                                            I remember your goals and past conversations to give you personalized guidance.
                                        </p>
                                        <div className="flex flex-wrap gap-3 justify-center max-w-lg">
                                            {[
                                                "Help me create a study plan",
                                                "Explain a concept I'm stuck on",
                                                "Quiz me on my subjects",
                                                "Give me motivation tips",
                                            ].map((suggestion) => (
                                                <button
                                                    key={suggestion}
                                                    onClick={() => setInput(suggestion)}
                                                    className="px-4 py-2 rounded-xl bg-zinc-800/50 border border-zinc-700 text-zinc-300 hover:bg-zinc-700/50 hover:border-violet-500/50 transition-all text-sm"
                                                >
                                                    {suggestion}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {messages.map((message) => (
                                    <div
                                        key={message.id}
                                        className={`flex gap-4 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                                    >
                                        <div
                                            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${message.role === 'user'
                                                ? 'bg-zinc-700'
                                                : 'bg-gradient-to-br from-violet-600 to-indigo-600'
                                                }`}
                                        >
                                            {message.role === 'user' ? (
                                                <User className="w-5 h-5 text-zinc-300" />
                                            ) : (
                                                <Brain className="w-5 h-5 text-white" />
                                            )}
                                        </div>
                                        <Card
                                            variant={message.role === 'user' ? 'default' : 'glass'}
                                            className={`max-w-2xl ${message.role === 'user'
                                                ? 'bg-zinc-800/50 border-zinc-700'
                                                : ''
                                                }`}
                                        >
                                            <p className="text-zinc-100 whitespace-pre-wrap">{message.content}</p>
                                        </Card>
                                    </div>
                                ))}

                                {isLoading && (
                                    <div className="flex gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shrink-0">
                                            <Brain className="w-5 h-5 text-white" />
                                        </div>
                                        <Card variant="glass" className="max-w-2xl">
                                            <div className="flex gap-1">
                                                <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" />
                                                <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce delay-100" />
                                                <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce delay-200" />
                                            </div>
                                        </Card>
                                    </div>
                                )}

                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input */}
                            <div className="p-6 border-t border-zinc-800">
                                <div className="flex gap-4 max-w-4xl mx-auto">
                                    <input
                                        type="text"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Ask me anything about your studies..."
                                        className="flex-1 h-12 px-4 rounded-xl bg-zinc-800/50 border border-zinc-700 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                                    />
                                    <Button
                                        onClick={handleSend}
                                        disabled={!input.trim() || isLoading}
                                        className="h-12 w-12 p-0"
                                    >
                                        <Send className="w-5 h-5" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Summarizer Tab */}
                    {activeTab === 'summarizer' && (
                        <div className="h-full overflow-y-auto">
                            <SummarizerTool />
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}
