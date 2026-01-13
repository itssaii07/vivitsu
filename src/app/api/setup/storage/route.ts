import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
    try {
        // Attempt to create the bucket
        const { data, error } = await supabaseAdmin.storage.createBucket('chat-uploads', {
            public: true,
            fileSizeLimit: 10485760, // 10MB
            allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'application/pdf']
        })

        if (error) {
            // Error code '23505' means duplicate key (already exists), which is fine.
            // But supabase-js might return a specific error object.
            if (error.message.includes('already exists')) {
                return NextResponse.json({ message: 'Bucket already exists', success: true })
            }
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ message: 'Bucket created successfully', success: true, data })
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 })
    }
}
