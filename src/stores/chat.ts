import { create } from 'zustand'

interface ChatMessage {
    id: string
    role: 'user' | 'assistant'
    content: string
    createdAt: Date
}

interface ChatState {
    messages: ChatMessage[]
    isLoading: boolean
    addMessage: (message: ChatMessage) => void
    setMessages: (messages: ChatMessage[]) => void
    setLoading: (loading: boolean) => void
    clearMessages: () => void
    fetchHistory: (userId: string) => Promise<void>
}

export const useChatStore = create<ChatState>((set) => ({
    messages: [],
    isLoading: false,
    addMessage: (message) =>
        set((state) => ({ messages: [...state.messages, message] })),
    setMessages: (messages) => set({ messages }),
    setLoading: (isLoading) => set({ isLoading }),
    clearMessages: () => set({ messages: [] }),
    fetchHistory: async (userId: string) => {
        try {
            const res = await fetch(`/api/chat?userId=${userId}`)
            const data = await res.json()
            if (data.messages) {
                const formatted = data.messages.map((m: any) => ({
                    id: m.id,
                    role: m.role,
                    content: m.content,
                    createdAt: new Date(m.createdAt)
                }))
                set({ messages: formatted })
                // Scroll to bottom handles itself via useEffect in component
            }
        } catch (error) {
            console.error('Failed to fetch chat history', error)
        }
    }
}))
