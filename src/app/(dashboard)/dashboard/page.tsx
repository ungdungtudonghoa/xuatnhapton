'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
    FileText,
    Package,
    TrendingUp,
    AlertTriangle,
    Plus,
    Settings,
    Zap,
    ArrowRight,
    CheckCircle2,
    XCircle,
    BarChart3,
    ArrowUpRight,
    ArrowDownRight,
    MoreHorizontal
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useGeminiKey } from '@/hooks/useGeminiKey'
import { supabase } from '@/lib/supabase/client'
import { format } from 'date-fns'

export default function DashboardPage() {
    const { hasApiKey } = useGeminiKey()
    const [counts, setCounts] = useState({ documents: 0, materials: 0 })

    useEffect(() => {
        const fetchStats = async () => {
            const { count: docCount } = await supabase.from('documents').select('*', { count: 'exact', head: true })
            const { count: matCount } = await supabase.from('materials').select('*', { count: 'exact', head: true })
            setCounts({ documents: docCount || 0, materials: matCount || 0 })
        }
        fetchStats()
    }, [])

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-10">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                        Tổng Quan Hệ Thống
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {format(new Date(), 'EEEE, dd/MM/yyyy')}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Link href="/dashboard/reports">
                        <Button variant="outline" className="h-9">
                            <BarChart3 className="mr-2 h-4 w-4" />
                            Báo Cáo
                        </Button>
                    </Link>
                    <Link href="/dashboard/documents/new">
                        <Button className="h-9 bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                            <Plus className="mr-2 h-4 w-4" />
                            Tạo Phiếu Mới
                        </Button>
                    </Link>
                </div>
            </div>

            {/* API Status Banner */}
            {!hasApiKey && (
                <div className="relative overflow-hidden rounded-lg border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
                    <div className="flex items-center gap-4">
                        <div className="rounded-full bg-amber-100 p-2 dark:bg-amber-900/30">
                            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-amber-900 dark:text-amber-300 text-sm">
                                Cần cấu hình AI
                            </h3>
                            <p className="text-sm text-amber-800/80 dark:text-amber-400">
                                Để kích hoạt tính năng tự động đọc phiếu, vui lòng nhập khóa API Gemini.
                            </p>
                        </div>
                        <Link href="/dashboard/settings">
                            <Button size="sm" variant="outline" className="border-amber-300 bg-white text-amber-800 hover:bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300 h-8 text-xs">
                                Cấu hình
                            </Button>
                        </Link>
                    </div>
                </div>
            )}

            {/* Stats Cards Row 1 */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Tổng Phiếu Xử Lý
                        </CardTitle>
                        <FileText className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">{counts.documents.toLocaleString()}</div>
                        <div className="flex items-center mt-1 text-xs text-green-600 font-medium">
                            <ArrowUpRight className="h-3 w-3 mr-1" />
                            Ghi nhận từ hệ thống
                        </div>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Vật Tư Trong Danh Mục
                        </CardTitle>
                        <Package className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">{counts.materials.toLocaleString()}</div>
                        <div className="flex items-center mt-1 text-xs text-slate-500">
                            Danh mục vật tư hiện hữu
                        </div>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Giá Trị Ước Tính
                        </CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">8.2 Tỷ</div>
                        <div className="flex items-center mt-1 text-xs text-green-600 font-medium">
                            <ArrowUpRight className="h-3 w-3 mr-1" />
                            Dự liệu định mức
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-indigo-600 to-blue-700 text-white border-none shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-medium text-blue-100 uppercase tracking-wider">
                            Trạng Thái AI
                        </CardTitle>
                        <Zap className="h-4 w-4 text-yellow-300" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{hasApiKey ? 'Active' : 'Inactive'}</div>
                        <div className="flex items-center mt-1 text-xs text-blue-100">
                            {hasApiKey ? 'Hệ thống sẵn sàng xử lý' : 'Chưa kết nối API'}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Area */}
            <div className="grid gap-6 md:grid-cols-7 lg:grid-cols-7 h-full">

                {/* Recent Transactions Chart Area (Placeholder) */}
                <Card className="md:col-span-4 lg:col-span-5 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-lg font-semibold">Biểu Đồ Nhập Xuất</CardTitle>
                            <CardDescription className="text-xs">Số liệu 7 ngày qua</CardDescription>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] flex items-center justify-center rounded-lg border border-dashed bg-slate-50 dark:bg-slate-900/50">
                            <div className="text-center">
                                <BarChart3 className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-20" />
                                <p className="text-sm text-muted-foreground">Chưa có đủ dữ liệu để hiển thị biểu đồ</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Right Sidebar / Quick Actions */}
                <div className="md:col-span-3 lg:col-span-2 space-y-6">
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-sm font-semibold">Thao Tác Nhanh</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-2">
                            <Link href="/dashboard/documents/new" className="group">
                                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-100 transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="p-1.5 bg-blue-100 text-blue-600 rounded-md">
                                            <FileText className="h-4 w-4" />
                                        </div>
                                        <span className="text-sm font-medium text-slate-700">Scan Phiếu</span>
                                    </div>
                                    <ArrowRight className="h-3 w-3 text-slate-400 group-hover:text-slate-600" />
                                </div>
                            </Link>
                            <Link href="/dashboard/documents" className="group">
                                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-100 transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-md">
                                            <FileText className="h-4 w-4" />
                                        </div>
                                        <span className="text-sm font-medium text-slate-700">Danh Sách Phiếu</span>
                                    </div>
                                    <ArrowRight className="h-3 w-3 text-slate-400 group-hover:text-slate-600" />
                                </div>
                            </Link>
                            <Link href="/dashboard/reports" className="group">
                                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-100 transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-md">
                                            <TrendingUp className="h-4 w-4" />
                                        </div>
                                        <span className="text-sm font-medium text-slate-700">Xem Báo Cáo</span>
                                    </div>
                                    <ArrowRight className="h-3 w-3 text-slate-400 group-hover:text-slate-600" />
                                </div>
                            </Link>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm bg-slate-900 text-slate-300">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold text-white">Hoạt Động Gần Đây</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex gap-3 items-start">
                                <div className="h-2 w-2 mt-1.5 rounded-full bg-blue-500 shrink-0" />
                                <div>
                                    <p className="text-xs text-slate-100 font-medium">Nhập kho lô hàng #9021</p>
                                    <p className="text-[10px] text-slate-500">2 phút trước • Kho A</p>
                                </div>
                            </div>
                            <div className="flex gap-3 items-start">
                                <div className="h-2 w-2 mt-1.5 rounded-full bg-green-500 shrink-0" />
                                <div>
                                    <p className="text-xs text-slate-100 font-medium">Hoàn tất kiểm kê tháng 1</p>
                                    <p className="text-[10px] text-slate-500">1 giờ trước • Hệ thống</p>
                                </div>
                            </div>
                            <div className="flex gap-3 items-start">
                                <div className="h-2 w-2 mt-1.5 rounded-full bg-amber-500 shrink-0" />
                                <div>
                                    <p className="text-xs text-slate-100 font-medium">Cảnh báo tồn kho thấp</p>
                                    <p className="text-[10px] text-slate-500">5 giờ trước • Vật tư B</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
