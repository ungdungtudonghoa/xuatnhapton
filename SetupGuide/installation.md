# Hướng Dẫn Cài Đặt - Phiếu Xuất Nhập Kho

## ⚠️ Lỗi Thường Gặp & Cách Khắc Phục

### Lỗi: `EJSONPARSE` - package.json không hợp lệ

**Triệu chứng:**
```
npm error code EJSONPARSE
npm error JSON.parse Unexpected token '`' (0x60) in JSON at position 0
```

**Nguyên nhân:** File `package.json` có ký tự không hợp lệ (thường là dấu backtick ` ở đầu file)

**Cách khắc phục:** File `package.json` đã được sửa. Nếu vẫn gặp lỗi, xóa file và tạo lại từ template.

---

## 📦 Các Lệnh Cài Đặt Thư Viện

### ✅ Phương Án 1: Cài Từng Nhóm (Khuyến Nghị)

#### Bước 1: Core Next.js Dependencies
```bash
npm install next@latest react@latest react-dom@latest typescript @types/react @types/node
```

**Mô tả:** Cài đặt Next.js framework và TypeScript

---

#### Bước 2: Tailwind CSS
```bash
npm install -D tailwindcss postcss autoprefixer tailwindcss-animate
```

**Mô tả:** Cài đặt Tailwind CSS và các plugin cho styling

---

#### Bước 3: Supabase (Database & Auth)
```bash
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
```

**Mô tả:** Cài đặt Supabase client cho database và authentication

---

#### Bước 4: State Management & Forms
```bash
npm install zustand react-hook-form zod @hookform/resolvers
```

**Mô tả:** 
- `zustand`: State management
- `react-hook-form`: Form handling
- `zod`: Schema validation
- `@hookform/resolvers`: Kết nối Zod với React Hook Form

---

#### Bước 5: UI Components & Tables
```bash
npm install @tanstack/react-table date-fns lucide-react
```

**Mô tả:**
- `@tanstack/react-table`: Table component mạnh mẽ
- `date-fns`: Xử lý ngày tháng
- `lucide-react`: Icon library

---

#### Bước 6: Charts & File Upload
```bash
npm install recharts react-dropzone
```

**Mô tả:**
- `recharts`: Thư viện vẽ biểu đồ
- `react-dropzone`: Upload file với drag & drop

---

#### Bước 7: Utilities
```bash
npm install class-variance-authority clsx tailwind-merge
```

**Mô tả:** Các utility functions cho className và styling

---

#### Bước 8: Google Generative AI (Gemini)
```bash
npm install @google/generative-ai
```

**Mô tả:** SDK của Google Gemini AI để xử lý ảnh phiếu

---

### ✅ Phương Án 2: Cài Tất Cả Cùng Lúc

```bash
npm install next@latest react@latest react-dom@latest typescript @types/react @types/node @supabase/supabase-js @supabase/auth-helpers-nextjs zustand react-hook-form zod @hookform/resolvers @tanstack/react-table date-fns recharts react-dropzone lucide-react class-variance-authority clsx tailwind-merge @google/generative-ai
```

```bash
npm install -D tailwindcss postcss autoprefixer tailwindcss-animate
```

---

### ✅ Phương Án 3: Cài Từ package.json (Nhanh Nhất)

Vì `package.json` đã có sẵn hầu hết dependencies, bạn chỉ cần:

```bash
# Cài tất cả dependencies từ package.json
npm install

# Cài thêm Gemini AI (nếu chưa có)
npm install @google/generative-ai
```

---

## 🔧 Sau Khi Cài Đặt Xong

### 1. Tạo File Environment Variables

```bash
# Windows
copy .env.local.example .env.local

# Mac/Linux
cp .env.local.example .env.local
```

### 2. Chỉnh Sửa `.env.local`

Mở file `.env.local` và điền thông tin Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
NEXT_PUBLIC_GEMINI_API_ENDPOINT=https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent
```

**Lấy thông tin Supabase:**
1. Đăng nhập vào https://supabase.com
2. Chọn project của bạn
3. Vào **Settings** → **API**
4. Copy **Project URL** và **anon public** key

### 3. Setup Database

#### Cách 1: Sử dụng Supabase Dashboard (Khuyến nghị)

1. Vào Supabase Dashboard → **SQL Editor**
2. Chạy lần lượt các file SQL trong thư mục `supabase/migrations/`:
   - `20260128000000_initial_schema.sql` (Tạo tables)
   - `20260128000001_create_triggers.sql` (Tạo triggers)
   - `20260128000002_create_rls_policies.sql` (Tạo RLS policies)
   - `20260128000003_seed_data.sql` (Seed data mẫu)

#### Cách 2: Sử dụng Supabase CLI

```bash
# Cài Supabase CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref your-project-id

# Push migrations
supabase db push
```

### 4. Chạy Development Server

```bash
npm run dev
```

Mở trình duyệt tại: **http://localhost:3000**

---

## 🎯 Kiểm Tra Cài Đặt Thành Công

### Checklist

- [ ] `npm install` chạy thành công không có lỗi
- [ ] File `.env.local` đã được tạo và điền đầy đủ thông tin
- [ ] Database migrations đã chạy thành công trên Supabase
- [ ] `npm run dev` chạy thành công
- [ ] Mở http://localhost:3000 thấy trang landing page

### Test Kết Nối Supabase

Tạo file test: `src/app/test-supabase/page.tsx`

```typescript
'use client'
import { supabase } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export default function TestSupabase() {
  const [status, setStatus] = useState('Đang kiểm tra...')

  useEffect(() => {
    async function testConnection() {
      try {
        const { data, error } = await supabase
          .from('document_types')
          .select('*')
          .limit(1)
        
        if (error) {
          setStatus('❌ Lỗi: ' + error.message)
        } else {
          setStatus('✅ Kết nối Supabase thành công!')
        }
      } catch (err) {
        setStatus('❌ Lỗi: ' + String(err))
      }
    }
    testConnection()
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Supabase Connection</h1>
      <p className="text-lg">{status}</p>
    </div>
  )
}
```

Truy cập: http://localhost:3000/test-supabase

---

## 🐛 Troubleshooting

### Lỗi: Module not found

**Cách khắc phục:**
```bash
# Xóa node_modules và cài lại
rmdir /s /q node_modules
del package-lock.json
npm install
```

### Lỗi: Port 3000 đã được sử dụng

**Cách khắc phục:**
```bash
# Chạy trên port khác
npm run dev -- -p 3001
```

### Lỗi: Supabase connection failed

**Kiểm tra:**
1. `.env.local` có đúng thông tin không?
2. Supabase project có đang hoạt động không?
3. Database migrations đã chạy chưa?

### Lỗi: TypeScript errors

**Cách khắc phục:**
```bash
# Xóa cache TypeScript
rmdir /s /q .next
npm run dev
```

---

## 📚 Tài Liệu Tham Khảo

- **Implementation Plan**: `project_plan/implementation_plan.md`
- **Database Schema**: `supabase/migrations/`
- **Next.js Docs**: https://nextjs.org/docs
- **Supabase Docs**: https://supabase.com/docs
- **Tailwind CSS**: https://tailwindcss.com/docs

---

## 🚀 Next Steps

Sau khi cài đặt thành công:

1. ✅ Đọc `project_plan/implementation_plan.md` để hiểu kiến trúc
2. ✅ Xem database schema trong `supabase/migrations/`
3. ✅ Bắt đầu development theo roadmap
4. ✅ Test AI integration với Gemini API

---

## 💡 Tips

- **Sử dụng Git**: Khuyến nghị init git repository
  ```bash
  git init
  git add .
  git commit -m "Initial setup"
  ```

- **VS Code Extensions**: Cài đặt các extension hữu ích:
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense
  - Supabase

- **Hot Reload**: Next.js tự động reload khi bạn sửa code

---

*Cập nhật lần cuối: 2026-01-28*
