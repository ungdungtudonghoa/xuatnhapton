'use client'

import { useState, useEffect } from 'react'
import {
    Warehouse, Plus, Search, MapPin,
    User, Phone, Edit2, Trash2,
    CheckCircle2, XCircle, MoreVertical,
    Loader2, Boxes, ArrowRight, Home
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase/client'

interface Warehouse {
    id: string
    code: string
    name: string
    address: string
    manager_name: string
    phone: string
    is_active: boolean
}

export default function WarehousePage() {
    const [warehouses, setWarehouses] = useState<Warehouse[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [showModal, setShowModal] = useState(false)
    const [editingWh, setEditingWh] = useState<Warehouse | null>(null)

    // Form states
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        address: '',
        manager_name: '',
        phone: '',
        is_active: true
    })

    useEffect(() => {
        fetchWarehouses()
    }, [])

    const fetchWarehouses = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase.from('warehouses').select('*').order('name')
            if (error) throw error
            setWarehouses(data || [])
        } catch (err) {
            console.error('Fetch error:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleEdit = (wh: Warehouse) => {
        setEditingWh(wh)
        setFormData({
            code: wh.code,
            name: wh.name,
            address: wh.address || '',
            manager_name: wh.manager_name || '',
            phone: wh.phone || '',
            is_active: wh.is_active
        })
        setShowModal(true)
    }

    const handleAddNew = () => {
        setEditingWh(null)
        setFormData({
            code: '',
            name: '',
            address: '',
            manager_name: '',
            phone: '',
            is_active: true
        })
        setShowModal(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            if (editingWh) {
                const { error } = await supabase
                    .from('warehouses')
                    .update(formData)
                    .eq('id', editingWh.id)
                if (error) throw error
            } else {
                const { error } = await supabase
                    .from('warehouses')
                    .insert([formData])
                if (error) throw error
            }
            setShowModal(false)
            fetchWarehouses()
        } catch (err: any) {
            alert('Lỗi: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    const toggleStatus = async (wh: Warehouse) => {
        try {
            const { error } = await supabase
                .from('warehouses')
                .update({ is_active: !wh.is_active })
                .eq('id', wh.id)
            if (error) throw error
            fetchWarehouses()
        } catch (err: any) {
            alert('Lỗi: ' + err.message)
        }
    }

    const filteredItems = warehouses.filter(wh =>
        wh.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        wh.code.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                        Quản Lý Hệ Thống Kho
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Thiết lập và quản lý danh sách các điểm lưu kho hàng hóa.
                    </p>
                </div>
                <Button onClick={handleAddNew} className="h-10 bg-blue-600 hover:bg-blue-700 text-white shadow-md">
                    <Plus className="mr-2 h-4 w-4" />
                    Thêm Kho Mới
                </Button>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-none shadow-sm bg-blue-50/50">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Warehouse className="h-5 w-5" /></div>
                        <div>
                            <p className="text-xs text-muted-foreground font-bold uppercase">Tổng Số Kho</p>
                            <p className="text-2xl font-bold">{warehouses.length}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-emerald-50/50">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><CheckCircle2 className="h-5 w-5" /></div>
                        <div>
                            <p className="text-xs text-muted-foreground font-bold uppercase">Đang Hoạt Động</p>
                            <p className="text-2xl font-bold">{warehouses.filter(w => w.is_active).length}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-amber-50/50">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-2 bg-amber-100 text-amber-600 rounded-lg"><Home className="h-5 w-5" /></div>
                        <div>
                            <p className="text-xs text-muted-foreground font-bold uppercase">Tạm Ngưng</p>
                            <p className="text-2xl font-bold text-amber-600">{warehouses.filter(w => !w.is_active).length}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search Bar */}
            <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                    placeholder="Tìm theo tên hoặc mã kho..."
                    className="pl-9 h-11 border-slate-200"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Warehouse Grid */}
            {loading && warehouses.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 opacity-50">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-2" />
                    <p>Đang tải danh sách kho...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredItems.map((wh) => (
                        <Card key={wh.id} className={`group overflow-hidden border-slate-200 transition-all hover:shadow-xl hover:border-blue-300 ${!wh.is_active ? 'opacity-75 grayscale-[0.5]' : ''}`}>
                            <CardHeader className="p-5 pb-3">
                                <div className="flex justify-between items-start">
                                    <div className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm border group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                        <Warehouse className="h-6 w-6" />
                                    </div>
                                    <div className="flex gap-1">
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(wh)}>
                                            <Edit2 className="h-4 w-4 text-slate-400 group-hover:text-blue-500" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleStatus(wh)}>
                                            {wh.is_active ? <XCircle className="h-4 w-4 text-amber-400" /> : <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
                                        </Button>
                                    </div>
                                </div>
                                <CardTitle className="text-lg mt-4 font-bold flex items-center justify-between">
                                    {wh.name}
                                    <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-mono text-slate-500">{wh.code}</span>
                                </CardTitle>
                                <CardDescription className="flex items-start gap-2 h-10 overflow-hidden mt-1">
                                    <MapPin className="h-3 w-3 mt-0.5 shrink-0" />
                                    {wh.address || 'Chưa cập nhật địa chỉ'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-5 pt-0 space-y-4">
                                <div className="flex items-center justify-between text-sm py-3 border-t border-slate-50">
                                    <div className="flex items-center gap-2">
                                        <User className="h-4 w-4 text-slate-400" />
                                        <span className="font-medium text-slate-700">{wh.manager_name || '---'}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Phone className="h-4 w-4 text-slate-400" />
                                        <span className="text-slate-500">{wh.phone || '---'}</span>
                                    </div>
                                </div>
                                {!wh.is_active && (
                                    <div className="bg-amber-50 text-amber-700 text-[10px] font-bold text-center py-1 rounded-full border border-amber-100 uppercase tracking-widest">
                                        Tạm Ngưng Hoạt Động
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Warehouse Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <Card className="w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
                        <CardHeader>
                            <CardTitle>{editingWh ? 'Sửa Thông Tin Kho' : 'Thêm Kho Mới'}</CardTitle>
                            <CardDescription>Nhập đầy đủ thông tin để quản lý kho hàng hiệu quả hơn.</CardDescription>
                        </CardHeader>
                        <form onSubmit={handleSubmit}>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase text-slate-500">Mã Kho</label>
                                        <Input
                                            required
                                            placeholder="VD: KHO-A"
                                            value={formData.code}
                                            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                            disabled={!!editingWh}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase text-slate-500">Tên Kho</label>
                                        <Input
                                            required
                                            placeholder="VD: Kho Vật Tư A"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-slate-500">Quản Lý</label>
                                    <Input
                                        placeholder="Tên quản lý kho"
                                        value={formData.manager_name}
                                        onChange={(e) => setFormData({ ...formData, manager_name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-slate-500">Số Điện Thoại</label>
                                    <Input
                                        placeholder="Số điện thoại liên hệ"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-slate-500">Địa Chỉ</label>
                                    <Input
                                        placeholder="Địa chỉ chi tiết của kho"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    />
                                </div>
                            </CardContent>
                            <div className="p-6 pt-0 flex justify-end gap-3">
                                <Button type="button" variant="ghost" onClick={() => setShowModal(false)} disabled={loading}>Hủy</Button>
                                <Button type="submit" className="bg-blue-600 text-white hover:bg-blue-700" disabled={loading}>
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                    {editingWh ? 'Lưu Thay Đổi' : 'Thêm Kho'}
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    )
}
