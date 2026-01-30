'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
    Search,
    Filter,
    ArrowUpRight,
    ArrowDownLeft,
    History,
    Boxes,
    ArrowRight,
    TrendingUp,
    TrendingDown,
    Loader2,
    PackageSearch,
    ChevronRight,
    ExternalLink,
    Box
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table'
import { DocumentDetailDialog } from '@/components/documents/DocumentDetailDialog'

interface MaterialAggregate {
    id: string
    name: string
    code: string
    unit: string
    total_in: number
    total_out: number
    balance: number
    last_movement?: string
}

export default function MaterialsPage() {
    const [materials, setMaterials] = useState<MaterialAggregate[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedMaterialId, setSelectedMaterialId] = useState<string | null>(null)
    const [selectedDocId, setSelectedDocId] = useState<string | null>(null)

    // Stats
    const [stats, setStats] = useState({
        totalMaterials: 0,
        lowStock: 0,
        highMovement: 0
    })

    useEffect(() => {
        fetchMaterials()
    }, [])

    const fetchMaterials = async () => {
        setLoading(true)
        try {
            // 1. Fetch all materials
            const { data: mats, error: matsError } = await supabase
                .from('materials')
                .select('*')
                .order('name')

            if (matsError) throw matsError

            // 2. Fetch inventory balances
            const { data: inv, error: invError } = await supabase
                .from('inventory')
                .select('material_id, quantity')

            if (invError) throw invError

            // 3. Fetch transaction aggregates (IN/OUT)
            // Note: In a production app, this should be a DB view or RPC for performance
            const { data: tx, error: txError } = await supabase
                .from('inventory_transactions')
                .select('material_id, type, quantity')

            if (txError) throw txError

            // Process data
            const aggregated: MaterialAggregate[] = mats.map(m => {
                const materialInv = (inv || []).filter(i => i.material_id === m.id)
                const balance = materialInv.reduce((sum, i) => sum + Number(i.quantity), 0)

                const materialTx = (tx || []).filter(t => t.material_id === m.id)
                const totalIn = materialTx
                    .filter(t => t.type === 'IN' || t.type === 'TRANSFER_IN')
                    .reduce((sum, t) => sum + Number(t.quantity), 0)
                const totalOut = materialTx
                    .filter(t => t.type === 'OUT' || t.type === 'TRANSFER_OUT')
                    .reduce((sum, t) => sum + Number(t.quantity), 0)

                return {
                    ...m,
                    total_in: totalIn,
                    total_out: totalOut,
                    balance: balance
                }
            })

            setMaterials(aggregated)

            // Calc Stats
            setStats({
                totalMaterials: aggregated.length,
                lowStock: aggregated.filter(m => m.balance < 10).length,
                highMovement: aggregated.filter(m => (m.total_in + m.total_out) > 100).length
            })

        } catch (error) {
            console.error('Error fetching materials:', error)
        } finally {
            setLoading(false)
        }
    }

    const filteredMaterials = materials.filter(m =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.code.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Danh Mục Vật Tư</h1>
                    <p className="text-slate-500 mt-1">Quản lý kho và theo dõi biến động hàng hóa chi tiết.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={fetchMaterials} className="bg-white">
                        <History className="mr-2 h-4 w-4" /> Làm mới
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-none shadow-sm bg-blue-600 text-white overflow-hidden relative">
                    <div className="absolute right-[-10px] top-[-10px] opacity-10">
                        <Boxes size={120} />
                    </div>
                    <CardContent className="p-6">
                        <p className="text-blue-100 text-sm font-medium uppercase tracking-wider">Tổng số vật tư</p>
                        <h3 className="text-4xl font-bold mt-2">{stats.totalMaterials}</h3>
                        <p className="text-blue-200 text-xs mt-4 flex items-center">
                            <TrendingUp className="h-3 w-3 mr-1" /> Danh mục hàng hóa hiện có
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-emerald-600 text-white overflow-hidden relative">
                    <div className="absolute right-[-10px] top-[-10px] opacity-10">
                        <TrendingUp size={120} />
                    </div>
                    <CardContent className="p-6">
                        <p className="text-emerald-100 text-sm font-medium uppercase tracking-wider">Sắp hết hàng</p>
                        <h3 className="text-4xl font-bold mt-2">{stats.lowStock}</h3>
                        <p className="text-emerald-200 text-xs mt-4 flex items-center">
                            <ArrowDownLeft className="h-3 w-3 mr-1" /> Cần bổ sung sớm
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-slate-900 text-white overflow-hidden relative">
                    <div className="absolute right-[-10px] top-[-10px] opacity-10 text-white">
                        <TrendingDown size={120} />
                    </div>
                    <CardContent className="p-6">
                        <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Biến động mạnh</p>
                        <h3 className="text-4xl font-bold mt-2">{stats.highMovement}</h3>
                        <p className="text-slate-500 text-xs mt-4 flex items-center">
                            <TrendingUp className="h-3 w-3 mr-1 text-orange-400" /> Tần suất giao dịch cao
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Table Card */}
            <Card className="border-slate-200 shadow-xl overflow-hidden bg-white/50 backdrop-blur-sm">
                <CardHeader className="border-b bg-white/50 py-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <PackageSearch className="h-5 w-5 text-blue-600" />
                            Danh sách vật tư
                        </CardTitle>
                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Tìm tên hoặc mã vật tư..."
                                className="pl-10 bg-white border-slate-200 focus:ring-blue-500"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
                            <p className="text-slate-500 font-medium">Đang tải dữ liệu vật tư...</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader className="bg-slate-50">
                                <TableRow>
                                    <TableHead className="font-bold text-slate-700">Vật tư</TableHead>
                                    <TableHead className="font-bold text-slate-700 text-center">Đơn vị</TableHead>
                                    <TableHead className="font-bold text-slate-700 text-right">Tổng Nhập</TableHead>
                                    <TableHead className="font-bold text-slate-700 text-right">Tổng Xuất</TableHead>
                                    <TableHead className="font-bold text-slate-700 text-right">Tồn Kho</TableHead>
                                    <TableHead className="w-10"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredMaterials.length > 0 ? (
                                    filteredMaterials.map((m) => (
                                        <TableRow
                                            key={m.id}
                                            className="hover:bg-blue-50/30 cursor-pointer group transition-colors"
                                            onClick={() => setSelectedMaterialId(m.id)}
                                        >
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{m.name}</span>
                                                    <span className="text-[10px] text-slate-400 font-mono">{m.code}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center font-medium text-slate-600">
                                                <span className="px-2 py-0.5 bg-slate-100 rounded text-xs">{m.unit}</span>
                                            </TableCell>
                                            <TableCell className="text-right font-semibold text-emerald-600">
                                                +{m.total_in.toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-right font-semibold text-rose-600">
                                                -{m.total_out.toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <span className={cn(
                                                    "px-3 py-1 rounded-full font-bold text-sm",
                                                    m.balance > 10 ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"
                                                )}>
                                                    {m.balance.toLocaleString()}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-blue-400 transform group-hover:translate-x-1 transition-all" />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-20 text-slate-400">
                                            Không tìm thấy vật tư nào phù hợp.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Material Detail Slide-over / Modal */}
            {selectedMaterialId && (
                <MaterialDetailDialog
                    materialId={selectedMaterialId}
                    onClose={() => setSelectedMaterialId(null)}
                    onViewDoc={setSelectedDocId}
                />
            )}

            {/* Re-use existing detail dialog */}
            {selectedDocId && (
                <DocumentDetailDialog
                    documentId={selectedDocId}
                    onClose={() => setSelectedDocId(null)}
                />
            )}
        </div>
    )
}

function MaterialDetailDialog({ materialId, onClose, onViewDoc }: { materialId: string, onClose: () => void, onViewDoc: (id: string) => void }) {
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'ALL' | 'IN' | 'OUT'>('ALL')

    useEffect(() => {
        fetchDetail()
    }, [materialId])

    const fetchDetail = async () => {
        setLoading(true)
        try {
            // 1. Fetch material info
            const { data: mat } = await supabase.from('materials').select('*').eq('id', materialId).single()

            // 2. Fetch inventory per warehouse
            const { data: inv } = await supabase
                .from('inventory')
                .select('quantity, warehouses(name)')
                .eq('material_id', materialId)

            // 3. Fetch transaction history with documents
            const { data: tx } = await supabase
                .from('inventory_transactions')
                .select(`
                    id,
                    type,
                    quantity,
                    created_at,
                    documents(
                        id,
                        document_number,
                        document_date,
                        document_types(name)
                    )
                `)
                .eq('material_id', materialId)
                .order('created_at', { ascending: false })

            setData({ mat, inv, tx })
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    if (!data && loading) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-sm p-0 md:p-4 animate-in fade-in duration-300">
            <Card className="h-full w-full max-w-2xl shadow-2xl animate-in slide-in-from-right duration-500 overflow-hidden flex flex-col bg-slate-50 border-white/20">
                {/* Modal Header */}
                <div className="bg-slate-900 text-white p-6 relative">
                    <button onClick={onClose} className="absolute right-6 top-6 p-2 hover:bg-white/10 rounded-full transition-colors"><X className="h-5 w-5" /></button>
                    <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-900/40">
                            <Box className="h-8 w-8 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">{data?.mat?.name}</h2>
                            <p className="text-slate-400 text-sm font-mono mt-1">{data?.mat?.code} • {data?.mat?.unit}</p>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-full gap-4 py-20">
                            <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
                        </div>
                    ) : (
                        <>
                            {/* Inventory Breakdown */}
                            <div>
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Tồn kho theo vị trí</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {data?.inv?.map((i: any, idx: number) => (
                                        <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
                                            <span className="text-sm font-semibold text-slate-700">{i.warehouses?.name}</span>
                                            <span className="text-lg font-bold text-blue-600">{Number(i.quantity).toLocaleString()}</span>
                                        </div>
                                    ))}
                                    {(!data?.inv || data?.inv.length === 0) && (
                                        <div className="col-span-2 text-center py-4 bg-slate-100 rounded-xl text-slate-400 text-sm">Chưa có thông tin tồn kho cụ thể.</div>
                                    )}
                                </div>
                            </div>

                            {/* movement history table with tabs */}
                            <div className="flex flex-col h-full min-h-[400px]">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Lịch sử giao dịch</h4>
                                    <div className="flex bg-slate-200/50 p-1 rounded-lg">
                                        <button
                                            onClick={() => setActiveTab('ALL')}
                                            className={cn(
                                                "px-3 py-1.5 text-xs font-bold rounded-md transition-all",
                                                activeTab === 'ALL' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                                            )}
                                        >Tất cả</button>
                                        <button
                                            onClick={() => setActiveTab('IN')}
                                            className={cn(
                                                "px-3 py-1.5 text-xs font-bold rounded-md transition-all",
                                                activeTab === 'IN' ? "bg-emerald-500 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"
                                            )}
                                        >Nhập</button>
                                        <button
                                            onClick={() => setActiveTab('OUT')}
                                            className={cn(
                                                "px-3 py-1.5 text-xs font-bold rounded-md transition-all",
                                                activeTab === 'OUT' ? "bg-rose-500 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"
                                            )}
                                        >Xuất</button>
                                    </div>
                                </div>

                                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm flex-1">
                                    <Table>
                                        <TableHeader className="bg-slate-50">
                                            <TableRow>
                                                <TableHead className="text-[10px] font-bold uppercase py-2">Loại</TableHead>
                                                <TableHead className="text-[10px] font-bold uppercase py-2">Số phiếu</TableHead>
                                                <TableHead className="text-[10px] font-bold uppercase py-2">Ngày</TableHead>
                                                <TableHead className="text-[10px] font-bold uppercase py-2 text-center">ĐVT</TableHead>
                                                <TableHead className="text-[10px] font-bold uppercase py-2 text-right">Số lượng</TableHead>
                                                <TableHead className="w-8"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {data?.tx
                                                ?.filter((t: any) => activeTab === 'ALL' || t.type === activeTab)
                                                .map((t: any) => (
                                                    <TableRow key={t.id} className="group hover:bg-slate-50 transition-colors">
                                                        <TableCell className="py-3">
                                                            <div className={cn(
                                                                "w-6 h-6 rounded-full flex items-center justify-center",
                                                                t.type === 'IN' ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
                                                            )}>
                                                                {t.type === 'IN' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownLeft className="h-3 w-3" />}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="py-3 font-bold text-slate-700 tracking-tight">
                                                            {t.documents?.document_number || 'N/A'}
                                                        </TableCell>
                                                        <TableCell className="py-3 text-[11px] text-slate-500">
                                                            {new Date(t.created_at).toLocaleDateString('vi-VN')}
                                                        </TableCell>
                                                        <TableCell className="py-3 text-center">
                                                            <span className="text-[10px] font-medium text-slate-400">{t.unit}</span>
                                                        </TableCell>
                                                        <TableCell className={cn(
                                                            "py-3 text-right font-black",
                                                            t.type === 'IN' ? "text-emerald-600" : "text-rose-600"
                                                        )}>
                                                            {t.type === 'IN' ? '+' : '-'}{Number(t.quantity).toLocaleString()}
                                                        </TableCell>
                                                        <TableCell className="py-3">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                onClick={() => onViewDoc(t.documents?.id)}
                                                            >
                                                                <ExternalLink className="h-3 w-3 text-blue-500" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            {(!data?.tx || data?.tx?.filter((t: any) => activeTab === 'ALL' || t.type === activeTab).length === 0) && (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="text-center py-10 text-slate-400 italic text-xs">
                                                        Không có lịch sử giao dịch cho mục này.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="p-6 border-t bg-white">
                    <Button onClick={onClose} className="w-full bg-slate-900 hover:bg-slate-800 text-white shadow-lg h-12">Đóng</Button>
                </div>
            </Card>
        </div>
    )
}

function X({ className }: { className?: string }) {
    return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
}
