'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import {
    TrendingUp,
    MessageSquare,
    MessageCircle,
    Users,
    Trophy,
    LogOut,
    FileText,
    Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui'
import { useAuth } from '@/components/providers'

const Logo3D = dynamic(() => import('@/components/3d/Logo3D'), { ssr: false })

const navItems = [
    { href: '/dashboard', icon: TrendingUp, label: 'Dashboard' },
    { href: '/chat', icon: MessageSquare, label: 'AI Assistant' },
    { href: '/messages', icon: MessageCircle, label: 'Messages' },
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
        <aside className="fixed left-0 top-0 h-full w-64 glass-panel border-r-0 p-6 flex flex-col z-40 transition-all duration-300">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-3 mb-10 group">
                <div className="relative">
                    <div className="absolute inset-0 bg-violet-500/30 blur-xl rounded-full opacity-50 group-hover:opacity-100 transition-opacity" />
                    <Logo3D />
                </div>
                <span className="text-2xl font-bold text-white tracking-tight group-hover:text-violet-400 transition-colors">
                    Vivitsu
                </span>
            </Link>

            {/* Navigation */}
            <nav className="space-y-2 flex-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="block relative"
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute inset-0 bg-gradient-to-r from-violet-600/20 to-indigo-600/10 rounded-xl"
                                    initial={false}
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                />
                            )}
                            <div className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                                ? 'text-violet-400'
                                : 'text-zinc-400 hover:text-white hover:bg-white/5'
                                }`}>
                                <item.icon className="w-5 h-5" />
                                <span className="font-medium">{item.label}</span>
                                {isActive && (
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="w-1.5 h-1.5 rounded-full bg-violet-400 ml-auto"
                                    />
                                )}
                            </div>
                        </Link>
                    )
                })}
            </nav>

            {/* User Section */}
            <div className="pt-6 border-t border-white/5 space-y-4">
                <Link href="/profile" className="flex items-center gap-3 group p-2 rounded-xl hover:bg-white/5 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white font-medium overflow-hidden ring-2 ring-transparent group-hover:ring-violet-500/50 transition-all">
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
