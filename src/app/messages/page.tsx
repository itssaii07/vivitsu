'use client'

import { MessageSquare } from 'lucide-react'

export default function MessagesIndexPage() {
    return (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-zinc-500">
            <div className="w-24 h-24 rounded-full border-2 border-zinc-800 flex items-center justify-center mb-6">
                <MessageSquare className="w-10 h-10" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Your Messages</h2>
            <p className="max-w-md">
                Send private photos and messages to a friend or group.
                (Well, text only for now!)
            </p>
        </div>
    )
}
