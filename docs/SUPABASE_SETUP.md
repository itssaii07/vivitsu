# Vivitsu - Supabase Setup Guide

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/log in
2. Click "New Project"
3. Fill in:
   - **Name**: `vivitsu`
   - **Database Password**: (save this!)
   - **Region**: Choose closest to you
4. Wait for project to be created (~2 min)

---

## Step 2: Get Your API Keys

1. In your Supabase dashboard, click **Settings** (gear icon) → **API**
2. Copy these values to your `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=<Project URL>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon public key>
SUPABASE_SERVICE_ROLE_KEY=<service_role key - keep secret!>
```

---

## Step 3: Get Database URL

1. In Supabase, go to **Settings** → **Database**
2. Scroll to "Connection string" → **URI**
3. Copy and replace `[YOUR-PASSWORD]` with your DB password:

```
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres
```

---

## Step 4: Run Prisma Migration

```bash
npx prisma generate
npx prisma migrate dev --name init
```

This creates all database tables.

---

## Step 5: Enable Auth Providers

1. In Supabase, go to **Authentication** → **Providers**
2. Enable **Email** provider
3. (Optional) Enable **Google**, **GitHub**, etc.

---

---

## Step 6: Setup Storage (Avatars)

1. In Supabase, go to **Storage**
2. Click **New Bucket**
   - Name: `avatars`
   - Toggle **Public bucket**: ON
   - Click **Save**
3. Select the `avatars` bucket and click **Configuration** (or Policies)
4. Under **Policies**, click **New Policy**
   - Choose "For full customization"
   - **Name**: `Enable Avatar Uploads`
   - **Allowed Operations**: Check `INSERT`, `UPDATE`
   - **Target Roles**: `authenticated`
   - **USING expression**: `true`
   - Click **Save**
5. (Optional) If images fail to load, ensure explicit SELECT policy:
   - Operation: `SELECT`
   - Role: `public`
   - Expression: `true`

---

## Complete `.env.local`

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# OpenAI
OPENAI_API_KEY=sk-...

# Socket.io
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

---

## Verify Setup

Restart your dev server and try:
1. Create account at `/signup`
2. Login at `/login`
3. You should be redirected to `/dashboard`

✅ Supabase is configured!
