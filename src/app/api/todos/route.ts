import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
    try {
        const userId = request.nextUrl.searchParams.get('userId')
        if (!userId) {
            console.error('UserId missing in GET todos')
            return NextResponse.json({ error: 'UserID required' }, { status: 400 })
        }

        console.log('Fetching todos for user:', userId)

        // Ensure prisma is connected (optional check, but good for debug)
        if (!prisma.todo) {
            console.error('Prisma Todo model not found! Client generation issue?')
            throw new Error('Prisma Client Error')
        }

        const todos = await prisma.todo.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        })
        console.log('Todos fetched:', todos.length)
        return NextResponse.json({ todos })
    } catch (error) {
        console.error('GET Todos error detail:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const { userId, content } = await request.json()
        if (!userId || !content) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
        }

        const todo = await prisma.todo.create({
            data: { userId, content, completed: false }
        })
        return NextResponse.json({ todo })
    } catch (error) {
        console.error('POST Todo error:', error)
        return NextResponse.json({ error: 'Create failed' }, { status: 500 })
    }
}

export async function PUT(request: NextRequest) {
    try {
        const { id, completed } = await request.json()
        const todo = await prisma.todo.update({
            where: { id },
            data: { completed } // Only allow toggling completion for now
        })
        return NextResponse.json({ todo })
    } catch (error) {
        console.error('PUT Todo error:', error)
        return NextResponse.json({ error: 'Update failed' }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const id = request.nextUrl.searchParams.get('id')
        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

        await prisma.todo.delete({ where: { id } })
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('DELETE Todo error:', error)
        return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
    }
}
