'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    Brain,
    TrendingUp,
    MessageSquare,
    Users,
    Trophy,
    LogOut,
    FileText
} from 'lucide-react'
import { Button } from '@/components/ui'
import { useAuth } from '@/components/providers'

const navItems = [
    { href: '/dashboard', icon: TrendingUp, label: 'Dashboard' },
    { href: '/chat', icon: MessageSquare, label: 'AI Assistant' },
    { href: '/rooms', icon: Users, label: 'Study Rooms' },
    { href: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
    { href: '/notes', icon: FileText, label: 'Notes' },
]

export function Sidebar() {
    const pathname = usePathname()
    const { user, signOut } = useAuth()

    const userName = user?.user_metadata?.name || 'User'
    const userInitial = userName.charAt(0).toUpperCase()

    return (
        <aside className="fixed left-0 top-0 h-full w-64 bg-zinc-900/50 border-r border-zinc-800 p-6 flex flex-col z-40">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-2 mb-8">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
                    <Brain className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold text-white">Vivitsu</span>
            </Link>

            {/* Navigation */}
            <nav className="space-y-2 flex-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                                ? 'bg-violet-600/20 text-violet-400'
                                : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white'
                                }`}
                        >
                            <item.icon className="w-5 h-5" />
                            <span className="font-medium">{item.label}</span>
                        </Link>
                    )
                })}
            </nav>

            {/* User Section */}
            <div className="pt-6 border-t border-zinc-800 space-y-4">
                <Link href="/profile" className="flex items-center gap-3 group">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white font-medium overflow-hidden">
                        {user?.user_metadata?.avatarUrl ? (
                            <img
                                src={user.user_metadata.avatarUrl}
                                alt={userName}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            userInitial
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-white font-medium text-sm truncate group-hover:text-violet-400 transition-colors">
                            {userName}
                        </p>
                        <p className="text-zinc-500 text-xs truncate">{user?.email}</p>
                    </div>
                </Link>

                <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-zinc-400 hover:text-red-400 hover:bg-red-500/10"
                    onClick={signOut}
                >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                </Button>
            </div>
        </aside>
    )
}
