'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase/client'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'

export default function TestPage() {
    const [supabaseStatus, setSupabaseStatus] = useState<'loading' | 'success' | 'error'>('loading')
    const [supabaseMessage, setSupabaseMessage] = useState('')
    const [envVars, setEnvVars] = useState({
        url: '',
        hasAnonKey: false,
    })

    useEffect(() => {
        // Check env vars
        setEnvVars({
            url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
            hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        })

        // Test Supabase connection
        async function testSupabase() {
            try {
                const { data, error } = await supabase
                    .from('document_types')
                    .select('code, name')
                    .limit(3)

                if (error) {
                    setSupabaseStatus('error')
                    setSupabaseMessage(error.message)
                } else {
                    setSupabaseStatus('success')
                    setSupabaseMessage(`Kết nối thành công! Tìm thấy ${data?.length || 0} document types.`)
                }
            } catch (err) {
                setSupabaseStatus('error')
                setSupabaseMessage(String(err))
            }
        }

        testSupabase()
    }, [])

    return (
        <div className="min-h-screen p-8 bg-background">
            <div className="max-w-4xl mx-auto space-y-6">
                <div>
                    <h1 className="text-3xl font-bold mb-2">System Test</h1>
                    <p className="text-muted-foreground">
                        Kiểm tra kết nối và cấu hình hệ thống
                    </p>
                </div>

                {/* Environment Variables */}
                <Card>
                    <CardHeader>
                        <CardTitle>Environment Variables</CardTitle>
                        <CardDescription>Kiểm tra biến môi trường</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">NEXT_PUBLIC_SUPABASE_URL</span>
                            {envVars.url ? (
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                    <code className="text-xs bg-muted px-2 py-1 rounded">
                                        {envVars.url}
                                    </code>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <XCircle className="h-4 w-4 text-red-500" />
                                    <span className="text-xs text-muted-foreground">Chưa cấu hình</span>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">NEXT_PUBLIC_SUPABASE_ANON_KEY</span>
                            {envVars.hasAnonKey ? (
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                    <span className="text-xs text-muted-foreground">Đã cấu hình</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <XCircle className="h-4 w-4 text-red-500" />
                                    <span className="text-xs text-muted-foreground">Chưa cấu hình</span>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Supabase Connection */}
                <Card>
                    <CardHeader>
                        <CardTitle>Supabase Connection</CardTitle>
                        <CardDescription>Kiểm tra kết nối database</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-start gap-3">
                            {supabaseStatus === 'loading' && (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                    <div>
                                        <p className="font-medium">Đang kiểm tra...</p>
                                        <p className="text-sm text-muted-foreground">
                                            Kết nối đến Supabase database
                                        </p>
                                    </div>
                                </>
                            )}

                            {supabaseStatus === 'success' && (
                                <>
                                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                                    <div>
                                        <p className="font-medium text-green-600">Kết nối thành công!</p>
                                        <p className="text-sm text-muted-foreground">
                                            {supabaseMessage}
                                        </p>
                                    </div>
                                </>
                            )}

                            {supabaseStatus === 'error' && (
                                <>
                                    <XCircle className="h-5 w-5 text-red-500" />
                                    <div>
                                        <p className="font-medium text-red-600">Lỗi kết nối</p>
                                        <p className="text-sm text-muted-foreground">
                                            {supabaseMessage}
                                        </p>
                                        <div className="mt-3 p-3 bg-muted rounded-md">
                                            <p className="text-xs font-medium mb-2">Cách khắc phục:</p>
                                            <ul className="text-xs space-y-1 list-disc list-inside text-muted-foreground">
                                                <li>Kiểm tra file .env.local đã được tạo chưa</li>
                                                <li>Kiểm tra SUPABASE_URL và ANON_KEY đã đúng chưa</li>
                                                <li>Chạy migrations trong Supabase Dashboard</li>
                                                <li>Restart dev server: npm run dev</li>
                                            </ul>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Next Steps */}
                <Card className="bg-primary/5 border-primary/20">
                    <CardHeader>
                        <CardTitle>Next Steps</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <p className="text-sm">
                            ✅ Nếu tất cả test đều pass, bạn có thể:
                        </p>
                        <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground ml-4">
                            <li>
                                <a href="/login" className="text-primary hover:underline">
                                    Đăng nhập
                                </a>
                            </li>
                            <li>
                                <a href="/dashboard" className="text-primary hover:underline">
                                    Vào Dashboard (Demo mode)
                                </a>
                            </li>
                            <li>
                                <a href="/dashboard/documents/new" className="text-primary hover:underline">
                                    Upload phiếu đầu tiên
                                </a>
                            </li>
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
