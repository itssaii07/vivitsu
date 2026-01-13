# Vivitsu - AI Study Platform

An AI-powered social study platform with personalized learning, study rooms, and streak tracking.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🔧 Environment Setup

Copy `.env.local.example` to `.env.local` and fill in your keys:

```bash
# Supabase (Auth + Database)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
DIRECT_URL=

# OpenAI (AI Chat)
OPENAI_API_KEY=

# Pinecone (AI Memory) - Optional
PINECONE_API_KEY=
PINECONE_INDEX_NAME=vivitsu-memory

# Socket.io (Realtime)
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

## 📁 Project Structure

```
src/
├── app/              # Next.js pages & API routes
├── components/       # React components
├── lib/              # Utilities (db, ai, socket)
└── stores/           # Zustand state management
socket-server/        # Standalone Socket.io server
prisma/               # Database schema
```

## 🗄️ Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev
```

## 🔌 Socket.io Server

```bash
cd socket-server
npm install
npm run dev
```

## 🚢 Deployment

### Vercel (Frontend)
```bash
vercel
```

### Railway (Socket Server)
Deploy `socket-server/` as a separate service.

## 📚 Tech Stack

- **Frontend**: Next.js 16, React, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma
- **Database**: PostgreSQL (Supabase)
- **Auth**: Supabase Auth
- **AI**: OpenAI GPT-4o-mini, Pinecone
- **Realtime**: Socket.io
- **State**: Zustand

## 📄 License

MIT
