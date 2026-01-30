'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Plus, Trash2, Calendar, Hash, Home, Truck, FileText } from 'lucide-react'
import { ExtractedData } from '@/lib/ai/service'

interface DocumentReviewCardProps {
    data: ExtractedData
    onUpdate: (updated: ExtractedData) => void
    warehouses: Array<{ id: string; name: string; code: string }>
    suppliers: Array<{ id: string; name: string; code: string }>
}

export function DocumentReviewCard({ data, onUpdate, warehouses, suppliers }: DocumentReviewCardProps) {
    const handleItemChange = (index: number, field: string, value: any) => {
        const newItems = [...data.items]
        newItems[index] = { ...newItems[index], [field]: value }
        onUpdate({ ...data, items: newItems })
    }

    const removeItem = (index: number) => {
        const newItems = data.items.filter((_, i) => i !== index)
        onUpdate({ ...data, items: newItems })
    }

    const addItem = () => {
        onUpdate({
            ...data,
            items: [...data.items, { name: '', quantity: 0, unit: 'Cái' }]
        })
    }

    return (
        <Card className="border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50 border-b pb-4">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                            <FileText className="h-5 w-5" />
                        </div>
                        <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <span className="text-blue-600 font-bold">{data.document_type || '---'}</span>
                                <span className="text-slate-400">/</span>
                                <span>{data.document_number || 'SỐ PHIẾU TRỐNG'}</span>
                            </CardTitle>
                        </div>
                    </div>
                    <div className="text-xs font-medium px-2 py-1 bg-green-100 text-green-700 rounded-full">
                        Tin cậy: {data.confidence}%
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
                {data.reasoning && (
                    <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-800 flex items-start gap-2 animate-in fade-in slide-in-from-top-1 duration-500">
                        <Plus className="h-4 w-4 mt-0.5 rotate-45" />
                        <div className="flex-1">
                            <span className="font-bold mr-1 italic">AI Phân tích:</span>
                            {data.reasoning}
                        </div>
                    </div>
                )}
                {/* Header Metadata Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                            <Hash className="h-3 w-3" /> Số Phiếu
                        </label>
                        <Input
                            value={data.document_number || ''}
                            onChange={(e) => onUpdate({ ...data, document_number: e.target.value })}
                            className="h-9 text-sm"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> Ngày Phiếu
                        </label>
                        <Input
                            type="date"
                            value={data.document_date || ''}
                            onChange={(e) => onUpdate({ ...data, document_date: e.target.value })}
                            className="h-9 text-sm"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                            <Home className="h-3 w-3" /> Kho (Nhập/Xuất)
                        </label>
                        <select
                            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors"
                            value={data.warehouse?.name || ''}
                            onChange={(e) => onUpdate({ ...data, warehouse: { name: e.target.value } })}
                        >
                            <option value="">Chọn kho...</option>
                            {warehouses.map(w => (
                                <option key={w.id} value={w.name}>{w.name} ({w.code})</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                            <Truck className="h-3 w-3" /> {data.document_type === 'PN' ? 'Nhà Cung Cấp' : 'Người Nhận'}
                        </label>
                        <Input
                            value={(data.document_type === 'PN' ? data.supplier?.name : data.recipient?.name) || ''}
                            onChange={(e) => {
                                if (data.document_type === 'PN') {
                                    onUpdate({ ...data, supplier: { ...data.supplier, name: e.target.value } })
                                } else {
                                    onUpdate({ ...data, recipient: { ...data.recipient, name: e.target.value } })
                                }
                            }}
                            className="h-9 text-sm"
                            placeholder="Tên đối tác..."
                        />
                    </div>
                </div>

                {/* Items Table */}
                <div className="border rounded-lg overflow-hidden">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                <TableHead className="w-[50px] text-center">#</TableHead>
                                <TableHead>Tên Vật Tư / Hàng Hóa</TableHead>
                                <TableHead className="w-[120px]">Số Lượng</TableHead>
                                <TableHead className="w-[100px]">ĐVT</TableHead>
                                <TableHead>Ghi Chú</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.items.map((item, idx) => (
                                <TableRow key={idx} className="hover:bg-slate-50 transition-colors">
                                    <TableCell className="text-center text-xs text-slate-400 font-medium">
                                        {idx + 1}
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            value={item.name}
                                            onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                                            className="h-8 text-sm border-transparent hover:border-slate-200 focus:border-blue-400 bg-transparent"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            type="number"
                                            value={item.quantity}
                                            onChange={(e) => handleItemChange(idx, 'quantity', parseFloat(e.target.value) || 0)}
                                            className="h-8 text-sm border-transparent hover:border-slate-200 focus:border-blue-400 bg-transparent"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            value={item.unit}
                                            onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                                            className="h-8 text-sm border-transparent hover:border-slate-200 focus:border-blue-400 bg-transparent"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            value={item.notes || ''}
                                            onChange={(e) => handleItemChange(idx, 'notes', e.target.value)}
                                            className="h-8 text-sm border-transparent hover:border-slate-200 focus:border-blue-400 bg-transparent"
                                            placeholder="..."
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <button
                                            onClick={() => removeItem(idx)}
                                            className="p-1 text-slate-300 hover:text-destructive transition-colors"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <div className="p-2 border-t bg-slate-50/50 flex justify-center">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            onClick={addItem}
                        >
                            <Plus className="h-3 w-3 mr-1" />
                            Thêm dòng
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
