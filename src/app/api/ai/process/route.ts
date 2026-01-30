import { NextResponse } from 'next/server'
import { processDocumentWithGemini } from '@/lib/ai/service'

export async function POST(req: Request) {
    try {
        const { image, apiKey, model, prompt } = await req.json()

        if (!image) {
            return NextResponse.json({ error: 'Thiếu dữ liệu ảnh' }, { status: 400 })
        }

        if (!apiKey) {
            return NextResponse.json({ error: 'Thiếu Gemini API Key' }, { status: 400 })
        }

        const result = await processDocumentWithGemini(image, apiKey, model, prompt)

        return NextResponse.json(result)
    } catch (error: any) {
        console.error('AI Processing Error:', error)
        return NextResponse.json(
            { error: error.message || 'Lỗi xử lý AI' },
            { status: 500 }
        )
    }
}
