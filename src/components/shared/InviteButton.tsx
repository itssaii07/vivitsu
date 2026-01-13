'use client'

import { useState } from 'react'
import { Button } from '@/components/ui'
import { UserPlus, Check, Loader2 } from 'lucide-react'
import { useAuth } from '@/components/providers'

export function InviteButton({ targetId, minimal = false }: { targetId: string, minimal?: boolean }) {
    const { user } = useAuth()
    const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

    const handleInvite = async (e: React.MouseEvent) => {
        e.stopPropagation()
        if (!user) return

        setStatus('sending')
        try {
            const res = await fetch('/api/friends', {
                method: 'POST',
                body: JSON.stringify({
                    userId: user.id,
                    targetId
                })
            })
            const data = await res.json()

            if (res.ok) {
                setStatus('sent')
            } else {
                console.error(data.error)
                setStatus('error')
                if (res.status === 404) {
                    alert("This user hasn't finished setting up their profile yet.")
                }
                setTimeout(() => setStatus('idle'), 2000)
            }
        } catch {
            setStatus('error')
            setTimeout(() => setStatus('idle'), 2000)
        }
    }

    if (status === 'sent') {
        return (
            <Button
                size="sm"
                variant="ghost"
                disabled
                className={minimal ? "p-1 h-auto text-green-400" : "text-green-400"}
            >
                <Check className={minimal ? "w-3 h-3" : "w-4 h-4"} />
            </Button>
        )
    }

    if (status === 'sending') {
        return (
            <Button
                size="sm"
                variant="ghost"
                disabled
                className={minimal ? "p-1 h-auto" : ""}
            >
                <Loader2 className={`${minimal ? "w-3 h-3" : "w-4 h-4"} animate-spin text-zinc-500`} />
            </Button>
        )
    }

    return (
        <Button
            size="sm"
            variant="ghost"
            onClick={handleInvite}
            title="Add Friend"
            className={`${minimal ? "p-1 h-2 w-auto hover:bg-transparent text-zinc-500 hover:text-violet-400" : "hover:bg-violet-500/20 hover:text-violet-400 text-zinc-500"}`}
        >
            <UserPlus className={minimal ? "w-3 h-3" : "w-4 h-4"} />
        </Button>
    )
}
