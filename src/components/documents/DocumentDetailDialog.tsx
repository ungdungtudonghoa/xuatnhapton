'use client'

import { useState, useEffect } from 'react'
import {
    X, Calendar, Package, MapPin,
    User, CheckCircle2, AlertCircle,
    FileImage, ExternalLink, Loader2,
    Edit2, Save, Trash2, Plus
} from 'lucide-react'
import {
    Table, TableBody, TableCell,
    TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { supabase } from '@/lib/supabase/client'
import { format } from 'date-fns'

interface DocumentDetailDialogProps {
    documentId: string
    onClose: () => void
}

export function DocumentDetailDialog({ documentId, onClose }: DocumentDetailDialogProps) {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [doc, setDoc] = useState<any>(null)
    const [items, setItems] = useState<any[]>([])

    useEffect(() => {
        fetchDetail()
    }, [documentId])

    const fetchDetail = async () => {
        setLoading(true)
        try {
            // 1. Fetch document header
            const { data: docData, error: docError } = await supabase
                .from('documents')
                .select(`
          *,
          document_types (code, name, type),
          source_warehouse:source_warehouse_id (name),
          destination_warehouse:destination_warehouse_id (name),
          creator:created_by (full_name)
        `)
                .eq('id', documentId)
                .single()

            if (docError) throw docError
            setDoc(docData)

            // 2. Fetch document items
            const { data: itemsData, error: itemsError } = await supabase
                .from('document_items')
                .select(`
          *,
          materials (name, code, unit)
        `)
                .eq('document_id', documentId)
                .order('created_at', { ascending: true })

            if (itemsError) throw itemsError
            setItems(itemsData)
        } catch (err) {
            console.error('Fetch detail error:', err)
            onClose()
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            // 1. Update document header
            const { error: docError } = await supabase
                .from('documents')
                .update({
                    document_number: doc.document_number,
                    document_date: doc.document_date,
                    notes: doc.notes,
                    status: doc.status
                })
                .eq('id', documentId)

            if (docError) throw docError

            // 2. Update items (using upsert logic for existing items)
            // Note: For simplicity in this UI, we update quantities/names of existing items
            for (const item of items) {
                const { error: itemError } = await supabase
                    .from('document_items')
                    .update({
                        material_name: item.material_name,
                        quantity: item.quantity,
                        unit: item.unit
                    })
                    .eq('id', item.id)

                if (itemError) throw itemError
            }

            setIsEditing(false)
            fetchDetail() // Refresh data
        } catch (err: any) {
            alert('Lỗi lưu dữ liệu: ' + err.message)
        } finally {
            setSaving(false)
        }
    }

    const updateItem = (id: string, field: string, value: any) => {
        setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item))
    }

    if (loading) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                <Card className="w-full max-w-lg p-10 flex flex-col items-center justify-center">
                    <Loader2 className="h-10 w-10 text-blue-500 animate-spin mb-4" />
                    <p className="font-medium text-slate-600">Đang tải chi tiết phiếu...</p>
                </Card>
            </div>
        )
    }

    if (!doc) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">

                {/* Header */}
                <div className="p-6 border-b flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${doc.document_types.type === 'IN' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'}`}>
                            <FileImage className="h-6 w-6" />
                        </div>
                        <div>
                            {isEditing ? (
                                <Input
                                    value={doc.document_number}
                                    onChange={(e) => setDoc({ ...doc, document_number: e.target.value })}
                                    className="font-bold text-lg h-8 w-48 mb-1"
                                />
                            ) : (
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">{doc.document_number}</h2>
                            )}
                            <p className="text-sm text-muted-foreground">{doc.document_types.name}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {!isEditing && (
                            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                                <Edit2 className="h-4 w-4 mr-2" /> Sửa Phiếu
                            </Button>
                        )}
                        <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
                            <X className="h-6 w-6 text-slate-500" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {/* Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Ngày lập phiếu</label>
                            {isEditing ? (
                                <Input
                                    type="date"
                                    value={doc.document_date.split('T')[0]}
                                    onChange={(e) => setDoc({ ...doc, document_date: e.target.value })}
                                    className="h-9"
                                />
                            ) : (
                                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                                    <Calendar className="h-4 w-4 text-blue-500" />
                                    <span className="font-medium">{format(new Date(doc.document_date), 'dd/MM/yyyy')}</span>
                                </div>
                            )}
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                {doc.document_types.type === 'OUT' ? 'Kho xuất' : 'Kho nhập'}
                            </label>
                            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                                <MapPin className="h-4 w-4 text-emerald-500" />
                                <span className="font-medium">
                                    {doc.document_types.type === 'OUT'
                                        ? (doc.source_warehouse?.name || '---')
                                        : (doc.destination_warehouse?.name || '---')}
                                </span>
                                {isEditing && <span className="text-[8px] bg-slate-100 px-1 rounded text-slate-400 italic">(ReadOnly)</span>}
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Trạng thái</label>
                            <div className="flex items-center gap-2">
                                {doc.status === 'completed' ? (
                                    <><CheckCircle2 className="h-4 w-4 text-green-500" /><span className="text-green-600 font-bold text-sm uppercase">Hoàn tất</span></>
                                ) : (
                                    <><AlertCircle className="h-4 w-4 text-amber-500" /><span className="text-amber-600 font-bold text-sm uppercase">Bản nháp</span></>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold flex items-center gap-2">
                            <Package className="h-4 w-4 text-blue-500" />
                            Danh sách vật tư ({items.length})
                        </h3>
                        <div className="border rounded-xl overflow-hidden shadow-sm">
                            <Table>
                                <TableHeader className="bg-slate-50 dark:bg-slate-800">
                                    <TableRow>
                                        <TableHead className="font-bold text-[10px] uppercase text-slate-500">Mã vật tư</TableHead>
                                        <TableHead className="font-bold text-[10px] uppercase text-slate-500">Tên vật tư</TableHead>
                                        <TableHead className="text-right font-bold text-[10px] uppercase text-slate-500">Số lượng</TableHead>
                                        <TableHead className="w-[80px] font-bold text-[10px] uppercase text-slate-500 text-center">ĐVT</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {items.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-mono text-xs text-slate-400">{item.materials?.code || '---'}</TableCell>
                                            <TableCell className="font-medium text-slate-800 dark:text-slate-200">
                                                {isEditing ? (
                                                    <Input
                                                        value={item.material_name}
                                                        onChange={(e) => updateItem(item.id, 'material_name', e.target.value)}
                                                        className="h-8 text-sm"
                                                    />
                                                ) : (
                                                    item.material_name || item.materials?.name
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-blue-600">
                                                {isEditing ? (
                                                    <Input
                                                        type="number"
                                                        value={item.quantity}
                                                        onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value))}
                                                        className="h-8 text-sm text-right w-24 ml-auto"
                                                    />
                                                ) : (
                                                    item.quantity
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center text-slate-500 text-sm">
                                                {isEditing ? (
                                                    <Input
                                                        value={item.unit}
                                                        onChange={(e) => updateItem(item.id, 'unit', e.target.value)}
                                                        className="h-8 text-sm text-center"
                                                    />
                                                ) : (
                                                    item.unit
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    {/* AI Metadata & Notes */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                        <div className="space-y-3">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                                <Loader2 className="h-3 w-3" /> Chẩn đoán AI
                            </h3>
                            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs text-slate-500">Độ tin cậy trích xuất</span>
                                    <span className={`text-sm font-bold ${doc.ai_confidence_score > 80 ? 'text-green-600' : 'text-amber-600'}`}>
                                        {doc.ai_confidence_score}%
                                    </span>
                                </div>
                                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                    <div className={`h-full transition-all ${doc.ai_confidence_score > 80 ? 'bg-green-500' : 'bg-amber-500'}`} style={{ width: `${doc.ai_confidence_score}%` }} />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 text-slate-500">Ghi chú phiếu</h3>
                            {isEditing ? (
                                <Textarea
                                    value={doc.notes || ''}
                                    onChange={(e) => setDoc({ ...doc, notes: e.target.value })}
                                    className="min-h-[100px] text-sm"
                                    placeholder="Ghi chú thêm về phiếu này..."
                                />
                            ) : (
                                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border italic text-sm text-slate-600 h-full">
                                    {doc.notes || 'Không có ghi chú.'}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t flex justify-end gap-3 bg-slate-50 dark:bg-slate-800/50">
                    {isEditing ? (
                        <>
                            <Button variant="outline" onClick={() => setIsEditing(false)} disabled={saving}>Hủy Bỏ</Button>
                            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleSave} disabled={saving}>
                                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                                Lưu Thay Đổi
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button variant="outline" onClick={onClose}>Đóng</Button>
                            <Button className="bg-blue-600 hover:bg-blue-700 text-white">Xuất File PDF</Button>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
