'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useGeminiKey } from '@/hooks/useGeminiKey'
import { Eye, EyeOff, Key, Trash2, CheckCircle, XCircle, Loader2, Zap, Settings, RefreshCw, Save } from 'lucide-react'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { useAiPrompts } from '@/hooks/useAiPrompts'
import { Textarea } from '@/components/ui/textarea'

const GEMINI_MODELS = [
    { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
    { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
    { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
]

export default function SettingsPage() {
    const { apiKey, hasApiKey, setApiKey, clearApiKey, getMaskedKey } = useGeminiKey()
    const [inputKey, setInputKey] = useState('')
    const [showKey, setShowKey] = useState(false)
    const [saving, setSaving] = useState(false)
    const [selectedModel, setSelectedModel] = useState(GEMINI_MODELS[0].value)
    const [testing, setTesting] = useState(false)
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
    const { prompts, savePrompt, resetToDefault } = useAiPrompts()
    const [editingPromptId, setEditingPromptId] = useState<string | null>(null)
    const [tempPromptText, setTempPromptText] = useState('')

    const handleSave = () => {
        if (!inputKey.trim()) {
            alert('Vui lòng nhập API Key')
            return
        }
        try {
            setSaving(true)
            setApiKey(inputKey)
            setInputKey('')
            setTestResult(null)
            alert('Đã lưu API Key thành công!')
        } catch (error) {
            alert('Lỗi khi lưu API Key')
        } finally {
            setSaving(false)
        }
    }

    const handleClear = () => {
        if (confirm('Bạn có chắc muốn xóa API Key?')) {
            clearApiKey()
            setInputKey('')
            setTestResult(null)
            alert('Đã xóa API Key')
        }
    }

    const handleTest = async () => {
        const keyToTest = inputKey.trim() || apiKey
        if (!keyToTest) {
            setTestResult({ success: false, message: 'Vui lòng nhập API Key trước khi test' })
            return
        }

        setTesting(true)
        setTestResult(null)

        try {
            const genAI = new GoogleGenerativeAI(keyToTest)
            const model = genAI.getGenerativeModel({ model: selectedModel })

            const result = await model.generateContent('Hello, respond with "OK" if you can read this.')
            const response = await result.response
            const text = response.text()

            if (text) {
                setTestResult({
                    success: true,
                    message: `✅ Kết nối thành công! Model: ${selectedModel}\nResponse: ${text.substring(0, 100)}`
                })
            } else {
                setTestResult({
                    success: false,
                    message: '❌ API Key không hợp lệ hoặc model không phản hồi'
                })
            }
        } catch (error: any) {
            setTestResult({
                success: false,
                message: `❌ Lỗi: ${error.message || 'Không thể kết nối đến Gemini API'}`
            })
        } finally {
            setTesting(false)
        }
    }

    // Save selected model to localStorage
    const handleModelChange = (model: string) => {
        setSelectedModel(model)
        localStorage.setItem('gemini_model', model)
    }

    // Load selected model from localStorage on mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedModel = localStorage.getItem('gemini_model')
            if (savedModel) {
                setSelectedModel(savedModel)
            }
        }
    }, [])

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Cài Đặt</h1>
                <p className="text-muted-foreground mt-2">
                    Quản lý cấu hình Gemini API và test kết nối
                </p>
            </div>

            {/* Gemini API Configuration */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Key className="h-5 w-5" />
                        Gemini API Configuration
                    </CardTitle>
                    <CardDescription>
                        API Key được lưu trữ an toàn trong localStorage của trình duyệt. Không gửi lên server.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Current Key Status */}
                    {hasApiKey && (
                        <div className="p-4 bg-muted rounded-lg">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium">API Key hiện tại</p>
                                    <p className="text-sm text-muted-foreground font-mono mt-1">
                                        {getMaskedKey()}
                                    </p>
                                </div>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={handleClear}
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Xóa
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Input New Key */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">
                            {hasApiKey ? 'Cập nhật API Key mới' : 'Nhập API Key'}
                        </label>
                        <div className="relative">
                            <Input
                                type={showKey ? 'text' : 'password'}
                                placeholder="AIzaSy..."
                                value={inputKey}
                                onChange={(e) => setInputKey(e.target.value)}
                                className="pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowKey(!showKey)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Lấy API Key tại:{' '}
                            <a
                                href="https://aistudio.google.com/app/apikey"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                            >
                                Google AI Studio
                            </a>
                        </p>
                    </div>

                    {/* Model Selection */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Chọn Model</label>
                        <select
                            value={selectedModel}
                            onChange={(e) => handleModelChange(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg bg-background"
                        >
                            {GEMINI_MODELS.map((model) => (
                                <option key={model.value} value={model.value}>
                                    {model.label}
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-muted-foreground">
                            Model sẽ được sử dụng để xử lý phiếu nhập/xuất
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <Button
                            onClick={handleSave}
                            disabled={saving || !inputKey.trim()}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white shadow-sm h-11"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Đang lưu...
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Lưu API Key
                                </>
                            )}
                        </Button>
                        <Button
                            onClick={handleTest}
                            disabled={testing || (!inputKey.trim() && !hasApiKey)}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm h-11"
                        >
                            {testing ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Đang test...
                                </>
                            ) : (
                                <>
                                    <Zap className="h-4 w-4 mr-2" />
                                    Test API Key
                                </>
                            )}
                        </Button>
                    </div>

                    {/* Test Result */}
                    {testResult && (
                        <div className={`p-4 rounded-lg border ${testResult.success ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800' : 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'}`}>
                            <div className="flex items-start gap-2">
                                {testResult.success ? (
                                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                                ) : (
                                    <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                                )}
                                <p className={`text-sm whitespace-pre-line ${testResult.success ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>
                                    {testResult.message}
                                </p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* AI Prompt Templates Configuration */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        AI Prompt Templates
                    </CardTitle>
                    <CardDescription>
                        Cấu hình prompt hướng dẫn AI cách trích xuất dữ liệu từ các loại phiếu khác nhau.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 gap-6">
                        {prompts.map((prompt) => (
                            <div key={prompt.id} className="space-y-3 p-4 border rounded-xl bg-slate-50/50 dark:bg-slate-900/20">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-bold">
                                            {prompt.code}
                                        </div>
                                        <h3 className="font-bold text-sm">{prompt.name}</h3>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 text-xs text-muted-foreground hover:text-blue-600"
                                            onClick={() => {
                                                setEditingPromptId(prompt.id)
                                                setTempPromptText(prompt.prompt_text)
                                            }}
                                        >
                                            Chỉnh sửa
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 text-xs text-muted-foreground hover:text-amber-600"
                                            onClick={() => {
                                                if (confirm(`Khôi phục prompt "${prompt.name}" về mặc định?`)) {
                                                    resetToDefault(prompt.id)
                                                }
                                            }}
                                        >
                                            <RefreshCw className="h-3 w-3 mr-1" />
                                            Mặc định
                                        </Button>
                                    </div>
                                </div>

                                {editingPromptId === prompt.id ? (
                                    <div className="space-y-3">
                                        <Textarea
                                            value={tempPromptText}
                                            onChange={(e) => setTempPromptText(e.target.value)}
                                            className="min-h-[200px] text-xs font-mono leading-relaxed bg-white dark:bg-slate-900"
                                        />
                                        <div className="flex justify-end gap-2 text-xs">
                                            <Button
                                                variant="ghost"
                                                onClick={() => setEditingPromptId(null)}
                                            >
                                                Hủy
                                            </Button>
                                            <Button
                                                className="bg-blue-600 hover:bg-blue-700 text-white"
                                                onClick={() => {
                                                    savePrompt(prompt.id, tempPromptText)
                                                    setEditingPromptId(null)
                                                }}
                                            >
                                                <Save className="h-3 w-3 mr-1" />
                                                Lưu thay đổi
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-xs text-muted-foreground font-mono bg-white dark:bg-slate-900/40 p-3 rounded-lg border border-slate-100 dark:border-slate-800 line-clamp-4 overflow-hidden">
                                        {prompt.prompt_text}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Info Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Thông tin hệ thống</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Phiên bản</span>
                        <span className="font-medium">1.0.0</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Model hiện tại</span>
                        <span className="font-medium">{GEMINI_MODELS.find(m => m.value === selectedModel)?.label}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Database</span>
                        <span className="font-medium">Supabase PostgreSQL</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">API Key Status</span>
                        <span className={`font-medium ${hasApiKey ? 'text-green-600' : 'text-red-600'}`}>
                            {hasApiKey ? '✓ Đã cấu hình' : '✗ Chưa cấu hình'}
                        </span>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
