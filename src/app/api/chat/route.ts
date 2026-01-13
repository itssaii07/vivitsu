import { NextRequest, NextResponse } from 'next/server'
import { chatWithAssistant, retrieveMemories, storeMemory } from '@/lib/ai'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
    try {
        const { message, userId } = await request.json()

        if (!message) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 })
        }

        // For now, use a demo user ID if not provided
        const effectiveUserId = userId || 'demo-user'

        // Get user profile (mock for now if DB not connected)
        let user = {
            id: effectiveUserId,
            name: 'Student',
            studyGoal: 'Improve my grades',
            subjects: ['General'],
        }

        try {
            const dbUser = await prisma.user.findUnique({
                where: { id: effectiveUserId },
            })
            if (dbUser) {
                user = {
                    id: dbUser.id,
                    name: dbUser.name || 'Student',
                    studyGoal: dbUser.studyGoal || 'Improve my grades',
                    subjects: dbUser.subjects || ['General'],
                }
            }
        } catch {
            // DB not connected, use default user
            console.log('Using demo user - database not connected')
        }

        // Get recent messages from database
        let recentMessages: { role: 'user' | 'assistant'; content: string }[] = []
        try {
            const dbMessages = await prisma.chatMessage.findMany({
                where: { userId: effectiveUserId },
                orderBy: { createdAt: 'desc' },
                take: 5,
            })
            recentMessages = dbMessages
                .reverse()
                .map((m) => ({
                    role: m.role as 'user' | 'assistant',
                    content: m.content,
                }))
        } catch {
            // DB not connected
        }

        // Retrieve relevant memories from vector DB
        let memories: { content: string }[] = []
        try {
            memories = await retrieveMemories(effectiveUserId, message)
        } catch {
            // Pinecone not connected
            console.log('Vector DB not connected, skipping memory retrieval')
        }

        // Generate response
        const response = await chatWithAssistant(message, {
            userName: user.name,
            studyGoal: user.studyGoal,
            subjects: user.subjects,
            recentMessages,
            memories,
        })

        // Store the interaction
        try {
            await prisma.chatMessage.createMany({
                data: [
                    { userId: effectiveUserId, role: 'user', content: message },
                    { userId: effectiveUserId, role: 'assistant', content: response },
                ],
            })

            // Store in vector DB for long-term memory
            await storeMemory(effectiveUserId, message, { type: 'user_message' })
        } catch {
            // DB not connected
        }

        return NextResponse.json({ response })
    } catch (error) {
        console.error('Chat error:', error)

        // Fallback response when AI is not configured
        const fallbackResponses = [
            "I'm your AI study assistant! To get personalized help, make sure OpenAI is configured. In the meantime, remember: consistency beats intensity. Keep showing up!",
            "While I'm connecting to my AI brain, here's a tip: Break your study sessions into 25-minute chunks with 5-minute breaks. It's called the Pomodoro Technique!",
            "Connection in progress... Pro tip: Teaching others what you learn is one of the best ways to retain information!",
        ]

        return NextResponse.json({
            response: fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)],
        })
    }
}

export async function GET(request: NextRequest) {
    try {
        const userId = request.nextUrl.searchParams.get('userId')

        if (!userId) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 })
        }

        const messages = await prisma.chatMessage.findMany({
            where: { userId },
            orderBy: { createdAt: 'asc' },
            take: 50
        })

        return NextResponse.json({ messages })
    } catch (error) {
        console.error('Get chat history error:', error)
        return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 })
    }
}
