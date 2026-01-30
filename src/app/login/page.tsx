'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function LoginPage() {
    const [loading, setLoading] = useState(false)
    const { signInWithGoogle } = useAuth()
    const router = useRouter()

    const handleGoogleSignIn = async () => {
        try {
            setLoading(true)
            await signInWithGoogle()
            // Redirect is handled by the auth callback
        } catch (error) {
            console.error('Login error:', error)
            alert('Đăng nhập thất bại. Vui lòng thử lại.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="relative flex min-h-screen items-center justify-center p-4 overflow-hidden">
            {/* Background Image with Overlay */}
            <div
                className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
                style={{
                    backgroundImage: 'url("https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=2070&auto=format&fit=crop")',
                }}
            >
                <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-[2px]" />
            </div>

            {/* Login Card */}
            <Card className="relative z-10 w-full max-w-md border-slate-700/50 bg-slate-900/40 backdrop-blur-xl shadow-2xl">
                <CardHeader className="space-y-3 text-center pb-8 pt-10">
                    <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 shadow-lg shadow-blue-500/20">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-8 w-8 text-white"
                        >
                            <path d="M3 3v18h18" />
                            <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
                        </svg>
                    </div>
                    <CardTitle className="text-3xl font-bold tracking-tight text-white mb-2">
                        Smart ERP
                    </CardTitle>
                    <CardDescription className="text-slate-300 text-base">
                        Hệ thống quản lý kho & xuất nhập thông minh
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 px-8 pb-10">
                    <Button
                        onClick={handleGoogleSignIn}
                        disabled={loading}
                        className="w-full h-12 bg-white text-slate-900 hover:bg-slate-100 font-medium text-base transition-all hover:scale-[1.02]"
                        size="lg"
                    >
                        {loading ? (
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        ) : (
                            <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
                                <path
                                    fill="#4285F4"
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                />
                                <path
                                    fill="#34A853"
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                />
                                <path
                                    fill="#FBBC05"
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                />
                                <path
                                    fill="#EA4335"
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                />
                            </svg>
                        )}
                        {loading ? 'Đang kết nối...' : 'Đăng nhập với Google'}
                    </Button>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-slate-600/50" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-transparent px-2 text-slate-400">
                                Protected by Enterprise Security
                            </span>
                        </div>
                    </div>

                    <div className="text-center">
                        <a
                            href="/dashboard"
                            className="text-sm text-slate-400 hover:text-white transition-colors hover:underline"
                        >
                            Truy cập Demo Dashboard
                        </a>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
