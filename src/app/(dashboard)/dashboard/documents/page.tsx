'use client'

import { useState, useEffect } from 'react'
import {
    FileText, Search, Filter, Plus,
    ArrowUpDown, Eye, Trash2,
    ArrowRightLeft, LogIn, LogOut,
    ChevronLeft, ChevronRight, MoreVertical,
    Calendar, Package, User, Hash, Loader2,
    AlertTriangle, X
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { DocumentDetailDialog } from '@/components/documents/DocumentDetailDialog'
import { toast } from 'sonner'

interface Document {
    id: string
    document_number: string
    document_date: string
    status: 'draft' | 'completed' | 'cancelled'
    notes: string
    document_types: {
        code: string
        name: string
        type: string
    }
    source_warehouse?: {
        name: string
    } | null
    destination_warehouse?: {
        name: string
    } | null
    created_at: string
}

export default function DocumentListPage() {
    const [documents, setDocuments] = useState<Document[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [activeTab, setActiveTab] = useState('ALL')
    const [selectedDocId, setSelectedDocId] = useState<string | null>(null)
    const [deletingDoc, setDeletingDoc] = useState<Document | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    // Stats
    const [stats, setStats] = useState({
        total: 0,
        in: 0,
        out: 0,
        transfer: 0
    })

    useEffect(() => {
        fetchDocuments()
    }, [activeTab])

    const fetchDocuments = async () => {
        setLoading(true)
        try {
            let query = supabase
                .from('documents')
                .select(`
          id, 
          document_number, 
          document_date, 
          status, 
          notes, 
          created_at,
          document_types (code, name, type),
          source_warehouse:source_warehouse_id (name),
          destination_warehouse:destination_warehouse_id (name)
        `)
                .order('created_at', { ascending: false })

            if (activeTab !== 'ALL') {
                query = query.eq('document_types.type', activeTab)
            }

            const { data, error } = await query
            if (error) throw error

            const docs = data as any[]
            const filteredDocs = activeTab === 'ALL'
                ? docs
                : docs.filter(d => d.document_types?.type === activeTab)

            setDocuments(filteredDocs)

            if (activeTab === 'ALL') {
                const s = {
                    total: docs.length,
                    in: docs.filter(d => d.document_types?.type === 'IN').length,
                    out: docs.filter(d => d.document_types?.type === 'OUT').length,
                    transfer: docs.filter(d => d.document_types?.type === 'TRANSFER').length
                }
                setStats(s)
            }
        } catch (err) {
            console.error('Fetch error:', err)
            toast.error('Lỗi khi tải danh sách phiếu')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!deletingDoc) return
        setIsDeleting(true)

        const deleteDoc = async () => {
            const { error } = await supabase
                .from('documents')
                .delete()
                .eq('id', deletingDoc.id)
            if (error) throw error
        }

        toast.promise(deleteDoc(), {
            loading: 'Đang xóa phiếu và các dữ liệu liên quan...',
            success: () => {
                fetchDocuments()
                setDeletingDoc(null)
                setIsDeleting(false)
                return `Đã xóa thành công phiếu ${deletingDoc.document_number}`
            },
            error: (err) => {
                setIsDeleting(false)
                return `Lỗi khi xóa phiếu: ${err.message}`
            }
        })
    }

    const filteredItems = documents.filter(doc =>
        doc.document_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.notes?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                        Quản Lý Danh Sách Phiếu
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Xem và quản lý tất cả các phiếu nhập, xuất và điều chuyển kho.
                    </p>
                </div>
                <Link href="/dashboard/documents/new">
                    <Button className="h-10 bg-blue-600 hover:bg-blue-700 text-white shadow-md">
                        <Plus className="mr-2 h-4 w-4" />
                        Tạo Phiếu Mới
                    </Button>
                </Link>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-none bg-slate-50 dark:bg-slate-900/50 shadow-sm">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><FileText className="h-5 w-5" /></div>
                        <div>
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Tổng Phiếu</p>
                            <p className="text-xl font-bold">{stats.total}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none bg-slate-50 dark:bg-slate-900/50 shadow-sm">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><LogIn className="h-5 w-5" /></div>
                        <div>
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Nhập Kho</p>
                            <p className="text-xl font-bold">{stats.in}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none bg-slate-50 dark:bg-slate-900/50 shadow-sm">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-2 bg-amber-100 text-amber-600 rounded-lg"><LogOut className="h-5 w-5" /></div>
                        <div>
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Xuất Kho</p>
                            <p className="text-xl font-bold">{stats.out}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none bg-slate-50 dark:bg-slate-900/50 shadow-sm">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-2 bg-purple-100 text-purple-600 rounded-lg"><ArrowRightLeft className="h-5 w-5" /></div>
                        <div>
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Điều Chuyển</p>
                            <p className="text-xl font-bold">{stats.transfer}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters & Actions */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-2 w-full md:w-96 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Tìm theo số phiếu..."
                        className="pl-9 h-10 border-slate-200 focus:ring-blue-500 transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-900 rounded-lg w-full md:w-auto overflow-x-auto">
                    {[
                        { label: 'Tất cả', value: 'ALL' },
                        { label: 'Nhập kho', value: 'IN' },
                        { label: 'Xuất kho', value: 'OUT' },
                        { label: 'Điều chuyển', value: 'TRANSFER' }
                    ].map((tab) => (
                        <button
                            key={tab.value}
                            onClick={() => setActiveTab(tab.value)}
                            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${activeTab === tab.value
                                ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Data Table */}
            <Card className="overflow-hidden border-slate-100 shadow-lg">
                <Table>
                    <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                        <TableRow>
                            <TableHead className="w-[180px] font-bold text-slate-700 uppercase text-[10px] tracking-wider">Số Phiếu</TableHead>
                            <TableHead className="w-[120px] font-bold text-slate-700 uppercase text-[10px] tracking-wider">Ngày Lập</TableHead>
                            <TableHead className="w-[120px] font-bold text-slate-700 uppercase text-[10px] tracking-wider text-center">Loại</TableHead>
                            <TableHead className="font-bold text-slate-700 uppercase text-[10px] tracking-wider">Kho Liên Quan</TableHead>
                            <TableHead className="w-[120px] font-bold text-slate-700 uppercase text-[10px] tracking-wider text-center">Trạng Thái</TableHead>
                            <TableHead className="w-[80px] text-right font-bold text-slate-700 uppercase text-[10px] tracking-wider">Thao Tác</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-64 text-center">
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
                                        <p className="text-sm text-muted-foreground font-medium">Đang tải danh sách...</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : filteredItems.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-64 text-center">
                                    <div className="flex flex-col items-center justify-center gap-3 opacity-50">
                                        <div className="p-4 bg-slate-100 rounded-full"><FileText className="h-10 w-10 text-slate-400" /></div>
                                        <p className="text-slate-500 font-medium">Không tìm thấy phiếu nào</p>
                                        <Link href="/dashboard/documents/new">
                                            <Button variant="outline" size="sm">Tạo phiếu đầu tiên</Button>
                                        </Link>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredItems.map((doc) => (
                                <TableRow
                                    key={doc.id}
                                    className="group cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/20 transition-colors"
                                    onClick={() => setSelectedDocId(doc.id)}
                                >
                                    <TableCell className="font-bold py-4">
                                        <div className="flex flex-col">
                                            <span className="text-slate-900 dark:text-slate-100">{doc.document_number}</span>
                                            <span className="text-[10px] text-slate-400 font-normal">{doc.document_types?.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-sm">
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <Calendar className="h-3 w-3" />
                                            {format(new Date(doc.document_date), 'dd/MM/yyyy')}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <TypeBadge type={doc.document_types?.type} />
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            {doc.document_types?.type === 'IN' && (
                                                <div className="flex items-center gap-2 text-xs">
                                                    <span className="text-slate-400 font-medium">Đến:</span>
                                                    <span className="text-slate-700 font-semibold">{doc.destination_warehouse?.name || '---'}</span>
                                                </div>
                                            )}
                                            {doc.document_types?.type === 'OUT' && (
                                                <div className="flex items-center gap-2 text-xs">
                                                    <span className="text-slate-400 font-medium">Từ:</span>
                                                    <span className="text-slate-700 font-semibold">{doc.source_warehouse?.name || '---'}</span>
                                                </div>
                                            )}
                                            {doc.document_types?.type === 'TRANSFER' && (
                                                <div className="flex items-center gap-2 text-xs">
                                                    <span className="text-slate-700 font-semibold">{doc.source_warehouse?.name || '---'}</span>
                                                    <ArrowRightLeft className="h-2 h-2 text-slate-400" />
                                                    <span className="text-slate-700 font-semibold">{doc.destination_warehouse?.name || '---'}</span>
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <StatusBadge status={doc.status} />
                                    </TableCell>
                                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex justify-end gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                                                onClick={() => setSelectedDocId(doc.id)}
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-destructive hover:bg-red-50"
                                                onClick={() => setDeletingDoc(doc)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </Card>

            {/* Document Detail Dialog Overlay */}
            {selectedDocId && (
                <DocumentDetailDialog
                    documentId={selectedDocId}
                    onClose={() => setSelectedDocId(null)}
                />
            )}

            {/* Deletion Confirmation Modal */}
            {deletingDoc && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <Card className="w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 border-red-100 bg-white dark:bg-slate-900 overflow-hidden">
                        <CardHeader className="flex flex-row items-center gap-4 bg-red-50/50 dark:bg-red-950/20 pb-6">
                            <div className="p-3 bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 rounded-full">
                                <AlertTriangle className="h-6 w-6" />
                            </div>
                            <div>
                                <CardTitle className="text-xl text-slate-900 dark:text-slate-100">Xác nhận xóa phiếu?</CardTitle>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Hành động này không thể hoàn tác.</p>
                            </div>
                            <button onClick={() => setDeletingDoc(null)} className="ml-auto p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                                <X className="h-4 w-4 text-slate-400" />
                            </button>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-6">
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-bold uppercase text-slate-400 dark:text-slate-500 tracking-wider">Số Phiếu</span>
                                    <span className="font-bold text-slate-900 dark:text-slate-100">{deletingDoc.document_number}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold uppercase text-slate-400 dark:text-slate-500 tracking-wider">Loại</span>
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{deletingDoc.document_types.name}</span>
                                </div>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-300 text-center px-4 leading-relaxed">
                                Bạn có chắc chắn muốn xóa phiếu này? <br />
                                <span className="font-bold text-red-600 dark:text-red-400">Lưu ý:</span> Tất cả dữ liệu vật tư và lịch sử liên quan sẽ bị xóa vĩnh viễn.
                            </p>
                        </CardContent>
                        <div className="p-6 pt-0 flex flex-col gap-3">
                            <Button
                                onClick={handleDelete}
                                className="w-full bg-red-600 hover:bg-red-700 text-white h-11 shadow-lg"
                                disabled={isDeleting}
                            >
                                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                                Xóa Vĩnh Viễn
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => setDeletingDoc(null)}
                                className="w-full h-11"
                                disabled={isDeleting}
                            >
                                Hủy Bỏ
                            </Button>
                        </div>
                    </Card>
                </div>
            )}

            {/* Pagination Placeholder */}
            <div className="flex items-center justify-between border-t pt-4">
                <p className="text-xs text-muted-foreground">
                    Hiển thị <strong>{filteredItems.length}</strong> trên <strong>{stats.total}</strong> kết quả
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

function TypeBadge({ type }: { type: string }) {
    switch (type) {
        case 'IN': return <span className="px-2 py-1 rounded text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200">NHẬP</span>
        case 'OUT': return <span className="px-2 py-1 rounded text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200">XUẤT</span>
        case 'TRANSFER': return <span className="px-2 py-1 rounded text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200">CHUYỂN</span>
        default: return <span className="px-2 py-1 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">{type}</span>
    }
}

function StatusBadge({ status }: { status: string }) {
    switch (status) {
        case 'completed': return <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-green-100 text-green-700">Đã Hoàn Thành</span>
        case 'draft': return <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">Bản Nháp</span>
        case 'cancelled': return <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-700">Đã Hủy</span>
        default: return <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">{status}</span>
    }
}
