'use client'

import { useState, useEffect } from 'react'
import {
    User,
    Mail,
    Target,
    BookOpen,
    Save,
    Users,
    UserPlus,
    Check,
    X,
    Loader2
} from 'lucide-react'
import { Button, Card } from '@/components/ui'
import { useAuth } from '@/components/providers'
import { supabase } from '@/lib/supabase'
import { Sidebar } from '@/components/layout/Sidebar'

const SUBJECTS = [
    'Mathematics', 'Physics', 'Chemistry', 'Biology',
    'Computer Science', 'History', 'Literature', 'Languages',
    'Economics', 'Psychology', 'Art', 'Music'
]

export default function ProfilePage() {
    const { user } = useAuth()
    const [activeTab, setActiveTab] = useState<'profile' | 'friends'>('profile')

    // Profile State
    const [name, setName] = useState('')
    const [goal, setGoal] = useState('')
    const [subjects, setSubjects] = useState<string[]>([])
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [saved, setSaved] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    // Friends State
    const [friends, setFriends] = useState<any[]>([])
    const [requests, setRequests] = useState<any[]>([])
    const [loadingFriends, setLoadingFriends] = useState(false)
    const [showAddModal, setShowAddModal] = useState(false)

    useEffect(() => {
        if (user) {
            setName(user.user_metadata?.name || '')
            setGoal(user.user_metadata?.studyGoal || '')
            setSubjects(user.user_metadata?.subjects || [])
            setAvatarUrl(user.user_metadata?.avatarUrl || null)
        }
    }, [user])

    useEffect(() => {
        if (user && activeTab === 'friends') {
            fetchFriends()
        }
    }, [user, activeTab])

    const fetchFriends = async () => {
        if (!user) return
        setLoadingFriends(true)
        try {
            const res = await fetch(`/api/friends?userId=${user.id}`)
            const data = await res.json()
            if (data.friends) setFriends(data.friends)
            if (data.requests) setRequests(data.requests)
        } catch (error) {
            console.error('Failed to fetch friends', error)
        } finally {
            setLoadingFriends(false)
        }
    }

    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true)
            setMessage(null)

            if (!event.target.files || event.target.files.length === 0) {
                return
            }

            const file = event.target.files[0]
            const fileExt = file.name.split('.').pop()
            const filePath = `${user?.id}-${Math.random()}.${fileExt}`

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
            setAvatarUrl(data.publicUrl)

            await supabase.auth.updateUser({
                data: { avatarUrl: data.publicUrl }
            })

            setMessage({ type: 'success', text: 'Avatar updated!' })

        } catch (error: any) {
            console.error('Error uploading avatar:', error)
            setMessage({ type: 'error', text: error.message || 'Error uploading image' })
        } finally {
            setUploading(false)
        }
    }

    const toggleSubject = (subject: string) => {
        setSubjects(prev =>
            prev.includes(subject)
                ? prev.filter(s => s !== subject)
                : [...prev, subject].slice(0, 5)
        )
    }

    const handleSave = async () => {
        setLoading(true)
        setSaved(false)
        setMessage(null)
        try {
            const { error } = await supabase.auth.updateUser({
                data: { name, studyGoal: goal, subjects, ...(avatarUrl && { avatarUrl }) },
            })
            if (error) throw error

            // Sync to Prisma DB
            await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: user?.id,
                    email: user?.email,
                    name,
                    avatarUrl
                })
            })

            setSaved(true)
            setTimeout(() => setSaved(false), 3000)
            setMessage({ type: 'success', text: 'Profile saved successfully!' })
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to update profile' })
        } finally {
            setLoading(false)
        }
    }

    const handleAcceptRequest = async (friendshipId: string) => {
        await fetch('/api/friends', {
            method: 'PUT',
            body: JSON.stringify({ friendshipId, status: 'ACCEPTED' })
        })
        fetchFriends()
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-violet-950/10 to-zinc-950">
            <Sidebar />

            <main className="ml-64 p-8">
                <div className="max-w-2xl">
                    <h1 className="text-3xl font-bold text-white mb-2">Profile</h1>
                    <p className="text-zinc-400 mb-8">Manage your account and connections</p>

                    {/* Tabs */}
                    <div className="flex gap-4 mb-8 border-b border-zinc-800">
                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`pb-3 px-1 font-medium transition-colors ${activeTab === 'profile' ? 'text-violet-400 border-b-2 border-violet-400' : 'text-zinc-400 hover:text-white'
                                }`}
                        >
                            My Profile
                        </button>
                        <button
                            onClick={() => setActiveTab('friends')}
                            className={`pb-3 px-1 font-medium transition-colors ${activeTab === 'friends' ? 'text-violet-400 border-b-2 border-violet-400' : 'text-zinc-400 hover:text-white'
                                }`}
                        >
                            Friends ({friends.length})
                        </button>
                    </div>

                    {activeTab === 'profile' ? (
                        <div className="space-y-6">
                            {/* Avatar Section */}
                            <Card variant="glass" className="p-8">
                                <div className="flex flex-col items-center">
                                    <div className="relative group cursor-pointer">
                                        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-4xl font-bold text-white overflow-hidden border-4 border-zinc-900 shadow-xl">
                                            {avatarUrl ? (
                                                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                            ) : (
                                                name.charAt(0).toUpperCase() || 'U'
                                            )}
                                        </div>
                                        <label className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                            <span className="text-white text-sm font-medium">
                                                {uploading ? 'Uploading...' : 'Change Photo'}
                                            </span>
                                            <input type="file" accept="image/*" onChange={handleAvatarUpload} disabled={uploading} className="hidden" />
                                        </label>
                                    </div>
                                    <p className="mt-4 text-zinc-500 text-sm">{user?.email}</p>
                                </div>
                            </Card>

                            {/* Basic Info & Goal & Subjects (Same as before) */}
                            <Card variant="glass">
                                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                    <User className="w-5 h-5 text-violet-400" /> Basic Information
                                </h2>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-400 mb-2">Name</label>
                                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full h-11 px-4 rounded-xl bg-zinc-800/50 border border-zinc-700 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500" />
                                    </div>
                                </div>
                            </Card>

                            <Card variant="glass">
                                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                    <Target className="w-5 h-5 text-violet-400" /> Study Goal
                                </h2>
                                <input type="text" value={goal} onChange={(e) => setGoal(e.target.value)} className="w-full h-11 px-4 rounded-xl bg-zinc-800/50 border border-zinc-700 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500" />
                            </Card>

                            <div className="flex items-center justify-end">
                                <Button onClick={handleSave} disabled={loading}>
                                    {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save className="w-5 h-5" /> Save Changes</>}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Friend Requests */}
                            {requests.length > 0 && (
                                <Card variant="glass">
                                    <h2 className="text-lg font-semibold text-white mb-4">Friend Requests</h2>
                                    <div className="space-y-4">
                                        {requests.map((req) => (
                                            <div key={req.id} className="flex items-center justify-between p-3 bg-zinc-800/30 rounded-xl">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-white overflow-hidden">
                                                        {req.sender.avatarUrl ? <img src={req.sender.avatarUrl} className="w-full h-full object-cover" /> : req.sender.name?.[0] || '?'}
                                                    </div>
                                                    <div>
                                                        <p className="text-white font-medium">{req.sender.name || 'Unknown'}</p>
                                                        <p className="text-zinc-500 text-sm">{req.sender.email}</p>
                                                    </div>
                                                </div>
                                                <Button size="sm" onClick={() => handleAcceptRequest(req.id)}>
                                                    <Check className="w-4 h-4 mr-2" /> Accept
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            )}

                            {/* Friends List */}
                            <Card variant="glass">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-lg font-semibold text-white">Your Friends</h2>
                                    <Button onClick={() => setShowAddModal(true)} size="sm">
                                        <UserPlus className="w-4 h-4 mr-2" /> Add Friend
                                    </Button>
                                </div>
                                {loadingFriends ? (
                                    <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-zinc-500" /></div>
                                ) : friends.length === 0 ? (
                                    <p className="text-center text-zinc-500 py-8">No friends yet. Add someone to start studying together!</p>
                                ) : (
                                    <div className="grid grid-cols-1 gap-4">
                                        {friends.map(({ friend }) => (
                                            <div key={friend.id} className="flex items-center gap-3 p-3 bg-zinc-800/30 rounded-xl">
                                                <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-white overflow-hidden">
                                                    {friend.avatarUrl ? <img src={friend.avatarUrl} className="w-full h-full object-cover" /> : friend.name?.[0] || '?'}
                                                </div>
                                                <div>
                                                    <p className="text-white font-medium">{friend.name || 'Unknown'}</p>
                                                    <p className="text-zinc-500 text-sm">{friend.email}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </Card>
                        </div>
                    )}
                </div>
            </main>

            {/* Add Friend Modal */}
            {showAddModal && (
                <AddFriendModal onClose={() => setShowAddModal(false)} onAdded={fetchFriends} />
            )}
        </div>
    )
}

function AddFriendModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
    const { user } = useAuth()
    const [email, setEmail] = useState('')
    const [sending, setSending] = useState(false)
    const [status, setStatus] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    const handleSend = async () => {
        if (!user || !email) return
        setSending(true)
        setStatus(null)
        try {
            const res = await fetch('/api/friends', {
                method: 'POST',
                body: JSON.stringify({ userId: user.id, targetEmail: email })
            })
            const data = await res.json()
            if (data.error) throw new Error(data.error)

            setStatus({ type: 'success', text: 'Request sent!' })
            setTimeout(() => {
                onAdded()
                onClose()
            }, 1000)
        } catch (error: any) {
            setStatus({ type: 'error', text: error.message })
        } finally {
            setSending(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-6">
            <Card variant="glass" className="w-full max-w-md p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white">Add Friend</h2>
                    <button onClick={onClose} className="text-zinc-400 hover:text-white"><X className="w-5 h-5" /></button>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-2">Friend's Email</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" className="w-full h-11 px-4 rounded-xl bg-zinc-800/50 border border-zinc-700 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500" />
                    </div>
                    {status && (
                        <div className={`text-sm ${status.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>{status.text}</div>
                    )}
                    <Button onClick={handleSend} disabled={sending || !email} className="w-full">
                        {sending ? 'Sending...' : 'Send Request'}
                    </Button>
                </div>
            </Card>
        </div>
    )
}
