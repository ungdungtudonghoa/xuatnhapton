import { GoogleGenerativeAI } from '@google/generative-ai'

export interface ExtractedData {
    document_type?: 'PN' | 'PX' | 'PDC' | 'PTH'
    document_number?: string
    document_date?: string
    warehouse?: {
        name?: string
        code?: string
    }
    supplier?: {
        name?: string
        address?: string
        phone?: string
    }
    recipient?: {
        name?: string
        address?: string
        phone?: string
    }
    items: Array<{
        name: string
        quantity: number
        unit: string
        notes?: string
    }>
    notes?: string
    reasoning?: string
    confidence: number
    raw_ai_response?: string
}

export async function processDocumentWithGemini(
    imageDataBase64: string,
    apiKey: string,
    modelName: string = 'gemini-2.5-flash',
    customPrompt?: string
): Promise<ExtractedData> {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: modelName })

    const prompt = customPrompt || `Bạn là chuyên gia phân loại chứng từ kho.
DỰA TRÊN TIÊU ĐỀ VÀ NỘI DUNG:
1. ƯU TIÊN PN: Nếu tiêu đề chứa từ "NHẬP" hoặc chứa CẢ HAI từ "NHẬP" và "XUẤT" (VD: "Yêu cầu nhập xuất kho") -> PHẢI phân loại là "PN" (Phiếu Nhập Kho).
2. PHÂN LOẠI PX: Chỉ phân loại là "PX" khi tiêu đề là "PHIẾU GIAO HÀNG", "PHIẾU XUẤT KHO" hoặc nội dung CHỈ chứa từ "XUẤT" mà không có từ "NHẬP".
3. TRƯỜNG HỢP KHÁC: Mặc định chọn "PN".

HÃY PHÂN TÍCH VÀ TRẢ VỀ JSON:
{
  "reasoning": "Giải thích ngắn gọn lý do chọn loại phiếu (Vd: Tiêu đề chứa cả nhập và xuất nên chọn PN)",
  "document_type": "PN" hoặc "PX",
  "document_number": "...",
  "document_date": "YYYY-MM-DD",
  "warehouse": { "name": "...", "code": "..." },
  "supplier": { "name": "...", "address": "...", "phone": "..." },
  "recipient": { "name": "...", "address": "...", "phone": "..." },
  "items": [{ "name": "...", "quantity": 0, "unit": "...", "notes": "..." }],
  "confidence": 0-100
}

Lưu ý: Ưu tiên đọc mã QR trên phiếu nếu có.`

    const result = await model.generateContent([
        prompt,
        {
            inlineData: {
                data: imageDataBase64.split(',')[1] || imageDataBase64,
                mimeType: 'image/jpeg',
            },
        },
    ])

    const response = await result.response
    const text = response.text()

    // Basic JSON extraction from markdown if AI wraps it
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
        throw new Error('AI không trả về định dạng JSON hợp lệ: ' + text)
    }

    try {
        const data = JSON.parse(jsonMatch[0]) as ExtractedData
        return { ...data, raw_ai_response: text }
    } catch (e) {
        throw new Error('Lỗi parse JSON từ AI: ' + (e as Error).message)
    }
}
