'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import {
    LayoutDashboard,
    FileText,
    Package,
    Warehouse,
    BarChart3,
    Settings,
    Upload,
    LogOut,
    ScanLine,
    ChevronLeft,
    ChevronRight,
    Boxes,
    ClipboardList
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

const navigation = [
    { name: 'Tổng Quan', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Quản Lý Phiếu', href: '/dashboard/documents', icon: ClipboardList },
    { name: 'Nhập Liệu', href: '/dashboard/documents/new', icon: Upload },
    { name: 'Hàng Hóa', href: '/dashboard/inventory', icon: Package },
    { name: 'Vật Tư', href: '/dashboard/materials', icon: Boxes },
    { name: 'Kho Bãi', href: '/dashboard/warehouses', icon: Warehouse },
    { name: 'Báo Cáo', href: '/dashboard/reports', icon: BarChart3 },
    { name: 'Cài Đặt', href: '/dashboard/settings', icon: Settings },
]

export function Sidebar() {
    const pathname = usePathname()
    const { user, signOut } = useAuth()
    const [collapsed, setCollapsed] = useState(false)

    return (
        <div className={cn(
            "flex h-full flex-col border-r bg-slate-900 text-slate-200 transition-all duration-300 ease-in-out relative z-30",
            collapsed ? "w-20" : "w-72"
        )}>
            {/* Toggle Button */}
            <Button
                variant="ghost"
                size="icon"
                className="absolute -right-3 top-24 h-6 w-6 rounded-full border border-slate-700 bg-slate-800 text-slate-400 hover:text-white shadow-md z-40 hidden md:flex"
                onClick={() => setCollapsed(!collapsed)}
            >
                {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>

            {/* Logo */}
            <div className={cn(
                "flex h-16 items-center border-b border-slate-800 px-4 transition-all overflow-hidden",
                collapsed ? "justify-center" : "justify-start"
            )}>
                <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 shadow-lg shadow-blue-900/20 text-white">
                        <Boxes className="h-5 w-5" />
                    </div>
                    {!collapsed && (
                        <h1 className="text-lg font-bold tracking-tight text-white whitespace-nowrap">
                            Smart<span className="text-blue-500">ERP</span>
                        </h1>
                    )}
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 p-3 overflow-y-auto overflow-x-hidden">
                {navigation.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                                isActive
                                    ? 'bg-blue-600/10 text-blue-400'
                                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200',
                                collapsed && "justify-center"
                            )}
                            title={collapsed ? item.name : undefined}
                        >
                            <item.icon className={cn(
                                "h-5 w-5 shrink-0 transition-colors",
                                isActive ? "text-blue-400" : "text-slate-500 group-hover:text-slate-300"
                            )} />
                            {!collapsed && <span>{item.name}</span>}

                            {/* Active Indicator for collapsed mode */}
                            {collapsed && isActive && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r-full" />
                            )}
                        </Link>
                    )
                })}
            </nav>

            {/* User Profile */}
            <div className="border-t border-slate-800 p-3">
                {user ? (
                    <div className={cn(
                        "flex items-center gap-3 rounded-xl bg-slate-800/50 p-2",
                        collapsed ? "justify-center bg-transparent p-0" : ""
                    )}>
                        <div className="relative shrink-0">
                            {user.avatar_url ? (
                                <img
                                    src={user.avatar_url}
                                    alt={user.name}
                                    className="h-9 w-9 rounded-full object-cover border border-slate-600"
                                />
                            ) : (
                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-700 border border-slate-600 text-xs font-bold text-white">
                                    {user.name?.charAt(0) || 'U'}
                                </div>
                            )}
                            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-slate-900 block" />
                        </div>

                        {!collapsed && (
                            <div className="flex-1 min-w-0">
                                <p className="truncate text-sm font-medium text-slate-200">{user.name}</p>
                                <p className="truncate text-xs text-slate-500">{user.email}</p>
                            </div>
                        )}

                        {!collapsed && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-400 hover:text-red-400 hover:bg-red-950/30"
                                onClick={signOut}
                                title="Đăng xuất"
                            >
                                <LogOut className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                ) : (
                    !collapsed && (
                        <div className="rounded-lg bg-blue-900/20 border border-blue-900/50 p-3 text-center">
                            <p className="mb-2 text-xs text-blue-200">Bạn chưa đăng nhập</p>
                            <Link href="/login">
                                <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-500 text-white h-8 text-xs">
                                    Đăng nhập
                                </Button>
                            </Link>
                        </div>
                    )
                )}
                {collapsed && user && (
                    <div className="mt-2 flex justify-center">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-red-400"
                            onClick={signOut}
                        >
                            <LogOut className="h-4 w-4" />
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}
