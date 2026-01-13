'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus, Trash2, FileText, Save, Loader2, Users } from 'lucide-react'
import { Sidebar } from '@/components/layout/Sidebar'
import { useAuth } from '@/components/providers'
import { Button } from '@/components/ui'

interface Note {
    id: string
    title: string
    content: string
    updatedAt: string
}

export default function NotesPage() {
    const { user } = useAuth()
    const [notes, setNotes] = useState<Note[]>([])
    const [activeNoteId, setActiveNoteId] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    // Fetch notes on mount
    useEffect(() => {
        if (!user) return
        fetch(`/api/notes?userId=${user.id}`)
            .then(res => res.json())
            .then(data => {
                if (data.notes) {
                    setNotes(data.notes)
                    if (data.notes.length > 0) setActiveNoteId(data.notes[0].id)
                }
            })
            .finally(() => setLoading(false))
    }, [user])

    const activeNote = notes.find(n => n.id === activeNoteId)

    const handleCreate = async () => {
        if (!user) return
        const res = await fetch('/api/notes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id, title: '', content: '' })
        })
        const data = await res.json()
        if (data.note) {
            setNotes([data.note, ...notes])
            setActiveNoteId(data.note.id)
        }
    }

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        if (!confirm('Are you sure you want to delete this note?')) return

        await fetch(`/api/notes?id=${id}`, { method: 'DELETE' })
        const remaining = notes.filter(n => n.id !== id)
        setNotes(remaining)
        if (activeNoteId === id) {
            setActiveNoteId(remaining[0]?.id || null)
        }
    }

    const handleUpdate = (id: string, updates: Partial<Note>) => {
        setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n))

        // Debounced save
        setSaving(true)
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)

        saveTimeoutRef.current = setTimeout(async () => {
            const noteToSave = notes.find(n => n.id === id)
            if (!noteToSave) return

            // Merge current updates with note state to ensure we save latest
            const payload = { ...noteToSave, ...updates }

            await fetch('/api/notes', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id,
                    title: payload.title,
                    content: payload.content,
                    userId: user?.id // Pass user ID for edit verification
                })
            })
            setSaving(false)
        }, 1000)
    }

    const [showShareModal, setShowShareModal] = useState(false)
    const [friends, setFriends] = useState<any[]>([])

    // Fetch friends when opening share modal
    const handleShareClick = async () => {
        if (!user) return
        setShowShareModal(true)
        if (friends.length === 0) {
            try {
                const res = await fetch(`/api/friends?userId=${user.id}`)
                const data = await res.json()
                if (data.friends) setFriends(data.friends)
            } catch (e) {
                console.error('Failed to fetch friends')
            }
        }
    }

    const shareWithFriend = async (friendId: string) => {
        if (!activeNote || !user) return
        try {
            const res = await fetch('/api/notes/share', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    noteId: activeNote.id,
                    ownerId: user.id,
                    targetUserId: friendId
                })
            })
            const data = await res.json()
            if (data.error) {
                alert(data.error)
            } else {
                alert('Shared successfully!')
                setShowShareModal(false)
            }
        } catch (e) {
            alert('Failed to share')
        }
    }

    return (
        <div className="flex h-screen bg-[#191919] text-[#d4d4d4] relative">
            <Sidebar />

            <main className="ml-64 flex flex-1 h-full overflow-hidden">
                {/* Simple Share Modal Overlay */}
                {showShareModal && (
                    <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
                        <div className="bg-[#2a2a2a] p-6 rounded-xl border border-[#3a3a3a] w-96 shadow-2xl">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-white font-semibold">Share with Friends</h3>
                                <button onClick={() => setShowShareModal(false)} className="text-zinc-500 hover:text-white">✕</button>
                            </div>
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                {friends.length === 0 ? (
                                    <p className="text-zinc-500 text-sm text-center py-4">No friends added yet.</p>
                                ) : (
                                    friends.map(f => (
                                        <button
                                            key={f.id}
                                            onClick={() => shareWithFriend(f.friend.id)}
                                            className="w-full flex items-center gap-3 p-2 hover:bg-[#3a3a3a] rounded-lg transition-colors text-left"
                                        >
                                            <div className="w-8 h-8 bg-violet-500/20 rounded-full flex items-center justify-center text-xs font-bold text-violet-400">
                                                {f.friend.avatarUrl ? (
                                                    <img src={f.friend.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                                                ) : (
                                                    f.friend.name?.[0] || '?'
                                                )}
                                            </div>
                                            <span className="text-zinc-200 text-sm font-medium">{f.friend.name || f.friend.email}</span>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Notes Sidebar */}
                <div className="w-64 bg-[#202020] border-r border-[#2a2a2a] flex flex-col">
                    <div className="p-4 border-b border-[#2a2a2a] flex justify-between items-center">
                        <h2 className="font-semibold text-[#9b9b9b]">Notes</h2>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="hover:bg-[#2a2a2a] w-8 h-8 p-0"
                            onClick={handleCreate}
                        >
                            <Plus className="w-4 h-4" />
                        </Button>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <div className="flex justify-center p-4"><Loader2 className="w-5 h-5 animate-spin" /></div>
                        ) : (
                            notes.map(note => (
                                <div
                                    key={note.id}
                                    onClick={() => setActiveNoteId(note.id)}
                                    className={`p-3 mx-2 my-1 rounded-lg cursor-pointer flex items-center justify-between group transition-colors ${activeNoteId === note.id
                                        ? 'bg-[#2a2a2a] text-white'
                                        : 'hover:bg-[#2a2a2a]/50 text-[#9b9b9b]'
                                        }`}
                                >
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <FileText className="w-4 h-4 flex-shrink-0" />
                                        <span className="truncate text-sm font-medium">
                                            {note.title || 'Untitled'}
                                        </span>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 opacity-0 group-hover:opacity-100 p-0"
                                        onClick={(e) => handleDelete(note.id, e)}
                                    >
                                        <Trash2 className="w-3 h-3 text-red-400" />
                                    </Button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Editor Area */}
                <div className="flex-1 flex flex-col bg-[#191919] relative">
                    {activeNote ? (
                        <div className="max-w-3xl mx-auto w-full h-full flex flex-col p-12">
                            <div className="flex items-center justify-between mb-8">
                                <span className="text-xs text-[#5a5a5a]">
                                    {saving ? 'Saving...' : 'Saved'}
                                </span>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={handleShareClick}
                                >
                                    Share
                                </Button>
                            </div>

                            <input
                                type="text"
                                value={activeNote.title}
                                onChange={(e) => handleUpdate(activeNote.id, { title: e.target.value })}
                                placeholder="Untitled"
                                className="bg-transparent text-4xl font-bold text-white placeholder-[#3a3a3a] outline-none mb-8 w-full"
                            />

                            <textarea
                                value={activeNote.content}
                                onChange={(e) => handleUpdate(activeNote.id, { content: e.target.value })}
                                placeholder="Start writing..."
                                className="flex-1 bg-transparent text-lg text-[#d4d4d4] placeholder-[#3a3a3a] outline-none resize-none font-serif leading-relaxed"
                            />
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-[#3a3a3a]">
                            Select or create a note
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}
