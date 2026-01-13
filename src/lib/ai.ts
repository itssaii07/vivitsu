import Groq from 'groq-sdk'
import { Pinecone } from '@pinecone-database/pinecone'

// Check if Groq is configured
const isGroqConfigured = Boolean(process.env.GROQ_API_KEY)

// Groq client (free and fast!)
export const groq = isGroqConfigured
    ? new Groq({ apiKey: process.env.GROQ_API_KEY })
    : null

// Pinecone client (only create if configured)
const isPineconeConfigured = Boolean(process.env.PINECONE_API_KEY)
export const pinecone = isPineconeConfigured
    ? new Pinecone({ apiKey: process.env.PINECONE_API_KEY! })
    : null

// Get the index for user memories
export const getMemoryIndex = () => {
    if (!pinecone) return null
    return pinecone.index(process.env.PINECONE_INDEX_NAME || 'vivitsu-memory')
}

// Generate embeddings for text (simplified without OpenAI)
export async function generateEmbedding(text: string): Promise<number[]> {
    // For now, return empty - Pinecone is optional
    // Could use a free embedding API in the future
    return []
}

// Store a memory in Pinecone
export async function storeMemory(
    userId: string,
    content: string,
    metadata: Record<string, string | number>
) {
    // Skip if Pinecone not configured (optional feature)
    const index = getMemoryIndex()
    if (!index) return

    // Would need embeddings - skip for now
}

// Retrieve relevant memories for a user
export async function retrieveMemories(
    userId: string,
    query: string,
    topK: number = 3
) {
    // Return empty if Pinecone not configured
    return []
}

// Chat with the AI assistant using Groq (Llama 3)
export async function chatWithAssistant(
    userMessage: string,
    context: {
        userName: string
        studyGoal: string
        subjects: string[]
        recentMessages: { role: 'user' | 'assistant'; content: string }[]
        memories: { content: string }[]
    }
) {
    if (!groq) {
        throw new Error('Groq not configured - add GROQ_API_KEY to .env')
    }

    const systemPrompt = `You are a personalized AI study assistant for ${context.userName}. 

STUDENT PROFILE:
- Study Goal: ${context.studyGoal || 'Not set'}
- Subjects: ${context.subjects.join(', ') || 'Not specified'}

RELEVANT PAST CONTEXT:
${context.memories.map((m) => `- ${m.content}`).join('\n') || 'No previous context'}

INSTRUCTIONS:
1. Be encouraging, specific, and actionable
2. Reference their goal and subjects when relevant
3. Remember and build on previous conversations
4. Keep responses concise (2-3 paragraphs max)
5. If they seem stuck, offer specific study strategies
6. Celebrate their progress and consistency`

    const messages: Groq.ChatCompletionMessageParam[] = [
        { role: 'system', content: systemPrompt },
        ...context.recentMessages.map((m) => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
        })),
        { role: 'user', content: userMessage },
    ]

    const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile', // Free, fast, and powerful
        messages,
        max_tokens: 500,
        temperature: 0.7,
    })

    return response.choices[0].message.content || ''
}

// Export config check
export { isGroqConfigured as isAIConfigured }
