# Hướng Dẫn Upload GitHub và Deploy Vercel (Next.js & Supabase)

Tài liệu này hướng dẫn chi tiết cách đưa mã nguồn dự án **PhieuXuaNhap** lên GitHub và triển khai (deploy) lên nền tảng Vercel.

---

## 1. Chuẩn Bị Tài Khoản

### A. Tạo Tài Khoản GitHub
1. Truy cập [github.com](https://github.com/).
2. Click **Sign up** và làm theo hướng dẫn (email, password, username).
3. Xác nhận email để kích hoạt tài khoản.

### B. Tạo Tài Khoản Vercel
1. Truy cập [vercel.com](https://vercel.com/signup).
2. Chọn **Continue with GitHub**. Hệ thống sẽ tự động liên kết hai tài khoản này với nhau. Điều này rất quan trọng để việc deploy diễn ra tự động.

---

## 2. Cài Đặt Công Cụ (Nếu Chưa Có)

Bạn cần cài đặt **Git** trên máy tính:
1. Tải Git tại: [git-scm.com](https://git-scm.com/downloads).
2. Cài đặt với các thiết lập mặc định.
3. Kiểm tra bằng cách mở Terminal (PowerShell) và gõ: `git --version`.

---

## 3. Upload Mã Nguồn Lên GitHub

Thực hiện các bước sau tại folder dự án (`f:\2026\WebApp\PhieuXuaNhap`):

### Bước 1: Khởi tạo Git
Mở terminal tại thư mục dự án và chạy:
```powershell
git init
```

### Bước 2: Thêm file vào vùng chờ (Staging)
Hệ thống đã có file `.gitignore` để loại bỏ các thư mục nặng (`node_modules`) và thông tin bảo mật (`.env.local`). Bạn chỉ cần chạy:
```powershell
git add .
```

### Bước 3: Commit đầu tiên
```powershell
git commit -m "Initial commit - Warehouse Management System"
```

### Bước 4: Tạo Repo trên GitHub và Push
1. Lên GitHub, bấm nút **New** (màu xanh) để tạo Repository mới.
2. Đặt tên (ví dụ: `phieu-xuat-nhap-ai`). Chọn **Public** hoặc **Private**. Bấm **Create repository**.
3. GitHub sẽ hiện ra các câu lệnh mẫu. Bạn sao chép 3 câu lệnh sau (thay URL bằng URL của bạn):
```powershell
git branch -M main
git remote add origin https://github.com/USER_NAME/REPO_NAME.git
git push -u origin main
```

---

## 4. Deploy Lên Vercel

1. Đăng nhập vào [Vercel Dashboard](https://vercel.com/dashboard).
2. Bấm nút **Add New...** -> **Project**.
3. Bạn sẽ thấy danh sách Repo từ GitHub. Tìm repo bạn vừa push lên và bấm **Import**.
4. **CẤU HÌNH QUAN TRỌNG (Environment Variables):**
   Mở phần **Environment Variables** và nhập các biến từ file `.env.local` của bạn vào:
   - `NEXT_PUBLIC_SUPABASE_URL`: (Copy từ .env.local)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: (Copy từ .env.local)
   - `NEXT_PUBLIC_GEMINI_API_KEY`: (Copy từ .env.local)
5. Bấm **Deploy**.
6. Chờ khoảng 1-2 phút, Vercel sẽ cấp cho bạn một đường dẫn (URL) chính thức (ví dụ: `phieu-xuat-nhap-ai.vercel.app`).

---

## 5. Lưu Ý Sau Khi Deploy

- **Supabase Authentication:** Để tính năng đăng nhập Google/Email hoạt động trên Vercel, bạn cần vào Supabase Dashboard:
   - Paste URL của Vercel vào **Authentication** -> **URL Configuration** -> **Site URL**.
- **Cập nhật code:** Sau này mỗi khi bạn sửa code, bạn chỉ cần chạy:
  ```powershell
  git add .
  git commit -m "mô tả thay đổi"
  git push origin main
  ```
  Vercel sẽ tự động thấy thay đổi và deploy bản mới nhất cho bạn.

> [!TIP]
> Luôn giữ file `.env.local` bí mật, không bao giờ xóa nó khỏi `.gitignore`.
