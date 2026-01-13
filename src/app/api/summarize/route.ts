import { NextRequest, NextResponse } from 'next/server'
import { groq } from '@/lib/ai'
// @ts-ignore
const PDFParser = require('pdf2json')

export async function POST(request: NextRequest) {
    console.log('Summarize API called')
    if (!groq) {
        console.error('Groq API key missing')
        return NextResponse.json({ error: 'AI service not configured' }, { status: 503 })
    }

    try {
        const formData = await request.formData()
        const file = formData.get('file') as File

        if (!file) {
            console.error('No file in request')
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
        }

        console.log(`Processing file: ${file.name}, type: ${file.type}`)
        let text = ''

        // Check file type
        if (file.type === 'application/pdf') {
            const buffer = Buffer.from(await file.arrayBuffer())
            console.log('Parsing PDF with pdf2json...')

            text = await new Promise((resolve, reject) => {
                const pdfParser = new PDFParser(null, 1); // 1 = text content only

                pdfParser.on("pdfParser_dataError", (errData: any) => {
                    console.error('PDF Parser Error:', errData.parserError)
                    reject(new Error(errData.parserError))
                });

                pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
                    // pdf2json returns raw text in a specific format
                    // For mode 1, getRawTextContent() is the helper
                    const rawText = pdfParser.getRawTextContent()
                    resolve(rawText)
                });

                pdfParser.parseBuffer(buffer);
            })
            console.log('PDF Parsed successfully')

        } else if (
            file.type === 'text/plain' ||
            file.type === 'text/markdown' ||
            file.name.endsWith('.md')
        ) {
            text = await file.text()
        } else {
            console.error('Unsupported file type')
            return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 })
        }

        if (!text || text.trim().length === 0) {
            return NextResponse.json({ error: 'Could not extract text from file' }, { status: 400 })
        }

        const truncatedText = text.slice(0, 15000)
        console.log('Generating summary with AI...')

        const completion = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
                {
                    role: 'system',
                    content: `You are an expert study assistant. 
                    Summarize the following notes/document into a clear, structured study guide.
                    Include:
                    1. Key Concepts (Bullet points)
                    2. Important Definitions
                    3. Summary Paragraph
                    Use Markdown formatting.`
                },
                {
                    role: 'user',
                    content: truncatedText
                }
            ],
            temperature: 0.5,
            max_tokens: 1024
        })

        const summary = completion.choices[0].message.content
        console.log('Summary generated')

        return NextResponse.json({ summary })

    } catch (error: any) {
        console.error('Summarization global error:', error)
        console.error('Stack:', error.stack)
        return NextResponse.json({ error: 'Failed to process file' }, { status: 500 })
    }
}
