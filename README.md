# 📦 Phiếu Xuất Nhập Kho - AI Powered

Hệ thống quản lý xuất nhập tồn kho với AI tự động đọc và trích xuất dữ liệu từ ảnh phiếu.

## ✨ Tính Năng Chính

- 🤖 **AI Extraction**: Tự động đọc phiếu nhập/xuất từ ảnh bằng Gemini 2.5 Flash
- 📊 **Inventory Management**: Quản lý tồn kho tự động theo kho và vật tư
- 🏢 **Multi-tenant**: Hỗ trợ nhiều công ty dùng chung
- 📝 **Document Management**: Quản lý phiếu nhập, xuất, điều chuyển, trả hàng
- 📈 **Reports**: Báo cáo xuất nhập tồn chi tiết
- 🎨 **Modern UI**: Giao diện đẹp với dark mode

## 🚀 Quick Start

### 1. Cài Đặt Dependencies

Xem chi tiết trong [SETUP.md](./SETUP.md)

**Cài tất cả cùng lúc:**

```bash
npm install next@latest react@latest react-dom@latest typescript @types/react @types/node @supabase/supabase-js @supabase/auth-helpers-nextjs zustand react-hook-form zod @hookform/resolvers @tanstack/react-table date-fns recharts react-dropzone lucide-react class-variance-authority clsx tailwind-merge @google/generative-ai

npm install -D tailwindcss postcss autoprefixer tailwindcss-animate
```

### 2. Cấu Hình Environment

```bash
copy .env.local.example .env.local
```

Chỉnh sửa `.env.local` với thông tin Supabase của bạn.

### 3. Setup Database

Chạy các migration files trong `supabase/migrations/` trên Supabase Dashboard.

### 4. Chạy Development Server

```bash
npm run dev
```

Mở http://localhost:3000

## 📚 Documentation

- **Implementation Plan**: [project_plan/implementation_plan.md](./project_plan/implementation_plan.md)
- **Database Schema**: [supabase/migrations/](./supabase/migrations/)
- **Setup Guide**: [SETUP.md](./SETUP.md)

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **AI**: Google Gemini 2.5 Flash
- **State**: Zustand
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts

## 📁 Project Structure

```
├── project_plan/          # Documentation & plans
├── supabase/             # Database migrations
│   └── migrations/
├── src/
│   ├── app/              # Next.js app router
│   ├── components/       # React components
│   ├── lib/              # Utilities & clients
│   ├── hooks/            # Custom hooks
│   └── stores/           # Zustand stores
└── public/               # Static assets
```

## 🎯 Roadmap

### Phase 1 (Current)
- [x] Project setup
- [x] Database schema
- [ ] Authentication
- [ ] AI integration
- [ ] Document upload
- [ ] Inventory tracking

### Phase 2 (Future)
- [ ] Mobile app
- [ ] Advanced analytics
- [ ] Barcode scanning
- [ ] Multi-language

## 📝 License

ISC

## 👥 Contributors

Built with ❤️ by AI Assistant
