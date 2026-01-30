# Setup Guide - Phiếu Xuất Nhập Kho

Thư mục này chứa các hướng dẫn chi tiết để setup project.

## 📚 Danh Sách Hướng Dẫn

### 1. [Installation Guide](./installation.md)
Hướng dẫn cài đặt dependencies và setup môi trường development.

**Nội dung:**
- Cài đặt npm packages
- Khắc phục lỗi thường gặp
- Cấu hình environment variables
- Test kết nối
- Troubleshooting

### 2. [Database Setup Guide](./database-setup.md)
Hướng dẫn setup Supabase database từ đầu.

**Nội dung:**
- Tạo Supabase project
- Chạy database migrations
- Setup authentication
- Setup storage
- Test database connection

---

## 🚀 Quick Start

### Bước 1: Cài Dependencies
```bash
npm install
npm install @google/generative-ai
```

### Bước 2: Setup Environment
```bash
copy .env.local.example .env.local
```
Chỉnh sửa `.env.local` với thông tin Supabase.

### Bước 3: Setup Database
Làm theo hướng dẫn trong [database-setup.md](./database-setup.md)

### Bước 4: Run Dev Server
```bash
npm run dev
```

---

## 📖 Đọc Thêm

- **Project Plan**: `../project_plan/implementation_plan.md`
- **Database Migrations**: `../supabase/migrations/`
- **README**: `../README.md`

---

*Cập nhật lần cuối: 2026-01-28*
