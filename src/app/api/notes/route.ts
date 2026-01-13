import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
    const userId = request.nextUrl.searchParams.get('userId')
    if (!userId) return NextResponse.json({ error: 'UserID required' }, { status: 400 })

    const notes = await prisma.note.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' }
    })
    return NextResponse.json({ notes })
}

export async function POST(request: NextRequest) {
    const { userId, title, content } = await request.json()
    const note = await prisma.note.create({
        data: { userId, title: title || 'Untitled', content: content || '' }
    })
    return NextResponse.json({ note })
}

export async function PUT(request: NextRequest) {
    const { id, title, content } = await request.json()
    const note = await prisma.note.update({
        where: { id },
        data: { title, content, updatedAt: new Date() }
    })
    return NextResponse.json({ note })
}

export async function DELETE(request: NextRequest) {
    const id = request.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    await prisma.note.delete({ where: { id } })
    return NextResponse.json({ success: true })
}
