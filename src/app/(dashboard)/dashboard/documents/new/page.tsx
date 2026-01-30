'use client'

import { useState, useCallback, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
    Upload, X, FileImage, Loader2, CheckCircle2,
    AlertCircle, Eye, ChevronRight, Zap,
    ArrowLeft, Save, Database, History
} from 'lucide-react'
import Image from 'next/image'
import { useGeminiKey } from '@/hooks/useGeminiKey'
import { useAiPrompts } from '@/hooks/useAiPrompts'
import { ExtractedData } from '@/lib/ai/service'
import { DocumentReviewCard } from '@/components/documents/DocumentReviewGroup'
import { ZoomableImage } from '@/components/ui/ZoomableImage'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'

interface FileWithStatus {
    file: File
    preview: string
    id: string
    status: 'waiting' | 'processing' | 'success' | 'error'
    error?: string
    results?: ExtractedData
}

export default function NewDocumentPage() {
    const router = useRouter()
    const { user } = useAuth()

    // Wizard State
    const [step, setStep] = useState<1 | 2>(1)

    // Step 1: Upload & Process States
    const [fileList, setFileList] = useState<FileWithStatus[]>([])
    const { apiKey: storedApiKey, hasApiKey } = useGeminiKey()
    const [apiKey, setApiKey] = useState('')
    const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash')
    const [isProcessing, setIsProcessing] = useState(false)
    const [previewImage, setPreviewImage] = useState<string | null>(null)
    const { prompts } = useAiPrompts()
    const [selectedPromptId, setSelectedPromptId] = useState('auto')
    const [viewingError, setViewingError] = useState<string | null>(null)

    // Step 2: Review States
    const [reviewData, setReviewData] = useState<FileWithStatus[]>([])
    const [warehouses, setWarehouses] = useState<any[]>([])
    const [suppliers, setSuppliers] = useState<any[]>([])
    const [isSaving, setIsSaving] = useState(false)
    const [showSuccessModal, setShowSuccessModal] = useState(false)
    const [savedCount, setSavedCount] = useState(0)

    useEffect(() => {
        if (storedApiKey) setApiKey(storedApiKey)
        fetchMetadata()
    }, [storedApiKey])

    const fetchMetadata = async () => {
        const [whRes, supRes] = await Promise.all([
            supabase.from('warehouses').select('id, name, code').eq('is_active', true),
            supabase.from('suppliers').select('id, name, code').eq('is_active', true)
        ])
        if (whRes.data) setWarehouses(whRes.data)
        if (supRes.data) setSuppliers(supRes.data)
    }

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const newFiles = acceptedFiles.map(file => ({
            file,
            preview: URL.createObjectURL(file),
            id: Math.random().toString(36).substring(7),
            status: 'waiting' as const
        }))
        setFileList(prev => [...prev, ...newFiles])
    }, [])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
        multiple: true
    })

    const removeFile = (id: string) => {
        setFileList(prev => {
            const filtered = prev.filter(f => f.id !== id)
            const removed = prev.find(f => f.id === id)
            if (removed) URL.revokeObjectURL(removed.preview)
            return filtered
        })
    }

    const processFile = async (item: FileWithStatus) => {
        setFileList(prev => prev.map(p => p.id === item.id ? { ...p, status: 'processing', error: undefined } : p))

        try {
            const base64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader()
                reader.readAsDataURL(item.file)
                reader.onload = () => resolve(reader.result as string)
                reader.onerror = error => reject(error)
            })

            const currentPrompt = prompts.find(p => p.id === selectedPromptId)?.prompt_text

            const response = await fetch('/api/ai/process', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    image: base64,
                    apiKey,
                    model: selectedModel,
                    prompt: currentPrompt
                })
            })

            const data = await response.json()
            if (!response.ok) throw new Error(data.error || 'Lỗi không xác định')

            setFileList(prev => prev.map(p => p.id === item.id ? {
                ...p,
                status: 'success',
                results: data
            } : p))
        } catch (error: any) {
            setFileList(prev => prev.map(p => p.id === item.id ? {
                ...p,
                status: 'error',
                error: error.message
            } : p))
        }
    }

    const startBatchProcessing = async () => {
        if (!apiKey) {
            alert('Vui lòng nhập Gemini API Key')
            return
        }
        setIsProcessing(true)
        const waitingFiles = fileList.filter(f => f.status === 'waiting' || f.status === 'error')
        await Promise.all(waitingFiles.map(file => processFile(file)))
        setIsProcessing(false)
    }

    const goToReview = () => {
        const processed = fileList.filter(f => f.status === 'success')
        if (processed.length === 0) {
            alert('Chưa có phiếu nào được xử lý thành công.')
            return
        }
        setReviewData(JSON.parse(JSON.stringify(processed))) // Deep clone to avoid immediate state sync issues
        setStep(2)
    }

    const updateReviewItem = (id: string, results: ExtractedData) => {
        setReviewData(prev => prev.map(item => item.id === id ? { ...item, results } : item))
    }

    const handleSaveBatch = async () => {
        if (!user) {
            alert('Bạn cần đăng nhập để thực hiện thao tác này.')
            return
        }

        setIsSaving(true)
        try {
            // 1. Fetch Document Types with diagnostic logging
            const { data: docTypes, error: typeError } = await supabase.from('document_types').select('id, code, name')
            if (typeError) throw new Error('Không thể lấy danh sách loại phiếu: ' + typeError.message)

            console.log('--- DATABASE DIAGNOSTICS ---')
            console.log('Available Document Types:', docTypes)

            for (const doc of reviewData) {
                const results = doc.results!
                const docTypeCode = (results.document_type || 'PN').toUpperCase().trim()

                // Robust matching: find ID by code
                const docType = docTypes?.find(t => t.code.toUpperCase().trim() === docTypeCode)
                const docTypeId = docType?.id

                if (!docTypeId) {
                    const availableCodes = docTypes?.map(t => t.code).join(', ') || 'NONE'
                    throw new Error(`Không tìm thấy loại phiếu "${docTypeCode}" trong DB (DB hiện có: ${availableCodes}). Vui lòng kiểm tra lại SQL đã chạy.`)
                }

                console.log(`Processing ${docTypeCode} - Doc#: ${results.document_number}`)

                // Warehouse ID mapping
                const whId = warehouses.find(w => w.name === results.warehouse?.name)?.id

                // 2. Insert Document Header (Standardized for master_sync schema)
                const { data: newDoc, error: docError } = await supabase
                    .from('documents')
                    .insert({
                        document_type_id: docTypeId,
                        document_number: results.document_number || `AUTO-${Math.random().toString(36).substring(7).toUpperCase()}`,
                        document_date: results.document_date || new Date().toISOString().split('T')[0],
                        // Mapping based on type: PN/PDC -> destination, PX/PDC -> source
                        destination_warehouse_id: (docTypeCode === 'PN' || docTypeCode === 'PDC') ? whId : null,
                        source_warehouse_id: (docTypeCode === 'PX' || docTypeCode === 'PDC') ? whId : null,
                        ai_extracted_data: results,
                        ai_confidence_score: results.confidence,
                        status: 'completed',
                        notes: results.notes,
                        created_by: user.id
                    })
                    .select()
                    .single()

                if (docError) throw new Error(`Lỗi lưu phiếu ${results.document_number || 'mới'}: ${docError.message}`)

                // 3. Items & Materials
                for (const item of results.items) {
                    let materialId: string | null = null

                    const { data: existingMat } = await supabase
                        .from('materials')
                        .select('id')
                        .eq('name', (item.name || '').trim())
                        .maybeSingle()

                    if (existingMat) {
                        materialId = existingMat.id
                    } else {
                        const { data: newMat, error: matError } = await supabase
                            .from('materials')
                            .insert({
                                name: (item.name || 'Vật tư chưa đặt tên').trim(),
                                unit: (item.unit || 'Cái').trim(),
                                code: ((item.name || 'VT').substring(0, 3) + '-' + (item.unit || 'DV').substring(0, 2)).toUpperCase() + '-' + Math.random().toString(36).substring(7).toUpperCase()
                            })
                            .select()
                            .single()

                        if (matError) throw new Error(`Lỗi tạo vật tư ${item.name}: ${matError.message}`)
                        materialId = newMat.id
                    }

                    // 4. Insert Document Item
                    const { error: itemError } = await supabase
                        .from('document_items')
                        .insert({
                            document_id: newDoc.id,
                            material_id: materialId,
                            material_name: (item.name || '').trim(), // Provide for legacy schema compatibility
                            quantity: item.quantity || 0,
                            unit: (item.unit || 'Cái').trim(),
                            notes: item.notes
                        })

                    if (itemError) throw new Error(`Lỗi lưu vật tư ${item.name} trong phiếu ${newDoc.document_number}: ${itemError.message}`)
                }
            }

            setSavedCount(reviewData.length)
            setShowSuccessModal(true)
            toast.success('Đã lưu ' + reviewData.length + ' phiếu thành công!')
            // router.push('/dashboard/inventory') // Moved to modal actions
        } catch (err: any) {
            console.error('Save Failure:', err)
            alert('Lỗi: ' + err.message)
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-20 animate-in fade-in duration-500">
            {/* Steps Indicator */}
            <div className="flex items-center justify-center mb-8">
                <div className="flex items-center w-full max-w-xs">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors ${step >= 1 ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 text-slate-400'}`}>
                        {step > 1 ? <CheckCircle2 className="h-5 w-5" /> : '1'}
                    </div>
                    <div className={`flex-1 h-0.5 mx-2 ${step >= 2 ? 'bg-blue-600' : 'bg-slate-200'}`} />
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors ${step >= 2 ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 text-slate-400'}`}>
                        2
                    </div>
                </div>
            </div>

            {step === 1 ? (
                /* STEP 1: UPLOAD & PROCESS */
                <div className="space-y-6">
                    <div className="flex justify-between items-end border-b pb-5">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Bước 1: Upload & Phân Tích</h1>
                            <p className="text-muted-foreground mt-1">
                                Upload ảnh phiếu, AI sẽ tự động đọc dữ liệu thô.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-1 space-y-6">
                            <Card className="shadow-sm">
                                <CardHeader className="pb-4"><CardTitle className="text-lg">Cấu Hình AI</CardTitle></CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Gemini API Key</label>
                                        <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="AIza..." className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 transition-all" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">AI Model</label>
                                        <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500">
                                            <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                                            <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Prompt Template</label>
                                        <select value={selectedPromptId} onChange={(e) => setSelectedPromptId(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500">
                                            {prompts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                        </select>
                                    </div>
                                    <Button onClick={startBatchProcessing} disabled={isProcessing || fileList.length === 0} className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white shadow-md font-semibold">
                                        {isProcessing ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Đang Xử Lý...</> : <><Zap className="mr-2 h-5 w-5 fill-current" /> Bắt Đầu Phân Tích</>}
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="lg:col-span-2 space-y-6">
                            <div {...getRootProps()} className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${isDragActive ? 'border-blue-500 bg-blue-50/50 scale-[0.99]' : 'border-slate-200 hover:border-blue-400 hover:bg-slate-50'}`}>
                                <input {...getInputProps()} />
                                <div className="h-16 w-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4"><Upload className="h-8 w-8" /></div>
                                <p className="text-lg font-bold text-slate-700 dark:text-slate-200">Kéo thả ảnh phiếu vào đây</p>
                            </div>

                            <div className="space-y-4">
                                {fileList.length > 0 && (
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-bold text-lg">Danh Sách Tài Liệu ({fileList.length})</h3>
                                        <Button variant="ghost" size="sm" onClick={() => setFileList([])} className="text-destructive hover:bg-destructive/10">Xóa Tất Cả</Button>
                                    </div>
                                )}
                                <div className="grid grid-cols-1 gap-3">
                                    {fileList.map((item) => (
                                        <Card key={item.id} className="overflow-hidden border-slate-200 group">
                                            <div className="flex h-28">
                                                <div className="w-28 h-28 relative shrink-0 cursor-zoom-in group-hover:opacity-90 transition-opacity" onDoubleClick={() => setPreviewImage(item.preview)}>
                                                    <Image src={item.preview} alt={item.file.name} fill className="object-cover" />
                                                </div>
                                                <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
                                                    <div className="flex justify-between items-start gap-2">
                                                        <div className="min-w-0">
                                                            <h4 className="font-bold text-slate-800 truncate" title={item.file.name}>{item.file.name}</h4>
                                                            <StatusBadge status={item.status} />
                                                        </div>
                                                        <button onClick={() => removeFile(item.id)} className="p-1 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-destructive"><X className="h-4 w-4" /></button>
                                                    </div>
                                                    {item.status === 'success' && item.results && (
                                                        <div className="flex gap-4 text-[10px] font-medium text-slate-500">
                                                            <span>{item.results.document_type || '---'} • {item.results.document_number || '---'}</span>
                                                            <span className="text-green-600 font-bold">{item.results.confidence}%</span>
                                                        </div>
                                                    )}
                                                    {item.status === 'error' && item.error && (
                                                        <button
                                                            onClick={() => setViewingError(item.error || 'Lỗi không xác định')}
                                                            className="text-[10px] text-destructive hover:underline font-bold flex items-center gap-1"
                                                        >
                                                            <AlertCircle className="h-3 w-3" />
                                                            Xem Chi Tiết Lỗi
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            </div>

                            {fileList.filter(f => f.status === 'success').length > 0 && (
                                <div className="flex justify-end pt-4">
                                    <Button onClick={goToReview} size="lg" className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg px-8">
                                        Tiếp Tục Kiểm Tra
                                        <ChevronRight className="ml-2 h-5 w-5" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                /* STEP 2: REVIEW & EDIT */
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                    <div className="flex justify-between items-end border-b pb-5">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Bước 2: Kiểm Tra & Chỉnh Sửa</h1>
                            <p className="text-muted-foreground mt-1">
                                Xem lại nội dung các phiếu AI đã trích xuất, chỉnh sửa nếu cần trước khi lưu vào kho.
                            </p>
                        </div>
                        <Button variant="ghost" onClick={() => setStep(1)} className="flex items-center gap-2">
                            <ArrowLeft className="h-4 w-4" /> Quay lại
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 gap-8">
                        {reviewData.map((item) => (
                            <div key={item.id} className="space-y-2">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                    <FileImage className="h-3 w-3" />
                                    <span>Tệp gốc: {item.file.name}</span>
                                </div>
                                <DocumentReviewCard
                                    data={item.results!}
                                    onUpdate={(res) => updateReviewItem(item.id, res)}
                                    warehouses={warehouses}
                                    suppliers={suppliers}
                                />
                            </div>
                        ))}
                    </div>

                    <div className="sticky bottom-8 z-20 flex justify-end gap-4">
                        <Card className="shadow-2xl border-blue-200 bg-white/80 backdrop-blur-md p-4 flex items-center gap-6">
                            <div className="text-right">
                                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Tổng cộng</p>
                                <p className="text-lg font-bold text-slate-800">{reviewData.length} phiếu sẵn sàng</p>
                            </div>
                            <Button
                                onClick={handleSaveBatch}
                                size="lg"
                                disabled={isSaving}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-10 h-12 shadow-md shadow-blue-200"
                            >
                                {isSaving ? (
                                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Đang lưu...</>
                                ) : (
                                    <><Save className="mr-2 h-5 w-5" /> Xác nhận & Lưu vào Kho</>
                                )}
                            </Button>
                        </Card>
                    </div>
                </div>
            )}

            {/* Full Image Preview Modal */}
            {/* AI Error Modal */}
            {viewingError && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <Card className="w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200 border-red-100 dark:border-red-900/50 overflow-hidden bg-white dark:bg-slate-900">
                        <CardHeader className="flex flex-row items-center gap-4 bg-red-50 dark:bg-red-950/20 pb-6">
                            <div className="p-3 bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 rounded-full">
                                <AlertCircle className="h-6 w-6" />
                            </div>
                            <div className="flex-1">
                                <CardTitle className="text-xl text-slate-900 dark:text-slate-100">Chi Tiết Lỗi AI</CardTitle>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Thông tin phản hồi từ hệ thống phân tích.</p>
                            </div>
                            <button onClick={() => setViewingError(null)} className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full transition-colors">
                                <X className="h-4 w-4 text-slate-500 hover:text-red-600" />
                            </button>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="p-4 bg-slate-900 text-slate-100 rounded-xl font-mono text-[11px] border border-slate-800 overflow-x-auto whitespace-pre-wrap max-h-[300px] shadow-inner">
                                <span className="text-red-400">Error:</span> {viewingError}
                            </div>
                            <div className="mt-5 space-y-3 bg-blue-50/50 dark:bg-blue-950/20 p-4 rounded-xl border border-blue-100/50 dark:border-blue-900/30">
                                <p className="text-sm font-bold text-blue-900 dark:text-blue-300 flex items-center gap-2">
                                    <Zap className="h-4 w-4 fill-current" /> Gợi ý sửa lỗi:
                                </p>
                                <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1.5 list-disc pl-4">
                                    <li>Kiểm tra lại **Gemini API Key** trong Cài đặt hoặc nhập lại phía trên.</li>
                                    <li>Đảm bảo ảnh tải lên rõ nét, không bị che khuất hoặc xoay ngược.</li>
                                    <li>Nếu lỗi "Quota exceeded", hãy thử đổi sang Model khác (như Flash).</li>
                                </ul>
                            </div>
                        </CardContent>
                        <div className="p-6 pt-0">
                            <Button onClick={() => setViewingError(null)} className="w-full bg-slate-900 hover:bg-slate-800 text-white h-11 font-semibold">
                                Đóng Cửa Sổ
                            </Button>
                        </div>
                    </Card>
                </div>
            )}
            {/* Success Modal */}
            {showSuccessModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-500">
                    <Card className="w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-300 border-none overflow-hidden bg-white">
                        <div className="h-2 bg-gradient-to-r from-blue-600 to-emerald-500 w-full" />
                        <CardContent className="p-8 flex flex-col items-center text-center">
                            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6 animate-bounce">
                                <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                            </div>

                            <h2 className="text-2xl font-black text-slate-900 mb-2">Lưu Kho Thành Công!</h2>
                            <p className="text-slate-500 mb-8 text-sm px-4">
                                <span className="font-bold text-blue-600">{savedCount} phiếu</span> đã được trích xuất dữ liệu và cập nhật vào hệ thống kho bãi.
                            </p>

                            <div className="grid grid-cols-1 w-full gap-3">
                                <Button
                                    onClick={() => {
                                        setShowSuccessModal(false)
                                        setFileList([])
                                        setReviewData([])
                                        setStep(1)
                                    }}
                                    className="bg-blue-600 hover:bg-blue-700 text-white h-12 text-base font-bold shadow-lg shadow-blue-200"
                                >
                                    Tiếp tục nhập phiếu mới
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => router.push('/dashboard/inventory')}
                                    className="h-12 border-slate-200 text-slate-600 hover:bg-slate-50 font-medium"
                                >
                                    Xem tồn kho thực tế
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}

function StatusBadge({ status }: { status: 'waiting' | 'processing' | 'success' | 'error' }) {
    switch (status) {
        case 'waiting': return <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium italic">Chờ Xử Lý</span>
        case 'processing': return <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 font-medium animate-pulse">Đang Đọc...</span>
        case 'success': return <div className="flex items-center text-green-600 text-[10px] font-bold"><CheckCircle2 className="h-3 w-3 mr-1" /> HOÀN TẤT</div>
        case 'error': return <div className="flex items-center text-destructive text-[10px] font-bold"><AlertCircle className="h-3 w-3 mr-1" /> LỖI</div>
    }
}
