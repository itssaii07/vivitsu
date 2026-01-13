'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Brain, Target, BookOpen, ArrowRight, Check } from 'lucide-react'
import { Button, Card } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/providers'

const SUBJECTS = [
    'Mathematics', 'Physics', 'Chemistry', 'Biology',
    'Computer Science', 'History', 'Literature', 'Languages',
    'Economics', 'Psychology', 'Art', 'Music'
]

const GOALS = [
    { id: 'exams', label: 'Prepare for exams', icon: '📝' },
    { id: 'skills', label: 'Learn new skills', icon: '🚀' },
    { id: 'grades', label: 'Improve my grades', icon: '📈' },
    { id: 'consistent', label: 'Be more consistent', icon: '🔥' },
]

export default function OnboardingPage() {
    const router = useRouter()
    const { user } = useAuth()
    const [step, setStep] = useState(1)
    const [name, setName] = useState('')
    const [goal, setGoal] = useState('')
    const [subjects, setSubjects] = useState<string[]>([])
    const [loading, setLoading] = useState(false)

    const toggleSubject = (subject: string) => {
        setSubjects(prev =>
            prev.includes(subject)
                ? prev.filter(s => s !== subject)
                : [...prev, subject].slice(0, 5) // Max 5 subjects
        )
    }

    const handleComplete = async () => {
        if (!user) {
            router.push('/login')
            return
        }

        setLoading(true)
        try {
            // Update user metadata in Supabase
            await supabase.auth.updateUser({
                data: {
                    name,
                    study_goal: goal,
                    subjects,
                    onboarded: true,
                },
            })

            // Sync to Prisma DB
            await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: user.id,
                    email: user.email,
                    name,
                    // avatarUrl (optional, not set in onboarding yet)
                })
            })

            router.push('/dashboard')
        } catch (error) {
            console.error('Onboarding error:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-violet-950/20 to-zinc-950 flex items-center justify-center p-6">
            {/* Animated background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-violet-600/20 to-transparent rounded-full blur-3xl animate-pulse" />
                <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-indigo-600/20 to-transparent rounded-full blur-3xl animate-pulse" />
            </div>

            <div className="relative z-10 w-full max-w-xl">
                {/* Progress Steps */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    {[1, 2, 3].map((s) => (
                        <div
                            key={s}
                            className={`flex items-center justify-center w-10 h-10 rounded-full font-medium transition-all ${s < step
                                ? 'bg-violet-600 text-white'
                                : s === step
                                    ? 'bg-violet-600 text-white ring-4 ring-violet-600/30'
                                    : 'bg-zinc-800 text-zinc-500'
                                }`}
                        >
                            {s < step ? <Check className="w-5 h-5" /> : s}
                        </div>
                    ))}
                </div>

                <Card variant="glass" className="p-8">
                    {/* Step 1: Name */}
                    {step === 1 && (
                        <div className="text-center">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center mx-auto mb-6">
                                <Brain className="w-8 h-8 text-white" />
                            </div>
                            <h1 className="text-2xl font-bold text-white mb-2">Welcome to Vivitsu!</h1>
                            <p className="text-zinc-400 mb-8">Let's personalize your study experience</p>

                            <div className="mb-8">
                                <label className="block text-sm font-medium text-zinc-400 mb-2 text-left">
                                    What should we call you?
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Your name"
                                    className="w-full h-14 px-4 rounded-xl bg-zinc-800/50 border border-zinc-700 text-white text-lg placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                                    autoFocus
                                />
                            </div>

                            <Button
                                size="lg"
                                className="w-full"
                                onClick={() => setStep(2)}
                                disabled={!name.trim()}
                            >
                                Continue
                                <ArrowRight className="w-5 h-5" />
                            </Button>
                        </div>
                    )}

                    {/* Step 2: Goal */}
                    {step === 2 && (
                        <div>
                            <div className="text-center mb-8">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600/20 to-indigo-600/20 flex items-center justify-center mx-auto mb-6">
                                    <Target className="w-8 h-8 text-violet-400" />
                                </div>
                                <h1 className="text-2xl font-bold text-white mb-2">What's your main goal?</h1>
                                <p className="text-zinc-400">This helps us personalize your AI assistant</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-8">
                                {GOALS.map((g) => (
                                    <button
                                        key={g.id}
                                        onClick={() => setGoal(g.label)}
                                        className={`p-4 rounded-xl border text-left transition-all ${goal === g.label
                                            ? 'border-violet-500 bg-violet-500/10'
                                            : 'border-zinc-700 hover:border-zinc-600'
                                            }`}
                                    >
                                        <span className="text-2xl mb-2 block">{g.icon}</span>
                                        <span className={`font-medium ${goal === g.label ? 'text-white' : 'text-zinc-400'}`}>
                                            {g.label}
                                        </span>
                                    </button>
                                ))}
                            </div>

                            <div className="flex gap-4">
                                <Button variant="secondary" onClick={() => setStep(1)} className="flex-1">
                                    Back
                                </Button>
                                <Button
                                    size="lg"
                                    className="flex-1"
                                    onClick={() => setStep(3)}
                                    disabled={!goal}
                                >
                                    Continue
                                    <ArrowRight className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Subjects */}
                    {step === 3 && (
                        <div>
                            <div className="text-center mb-8">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600/20 to-indigo-600/20 flex items-center justify-center mx-auto mb-6">
                                    <BookOpen className="w-8 h-8 text-violet-400" />
                                </div>
                                <h1 className="text-2xl font-bold text-white mb-2">What are you studying?</h1>
                                <p className="text-zinc-400">Select up to 5 subjects</p>
                            </div>

                            <div className="flex flex-wrap gap-2 mb-8">
                                {SUBJECTS.map((subject) => (
                                    <button
                                        key={subject}
                                        onClick={() => toggleSubject(subject)}
                                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${subjects.includes(subject)
                                            ? 'bg-violet-600 text-white'
                                            : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                                            }`}
                                    >
                                        {subject}
                                    </button>
                                ))}
                            </div>

                            <div className="flex gap-4">
                                <Button variant="secondary" onClick={() => setStep(2)} className="flex-1">
                                    Back
                                </Button>
                                <Button
                                    size="lg"
                                    className="flex-1"
                                    onClick={handleComplete}
                                    disabled={subjects.length === 0 || loading}
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            Get Started
                                            <ArrowRight className="w-5 h-5" />
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    )
}
