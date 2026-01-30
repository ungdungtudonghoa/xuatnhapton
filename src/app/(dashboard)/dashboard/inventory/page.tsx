'use client'

import { useState, useEffect } from 'react'
import {
    Package, Search, Filter,
    ArrowUpDown, AlertTriangle,
    CheckCircle2, Info, LayoutGrid,
    MapPin, Loader2, ArrowRight,
    TrendingUp, TrendingDown,
    ChevronLeft, ChevronRight
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { supabase } from '@/lib/supabase/client'

interface InventoryItem {
    id: string
    quantity: number
    unit: string
    last_updated: string
    materials: {
        id: string
        name: string
        code: string
        unit: string
    }
    warehouses: {
        id: string
        name: string
    }
}

export default function InventoryPage() {
    const [inventory, setInventory] = useState<InventoryItem[]>([])
    const [warehouses, setWarehouses] = useState<{ id: string, name: string }[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedWarehouse, setSelectedWarehouse] = useState('ALL')

    // Stats
    const [stats, setStats] = useState({
        totalItems: 0,
        lowStock: 0,
        outOfStock: 0,
        totalWarehouses: 0
    })

    useEffect(() => {
        fetchInitialData()
    }, [])

    const fetchInitialData = async () => {
        setLoading(true)
        try {
            // 1. Fetch Warehouses for filter
            const { data: whData } = await supabase.from('warehouses').select('id, name').order('name')
            setWarehouses(whData || [])

            // 2. Fetch Inventory with joins
            const { data: invData, error } = await supabase
                .from('inventory')
                .select(`
          id, quantity, unit, last_updated,
          materials (id, name, code, unit),
          warehouses (id, name)
        `)
                .order('last_updated', { ascending: false })

            if (error) throw error
            const items = invData as any[]
            setInventory(items)

            // Calculate Stats
            setStats({
                totalItems: items.length,
                lowStock: items.filter(i => i.quantity > 0 && i.quantity < 10).length, // Arbitrary threshold for demo
                outOfStock: items.filter(i => i.quantity <= 0).length,
                totalWarehouses: whData?.length || 0
            })
        } catch (err) {
            console.error('Fetch error:', err)
        } finally {
            setLoading(false)
        }
    }

    const filteredItems = inventory.filter(item => {
        const matchesSearch =
            item.materials?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.materials?.code.toLowerCase().includes(searchQuery.toLowerCase())

        const matchesWarehouse =
            selectedWarehouse === 'ALL' || item.warehouses?.id === selectedWarehouse

        return matchesSearch && matchesWarehouse
    })

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                        Quản Lý Tồn Kho
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Theo dõi số lượng vật tư hiện có tại các kho trong hệ thống.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" className="h-10" onClick={fetchInitialData}>
                        Làm mới
                    </Button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-none bg-slate-50 dark:bg-slate-900/50 shadow-sm border-l-4 border-l-blue-500 rounded-l-none">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1">Mã Vật Tư</p>
                            <p className="text-2xl font-bold">{stats.totalItems}</p>
                        </div>
                        <Package className="h-8 w-8 text-blue-200" />
                    </CardContent>
                </Card>

                <Card className="border-none bg-slate-50 dark:bg-slate-900/50 shadow-sm border-l-4 border-l-amber-500 rounded-l-none">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1">Sắp Hết Hàng</p>
                            <p className="text-2xl font-bold text-amber-600">{stats.lowStock}</p>
                        </div>
                        <TrendingDown className="h-8 w-8 text-amber-200" />
                    </CardContent>
                </Card>

                <Card className="border-none bg-slate-50 dark:bg-slate-900/50 shadow-sm border-l-4 border-l-red-500 rounded-l-none">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1">Hết Hàng</p>
                            <p className="text-2xl font-bold text-red-600">{stats.outOfStock}</p>
                        </div>
                        <AlertTriangle className="h-8 w-8 text-red-200" />
                    </CardContent>
                </Card>

                <Card className="border-none bg-slate-50 dark:bg-slate-900/50 shadow-sm border-l-4 border-l-emerald-500 rounded-l-none">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1">Số Kho</p>
                            <p className="text-2xl font-bold">{stats.totalWarehouses}</p>
                        </div>
                        <MapPin className="h-8 w-8 text-emerald-200" />
                    </CardContent>
                </Card>
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-2 w-full md:w-96 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Tìm theo tên hoặc mã vật tư..."
                        className="pl-9 h-10 border-slate-200 focus:ring-blue-500 transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="flex items-center gap-2 px-3 h-10 border rounded-lg bg-slate-50 dark:bg-slate-900">
                        <Filter className="h-4 w-4 text-slate-400" />
                        <select
                            className="bg-transparent text-sm font-medium focus:outline-none min-w-[150px]"
                            value={selectedWarehouse}
                            onChange={(e) => setSelectedWarehouse(e.target.value)}
                        >
                            <option value="ALL">Tất cả các kho</option>
                            {warehouses.map(wh => (
                                <option key={wh.id} value={wh.id}>{wh.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Inventory Table */}
            <Card className="overflow-hidden border-slate-100 shadow-lg">
                <Table>
                    <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                        <TableRow>
                            <TableHead className="font-bold text-slate-700 uppercase text-[10px] tracking-wider">Vật Tư</TableHead>
                            <TableHead className="font-bold text-slate-700 uppercase text-[10px] tracking-wider">Kho Lưu Trữ</TableHead>
                            <TableHead className="text-right font-bold text-slate-700 uppercase text-[10px] tracking-wider">Số Lượng Tồn</TableHead>
                            <TableHead className="w-[100px] text-center font-bold text-slate-700 uppercase text-[10px] tracking-wider">Đơn Vị</TableHead>
                            <TableHead className="w-[150px] font-bold text-slate-700 uppercase text-[10px] tracking-wider text-center">Trạng Thái</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-64 text-center">
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
                                        <p className="text-sm text-muted-foreground font-medium">Đang tải dữ liệu tồn kho...</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : filteredItems.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-64 text-center">
                                    <div className="flex flex-col items-center justify-center gap-3 opacity-50">
                                        <div className="p-4 bg-slate-100 rounded-full"><LayoutGrid className="h-10 w-10 text-slate-400" /></div>
                                        <p className="text-slate-500 font-medium">Không có vật tư nào trong kho</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredItems.map((item) => (
                                <TableRow key={item.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
                                    <TableCell className="py-4">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-900 dark:text-slate-100">{item.materials?.name}</span>
                                            <span className="text-[10px] text-slate-400 font-mono">{item.materials?.code}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div className="p-1 bg-slate-100 dark:bg-slate-800 rounded">
                                                <MapPin className="h-3 w-3 text-emerald-600" />
                                            </div>
                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{item.warehouses?.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <span className={`text-base font-black ${item.quantity <= 0 ? 'text-red-500' :
                                                item.quantity < 10 ? 'text-amber-500' : 'text-slate-900 dark:text-white'
                                            }`}>
                                            {item.quantity.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 3 })}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md text-slate-500">
                                            {item.unit}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <StockBadge quantity={item.quantity} />
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </Card>

            {/* Pagination Placeholder */}
            <div className="flex items-center justify-between border-t pt-4">
                <p className="text-xs text-muted-foreground">
                    Hiển thị <strong>{filteredItems.length}</strong> vật tư
                </p>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled><ChevronLeft className="h-4 w-4" /></Button>
                    <Button variant="outline" size="sm" className="bg-blue-50 text-blue-600 border-blue-200">1</Button>
                    <Button variant="outline" size="sm" disabled><ChevronRight className="h-4 w-4" /></Button>
                </div>
            </div>
        </div>
    )
}

function StockBadge({ quantity }: { quantity: number }) {
    if (quantity <= 0) {
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-700">
            <AlertTriangle className="h-3 w-3" /> HẾT HÀNG
        </span>
    }
    if (quantity < 10) {
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">
            <TrendingDown className="h-3 w-3" /> SẮP HẾT
        </span>
    }
    return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-100 text-green-700">
        <CheckCircle2 className="h-3 w-3" /> SẴN SÀNG
    </span>
}
