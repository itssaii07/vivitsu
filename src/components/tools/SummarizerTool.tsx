'use client'

import { useState, useRef } from 'react'
import { Button, Card, CardContent } from '@/components/ui'
import { UploadCloud, FileText, Loader2, Copy, Check } from 'lucide-react'

export function SummarizerTool() {
    const [file, setFile] = useState<File | null>(null)
    const [summary, setSummary] = useState<string>('')
    const [loading, setLoading] = useState(false)
    const [copied, setCopied] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            setFile(e.target.files[0])
            setSummary('')
        }
    }

    const handleSummarize = async () => {
        if (!file) return

        setLoading(true)
        const formData = new FormData()
        formData.append('file', file)

        try {
            const res = await fetch('/api/summarize', {
                method: 'POST',
                body: formData
            })
            const data = await res.json()
            if (data.summary) {
                setSummary(data.summary)
            } else {
                alert(data.error || 'Failed to summarize')
            }
        } catch (error) {
            console.error(error)
            alert('Something went wrong')
        } finally {
            setLoading(false)
        }
    }

    const copyToClipboard = () => {
        navigator.clipboard.writeText(summary)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 p-4">

            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-white mb-2">AI Summarizer</h2>
                <p className="text-zinc-400">Upload PDFs or text files to get instant, study-ready summaries.</p>
            </div>

            {/* Upload Section */}
            <Card className="border-dashed border-2 border-[#3a3a3a] bg-[#202020]/50 hover:bg-[#202020] transition-colors">
                <CardContent className="flex flex-col items-center justify-center py-12 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept=".pdf,.txt,.md"
                        onChange={handleFileChange}
                    />

                    {file ? (
                        <div className="text-center">
                            <div className="w-16 h-16 bg-violet-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-violet-400">
                                <FileText className="w-8 h-8" />
                            </div>
                            <p className="text-white font-medium text-lg">{file.name}</p>
                            <p className="text-zinc-500 text-sm mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                            <Button
                                className="mt-6 bg-violet-600 hover:bg-violet-700 text-white"
                                onClick={(e) => { e.stopPropagation(); handleSummarize() }}
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                {loading ? 'Analyzing...' : 'Generate Summary'}
                            </Button>
                        </div>
                    ) : (
                        <div className="text-center">
                            <div className="w-16 h-16 bg-[#3a3a3a] rounded-full flex items-center justify-center mx-auto mb-4 text-zinc-400">
                                <UploadCloud className="w-8 h-8" />
                            </div>
                            <p className="text-white font-medium text-lg">Click to upload or drag and drop</p>
                            <p className="text-zinc-500 text-sm mt-1">PDF, TXT, or MD (Max 10MB)</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Results Section */}
            {summary && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-white">Summary</h2>
                        <Button variant="secondary" size="sm" onClick={copyToClipboard} className="text-zinc-400 border border-[#3a3a3a] hover:bg-[#2a2a2a]">
                            {copied ? <Check className="w-4 h-4 text-green-500 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                            {copied ? 'Copied' : 'Copy Text'}
                        </Button>
                    </div>

                    <div className="bg-[#202020] rounded-xl p-6 border border-[#2a2a2a] text-zinc-300 leading-relaxed whitespace-pre-wrap shadow-xl">
                        {summary}
                    </div>
                </div>
            )}

        </div>
    )
}
