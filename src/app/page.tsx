import { Button } from '@/components/ui/button'
import {
    Zap,
    Shield,
    BarChart3,
    ArrowRight,
    ScanLine,
    Database,
    Cpu,
    CheckCircle2,
    Layers
} from 'lucide-react'
import Link from 'next/link'

export default function Home() {
    return (
        <div className="flex min-h-screen flex-col bg-background text-foreground overflow-x-hidden selection:bg-primary/30">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/10 blur-[150px] rounded-full opacity-50" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 blur-[150px] rounded-full opacity-50" />
                <div className="absolute top-[40%] left-[20%] w-[30%] h-[30%] bg-cyan-500/5 blur-[100px] rounded-full" />
                {/* Grid Pattern Overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
            </div>

            {/* Navbar */}
            <header className="fixed top-0 w-full z-50 border-b border-white/5 bg-background/60 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
                <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <Layers className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                            Smart<span className="text-blue-600 dark:text-blue-500">ERP</span>
                        </span>
                    </div>
                    <div className="hidden md:flex items-center gap-8">
                        <nav className="flex items-center gap-6">
                            <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Tính năng</a>
                            <a href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Quy trình</a>
                            <a href="#testimonials" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Khách hàng</a>
                        </nav>
                        <Link href="/login">
                            <Button className="rounded-full px-6 bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 transition-all font-medium">
                                Đăng nhập
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <main className="container mx-auto px-6 pt-32 pb-20 flex flex-col items-center text-center relative z-10">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-bold text-blue-600 dark:text-blue-400 mb-8 animate-fade-in-up">
                    <Zap className="h-3.5 w-3.5 fill-current" />
                    <span>MẠNH MẼ VỚI GEMINI 2.5 FLASH</span>
                </div>

                <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 max-w-5xl leading-[1.1] animate-fade-in-up delay-100">
                    Quản Lý Kho Thông Minh <br className="hidden md:block" />
                    <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent pb-2">
                        Tự Động Xuất Nhập Phiếu
                    </span>
                </h1>

                <p className="text-xl text-muted-foreground mb-12 max-w-2xl leading-relaxed animate-fade-in-up delay-200">
                    Đừng tốn hàng giờ nhập liệu thủ công. Hãy để công nghệ AI đọc và phân tích phiếu nhập/xuất kho của bạn chỉ trong vài giây với độ chính xác tuyệt đối.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 items-center justify-center animate-fade-in-up delay-300 w-full sm:w-auto">
                    <Link href="/login" className="w-full sm:w-auto">
                        <Button size="lg" className="w-full sm:w-auto rounded-full px-10 h-14 text-lg font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-500/20 transition-all hover:scale-105">
                            Bắt đầu ngay miễn phí
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                    </Link>
                    <a href="#features" className="w-full sm:w-auto">
                        <Button size="lg" variant="outline" className="w-full sm:w-auto rounded-full px-10 h-14 text-lg font-medium border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900">
                            Tìm hiểu thêm
                        </Button>
                    </a>
                </div>

                {/* Dashboard Preview Mockup */}
                <div className="mt-24 relative w-full max-w-6xl group perspective-1000 animate-fade-in-up delay-500">
                    {/* Glow Effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-xl blur-3xl -z-10 group-hover:opacity-100 transition-opacity duration-700 opacity-70" />

                    {/* Card Container */}
                    <div className="relative bg-slate-900 rounded-xl border border-slate-800 shadow-2xl overflow-hidden transform rotate-x-6 group-hover:rotate-x-0 transition-transform duration-700 ease-out border-t-slate-700">
                        {/* Windows controls */}
                        <div className="h-10 border-b border-slate-800 flex items-center px-4 gap-2 bg-slate-900/50 backdrop-blur">
                            <div className="flex gap-1.5">
                                <div className="h-3 w-3 rounded-full bg-red-500/80" />
                                <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                                <div className="h-3 w-3 rounded-full bg-green-500/80" />
                            </div>
                            <div className="ml-4 flex h-6 items-center rounded-md bg-slate-800 px-3 text-xs text-slate-400 font-medium font-mono border border-slate-700/50">
                                admin.smarterp.io
                            </div>
                        </div>

                        {/* Mock Inventory UI */}
                        <div className="p-6 grid grid-cols-4 gap-6 bg-slate-950/50 min-h-[500px]">
                            {/* Sidebar */}
                            <div className="hidden md:flex flex-col gap-2 col-span-1 border-r border-slate-800 pr-6">
                                <div className="h-10 w-full rounded-lg bg-blue-600/20 border border-blue-600/30 mb-4" />
                                {[1, 2, 3, 4, 5].map(i => (
                                    <div key={i} className="h-8 w-full rounded-lg bg-slate-800/50" />
                                ))}
                            </div>

                            {/* Content */}
                            <div className="col-span-4 md:col-span-3 space-y-6">
                                <div className="flex justify-between items-center">
                                    <div className="h-8 w-48 rounded-lg bg-slate-800" />
                                    <div className="h-8 w-32 rounded-lg bg-blue-600" />
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="h-24 rounded-lg bg-slate-900 border border-slate-800 p-4">
                                            <div className="h-4 w-8 rounded bg-slate-800 mb-2" />
                                            <div className="h-6 w-24 rounded bg-slate-700" />
                                        </div>
                                    ))}
                                </div>

                                <div className="h-64 w-full rounded-lg bg-slate-900 border border-slate-800 relative overflow-hidden">
                                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:16px_16px]" />
                                    <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-blue-500/10 to-transparent" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Features Section */}
            <section id="features" className="container mx-auto px-6 py-32 relative">
                <div className="text-center mb-20 max-w-3xl mx-auto">
                    <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">Mọi thứ bạn cần để quản lý kho</h2>
                    <p className="text-muted-foreground text-xl">Hệ thống all-in-one tích hợp trí tuệ nhân tạo hàng đầu, giúp doanh nghiệp tiết kiệm 90% thời gian nhập liệu.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 relative z-10">
                    <div className="p-8 rounded-3xl bg-card border border-border/50 hover:border-blue-500/50 transition-all hover:bg-blue-50/50 dark:hover:bg-blue-950/20 group">
                        <div className="h-14 w-14 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <Cpu className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h3 className="text-xl font-bold mb-3 group-hover:text-blue-600 transition-colors">AI Đọc Phiếu Siêu Tốc</h3>
                        <p className="text-muted-foreground leading-relaxed">Tự động trích xuất thông tin từ ảnh chụp phiếu nhập xuất chỉ trong 3-5 giây với Gemini 2.5 Flash.</p>
                    </div>

                    <div className="p-8 rounded-3xl bg-card border border-border/50 hover:border-emerald-500/50 transition-all hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 group">
                        <div className="h-14 w-14 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <Database className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <h3 className="text-xl font-bold mb-3 group-hover:text-emerald-600 transition-colors">Quản Lý Tồn Kho</h3>
                        <p className="text-muted-foreground leading-relaxed">Tự động cập nhật số lượng tồn kho theo thời gian thực mỗi khi có phiếu được xác nhận. Chính xác 100%.</p>
                    </div>

                    <div className="p-8 rounded-3xl bg-card border border-border/50 hover:border-purple-500/50 transition-all hover:bg-purple-50/50 dark:hover:bg-purple-950/20 group">
                        <div className="h-14 w-14 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <BarChart3 className="h-7 w-7 text-purple-600 dark:text-purple-400" />
                        </div>
                        <h3 className="text-xl font-bold mb-3 group-hover:text-purple-600 transition-colors">Báo Cáo Chi Tiết</h3>
                        <p className="text-muted-foreground leading-relaxed">Biểu đồ trực quan về xu hướng nhập xuất và cảnh báo hàng tồn kho thấp giúp ra quyết định nhanh chóng.</p>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="container mx-auto px-6 pb-32">
                <div className="bg-slate-900 rounded-[2.5rem] p-12 md:p-20 text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent to-black/50" />
                    <div className="absolute -top-24 -right-24 h-96 w-96 bg-blue-500/30 blur-[100px] rounded-full" />
                    <div className="absolute -bottom-24 -left-24 h-96 w-96 bg-purple-500/30 blur-[100px] rounded-full" />

                    <div className="relative z-10 max-w-2xl mx-auto">
                        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Sẵn sàng tối ưu hóa kho hàng của bạn?</h2>
                        <p className="text-slate-300 text-lg mb-10">Tham gia cùng hơn 2,000 doanh nghiệp đang sử dụng Smart ERP.</p>
                        <Link href="/login">
                            <Button size="lg" className="rounded-full px-12 h-14 text-lg font-bold bg-white text-slate-900 hover:bg-slate-100 hover:scale-105 transition-all shadow-xl">
                                Bắt đầu miễn phí ngay
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-border/40 py-12 bg-muted/20">
                <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-slate-900 dark:bg-white flex items-center justify-center">
                            <Layers className="h-5 w-5 text-white dark:text-slate-900" />
                        </div>
                        <span className="font-bold text-lg">Smart ERP</span>
                    </div>
                    <p className="text-sm text-muted-foreground">© 2026 Smart ERP System. All rights reserved.</p>
                    <div className="flex gap-8">
                        <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy</a>
                        <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Terms</a>
                        <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Contact</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
