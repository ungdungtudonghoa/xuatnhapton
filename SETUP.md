# Hướng Dẫn Cài Đặt - Phiếu Xuất Nhập Kho

## Bước 1: Cài Đặt Dependencies Cơ Bản

```bash
# Core Next.js dependencies
npm install next@latest react@latest react-dom@latest typescript @types/react @types/node
```

## Bước 2: Cài Đặt Tailwind CSS

```bash
npm install -D tailwindcss postcss autoprefixer tailwindcss-animate
```

## Bước 3: Cài Đặt Supabase

```bash
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
```

## Bước 4: Cài Đặt State Management & Forms

```bash
npm install zustand react-hook-form zod @hookform/resolvers
```

## Bước 5: Cài Đặt UI Components & Tables

```bash
npm install @tanstack/react-table date-fns lucide-react
```

## Bước 6: Cài Đặt Charts & File Upload

```bash
npm install recharts react-dropzone
```

## Bước 7: Cài Đặt Utilities

```bash
npm install class-variance-authority clsx tailwind-merge
```

## Bước 8: Cài Đặt Google Generative AI (Gemini)

```bash
npm install @google/generative-ai
```

---

## Hoặc Cài Tất Cả Cùng Lúc

```bash
npm install next@latest react@latest react-dom@latest typescript @types/react @types/node @supabase/supabase-js @supabase/auth-helpers-nextjs zustand react-hook-form zod @hookform/resolvers @tanstack/react-table date-fns recharts react-dropzone lucide-react class-variance-authority clsx tailwind-merge @google/generative-ai
```

```bash
npm install -D tailwindcss postcss autoprefixer tailwindcss-animate
```

---

## Sau Khi Cài Đặt Xong

### 1. Tạo file `.env.local`

```bash
# Copy từ template
copy .env.local.example .env.local
```

Sau đó chỉnh sửa `.env.local` với thông tin Supabase của bạn:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_GEMINI_API_ENDPOINT=https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent
```

### 2. Chạy Development Server

```bash
npm run dev
```

Mở trình duyệt tại: http://localhost:3000

---

## Cấu Trúc Project Đã Tạo

```
F:/2026/WebApp/PhieuXuaNhap/
├── project_plan/
│   └── implementation_plan.md
├── supabase/
│   └── migrations/
│       ├── 20260128000000_initial_schema.sql
│       ├── 20260128000001_create_triggers.sql
│       ├── 20260128000002_create_rls_policies.sql
│       └── 20260128000003_seed_data.sql
├── src/
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   └── lib/
│       ├── supabase/
│       │   └── client.ts
│       └── utils.ts
├── .env.local.example
├── .gitignore
├── next.config.mjs
├── package.json
├── postcss.config.js
├── tailwind.config.ts
└── tsconfig.json
```

---

## Next Steps

Sau khi cài đặt xong dependencies:

1. **Setup Supabase Database**
   - Tạo project mới trên https://supabase.com
   - Chạy các migration files trong `supabase/migrations/`
   - Copy API keys vào `.env.local`

2. **Test Development Server**
   ```bash
   npm run dev
   ```

3. **Tiếp tục development** theo implementation plan

---

## Troubleshooting

### Nếu gặp lỗi khi cài đặt:

1. **Clear npm cache**
   ```bash
   npm cache clean --force
   ```

2. **Xóa node_modules và cài lại**
   ```bash
   rmdir /s /q node_modules
   del package-lock.json
   npm install
   ```

3. **Kiểm tra phiên bản Node.js**
   ```bash
   node --version
   ```
   Yêu cầu: Node.js >= 18.17.0

---

## Liên Hệ & Hỗ Trợ

Nếu gặp vấn đề, vui lòng kiểm tra:
- Documentation: `project_plan/implementation_plan.md`
- Database Schema: `supabase/migrations/`
