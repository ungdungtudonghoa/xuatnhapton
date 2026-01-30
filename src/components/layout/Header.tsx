'use client'

import { Bell, Search, Zap, HelpCircle, LayoutGrid } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useGeminiKey } from '@/hooks/useGeminiKey'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"


export function Header() {
    const { hasApiKey } = useGeminiKey()

    return (
        <header className="flex h-16 items-center justify-between gap-4 border-b bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-20 shadow-sm">
            {/* Search */}
            <div className="flex flex-1 items-center gap-4">
                <div className="relative w-full max-w-lg hidden md:block">
                    <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Tìm kiếm phiếu nhập, xuất, mã vận đơn..."
                        className="w-full bg-muted/40 pl-9 border-muted-foreground/20 focus:bg-background h-9 rounded-lg"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none hidden lg:flex items-center gap-1">
                        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                            <span className="text-xs">⌘</span>K
                        </kbd>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">

                {/* AI Status */}
                <div className={`hidden md:flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-medium transition-colors ${hasApiKey
                    ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900"
                    : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900"
                    }`}>
                    <Zap className={`h-3 w-3 ${hasApiKey ? "fill-green-600 text-green-600 dark:text-green-400" : "fill-amber-600 text-amber-600 dark:text-amber-400"}`} />
                    <span className="hidden lg:inline">{hasApiKey ? "AI Connected" : "AI Disconnected"}</span>
                </div>

                <div className="h-6 w-px bg-border/50 mx-2 hidden md:block" />

                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground">
                    <LayoutGrid className="h-5 w-5" />
                </Button>

                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground">
                    <HelpCircle className="h-5 w-5" />
                </Button>

                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground relative">
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-600 border border-background shadow-sm" />
                </Button>
            </div>
        </header>
    )
}
