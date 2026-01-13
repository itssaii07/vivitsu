'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores'
import type { User as SupabaseUser } from '@supabase/supabase-js'

interface AuthContextType {
    user: SupabaseUser | null
    loading: boolean
    signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    signOut: async () => { },
})

export const useAuth = () => useContext(AuthContext)

const publicRoutes = ['/', '/login', '/signup']

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<SupabaseUser | null>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()
    const pathname = usePathname()
    const { setUser: setStoreUser, setLoading: setStoreLoading } = useAuthStore()

    useEffect(() => {
        // Get initial session
        const getSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession()
                const currentUser = session?.user ?? null
                setUser(currentUser)

                if (currentUser) {
                    setStoreUser({
                        id: currentUser.id,
                        email: currentUser.email || '',
                        name: currentUser.user_metadata?.name || null,
                        avatarUrl: currentUser.user_metadata?.avatar_url || null,
                        studyGoal: currentUser.user_metadata?.study_goal || null,
                        subjects: currentUser.user_metadata?.subjects || [],
                    })
                } else {
                    setStoreUser(null)
                }
            } catch (error) {
                console.error('Error getting session:', error)
            } finally {
                setLoading(false)
                setStoreLoading(false)
            }
        }

        getSession()

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                const currentUser = session?.user ?? null
                setUser(currentUser)

                if (currentUser) {
                    setStoreUser({
                        id: currentUser.id,
                        email: currentUser.email || '',
                        name: currentUser.user_metadata?.name || null,
                        avatarUrl: currentUser.user_metadata?.avatar_url || null,
                        studyGoal: currentUser.user_metadata?.study_goal || null,
                        subjects: currentUser.user_metadata?.subjects || [],
                    })
                } else {
                    setStoreUser(null)
                }

                // Redirect logic
                if (event === 'SIGNED_OUT') {
                    router.push('/login')
                } else if (event === 'SIGNED_IN' && pathname === '/login') {
                    router.push('/dashboard')
                }
            }
        )

        return () => {
            subscription.unsubscribe()
        }
    }, [pathname, router, setStoreUser, setStoreLoading])

    // Protect routes
    useEffect(() => {
        if (!loading) {
            const isPublicRoute = publicRoutes.includes(pathname)

            if (!user && !isPublicRoute) {
                router.push('/login')
            }
        }
    }, [user, loading, pathname, router])

    const signOut = async () => {
        await supabase.auth.signOut()
        setUser(null)
        setStoreUser(null)
        router.push('/')
    }

    return (
        <AuthContext.Provider value={{ user, loading, signOut }}>
            {children}
        </AuthContext.Provider>
    )
}
