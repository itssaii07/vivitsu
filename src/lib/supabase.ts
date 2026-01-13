import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Create a mock client for development when credentials aren't set
const createMockClient = () => {
    const mockAuth = {
        getSession: async () => ({ data: { session: null }, error: null }),
        signInWithPassword: async () => ({ data: { user: null, session: null }, error: { message: 'Supabase not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local' } }),
        signUp: async () => ({ data: { user: null, session: null }, error: { message: 'Supabase not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local' } }),
        signOut: async () => ({ error: null }),
        updateUser: async () => ({ data: { user: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
    }

    return {
        auth: mockAuth,
        from: () => ({
            select: () => ({ data: [], error: null }),
            insert: () => ({ data: null, error: null }),
            update: () => ({ data: null, error: null }),
            delete: () => ({ data: null, error: null }),
        }),
    } as unknown as SupabaseClient
}

// Create real or mock client based on environment
export const supabase: SupabaseClient = (supabaseUrl && supabaseAnonKey)
    ? createClient(supabaseUrl, supabaseAnonKey)
    : createMockClient()

// Server-side client with service role (only create if credentials exist)
export const supabaseAdmin: SupabaseClient = (supabaseUrl && process.env.SUPABASE_SERVICE_ROLE_KEY)
    ? createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY)
    : createMockClient()

// Helper to check if Supabase is configured
export const isSupabaseConfigured = () => Boolean(supabaseUrl && supabaseAnonKey)
