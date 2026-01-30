'use client'

import { useEffect, useState } from 'react'

export interface PromptTemplate {
    id: string
    name: string
    code: 'PN' | 'PX' | 'PDC' | 'PTH' | 'AUTO'
    prompt_text: string
}

const DEFAULT_PROMPTS: PromptTemplate[] = [
    {
        id: 'auto',
        name: 'Tự động nhận diện',
        code: 'AUTO',
        prompt_text: 'Bạn là chuyên gia phân loại chứng từ kho. \n\nQUY TẮC PHÂN LOẠI NGHIÊM NGẶT:\n1. ƯU TIÊN PN: Nếu tiêu đề chứa từ "NHẬP" hoặc chứa CẢ HAI từ "NHẬP" và "XUẤT" (VD: "Yêu cầu nhập xuất kho") -> PHẢI phân loại là "PN" (Phiếu Nhập Kho).\n2. PHÂN LOẠI PX: Chỉ phân loại là "PX" khi tiêu đề là "PHIẾU GIAO HÀNG", "PHIẾU XUẤT KHO" hoặc nội dung CHỈ chứa từ "XUẤT" mà không có từ "NHẬP".\n3. TRƯỜNG HỢP KHÁC: Mặc định chọn "PN".\n\nHÃY PHÂN TÍCH VÀ TRẢ VỀ JSON:\n{\n  "reasoning": "Giải thích ngắn gọn lý do chọn loại phiếu",\n  "document_type": "PN" hoặc "PX",\n  "document_number": "...",\n  "document_date": "YYYY-MM-DD",\n  "warehouse": { "name": "...", "code": "..." },\n  "items": [{ "name": "...", "quantity": 0, "unit": "...", "notes": "..." }],\n  "confidence": 0-100\n}\n\nLưu ý: Ưu tiên đọc mã QR trên phiếu nếu có.'
    },
    {
        id: 'pn',
        name: 'Phiếu Nhập Kho',
        code: 'PN',
        prompt_text: 'Bạn là một AI chuyên trích xuất dữ liệu từ phiếu nhập kho. Hãy phân tích ảnh phiếu nhập kho và trích xuất thông tin sau dưới dạng JSON:\n\n{\n  "document_number": "Số phiếu (ví dụ: PN-001)",\n  "document_date": "Ngày phiếu (format: YYYY-MM-DD)",\n  "warehouse": {\n    "name": "Tên kho nhập",\n    "code": "Mã kho (nếu có)"\n  },\n  "supplier": {\n    "name": "Tên nhà cung cấp",\n    "address": "Địa chỉ nhà cung cấp",\n    "phone": "Số điện thoại"\n  },\n  "delivery": {\n    "person": "Người giao hàng",\n    "date": "Ngày giao (format: YYYY-MM-DD)",\n    "vehicle": "Số xe (nếu có)"\n  },\n  "items": [\n    {\n      "name": "Tên vật tư",\n      "quantity": số lượng (number),\n      "unit": "Đơn vị tính (kg, thùng, cái, ...)",\n      "notes": "Ghi chú (nếu có)"\n    }\n  ],\n  "notes": "Ghi chú chung của phiếu",\n  "confidence": điểm tin cậy từ 0-100\n}'
    },
    {
        id: 'px',
        name: 'Phiếu Xuất Kho',
        code: 'PX',
        prompt_text: 'Bạn là một AI chuyên trích xuất dữ liệu từ phiếu xuất kho. Hãy phân tích ảnh phiếu xuất kho và trích xuất thông tin sau dưới dạng JSON:\n\n{\n  "document_number": "Số phiếu (ví dụ: PX-001)",\n  "document_date": "Ngày phiếu (format: YYYY-MM-DD)",\n  "warehouse": {\n    "name": "Tên kho xuất",\n    "code": "Mã kho (nếu có)"\n  },\n  "recipient": {\n    "name": "Tên người/đơn vị nhận",\n    "address": "Địa chỉ",\n    "phone": "Số điện thoại"\n  },\n  "delivery": {\n    "person": "Người nhận hàng",\n    "date": "Ngày xuất (format: YYYY-MM-DD)",\n    "vehicle": "Số xe (nếu có)"\n  },\n  "items": [\n    {\n      "name": "Tên vật tư",\n      "quantity": số lượng (number),\n      "unit": "Đơn vị tính (kg, thùng, cái, ...)",\n      "notes": "Ghi chú (nếu có)"\n    }\n  ],\n  "notes": "Ghi chú chung của phiếu",\n  "confidence": điểm tin cậy từ 0-100\n}'
    }
]

const PROMPTS_STORAGE_KEY = 'ai_prompt_templates'

export function useAiPrompts() {
    const [prompts, setPrompts] = useState<PromptTemplate[]>(DEFAULT_PROMPTS)

    useEffect(() => {
        const stored = localStorage.getItem(PROMPTS_STORAGE_KEY)
        if (stored) {
            setPrompts(JSON.parse(stored))
        }
    }, [])

    const savePrompt = (id: string, text: string) => {
        const updated = prompts.map(p => p.id === id ? { ...p, prompt_text: text } : p)
        setPrompts(updated)
        localStorage.setItem(PROMPTS_STORAGE_KEY, JSON.stringify(updated))
    }

    const resetToDefault = (id?: string) => {
        if (id) {
            const defaultPrompt = DEFAULT_PROMPTS.find(p => p.id === id)
            if (defaultPrompt) {
                savePrompt(id, defaultPrompt.prompt_text)
            }
        } else {
            setPrompts(DEFAULT_PROMPTS)
            localStorage.setItem(PROMPTS_STORAGE_KEY, JSON.stringify(DEFAULT_PROMPTS))
        }
    }

    return {
        prompts,
        savePrompt,
        resetToDefault
    }
}
