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

---

## 6. SỬA LỖI: Permission Denied (403 Forbidden)

Nếu bạn gặp lỗi: `Permission to ... denied to ...` hoặc `403 Forbidden`, nghĩa là Git đang dùng tài khoản cũ (ví dụ: `aixaydung`) để đẩy code lên kho của tài khoản mới.

### Cách 1: Xóa tài khoản cũ trong Windows (Khuyên dùng)
1. Bấm phím **Win**, tìm kiếm: **Credential Manager** (Quản lý thông tin xác thực).
2. Chọn **Windows Credentials**.
3. Tìm các dòng có liên quan đến `git:https://github.com`.
4. Bấm vào và chọn **Remove** để xóa tài khoản cũ đi.
5. Quay lại terminal và chạy lại lệnh `git push`. Lúc này Windows sẽ hiện thông báo yêu cầu bạn đăng nhập lại tài khoản mới.

### Cách 2: Kiểm tra lại URL Remote
Đảm bảo bạn đang đẩy code lên đúng kho của mình (thay `USER_NAME` bằng tên tài khoản GitHub mới của bạn):
```powershell
# Xem URL hiện tại
git remote -v

# Nếu thấy sai tên User, hãy đổi lại:
git remote set-url origin https://github.com/TÊN_TÀI_KHOẢN_MỚI/TÊN_KHO.git
```

### Cách 3: Sử dụng Personal Access Token (PAT)
Nếu GitHub yêu cầu mật khẩu mà không được, hãy tạo Token:
1. GitHub -> **Settings** (góc phải trên) -> **Developer settings** -> **Personal access tokens** -> **Tokens (classic)**.
2. Chọn **Generate new token (classic)**, tích vào ô `repo`.
3. Lưu mã token này lại.
4. Khi chạy `git push`, nếu nó hỏi mật khẩu, hãy dán mã token này vào thay cho mật khẩu thường.

---

## 7. QUẢN LÝ NHIỀU TÀI KHOẢN GITHUB (Sử dụng SSH)

Nếu bạn dùng nhiều tài khoản GitHub trên cùng một máy và muốn mỗi dự án dùng một tài khoản riêng mà không cần đăng xuất/xóa Credential, hãy dùng **SSH Key**. Cách này giúp bạn tách biệt hoàn toàn danh tính cho từng dự án.

### Bước 1: Tạo SSH Key cho từng tài khoản
Mở terminal và chạy lệnh sau (thay email tương ứng):
```powershell
# Tạo key cho tài khoản 1
ssh-keygen -t ed25519 -C "email_tai_khoan_1@gmail.com" -f ~/.ssh/id_rsa_github_acc1

# Tạo key cho tài khoản 2
ssh-keygen -t ed25519 -C "email_tai_khoan_2@gmail.com" -f ~/.ssh/id_rsa_github_acc2
```
*(Nhấn Enter liên tục khi nó hỏi mật khẩu/passphrase)*

### Bước 2: Thêm Public Key vào GitHub
1. Copy nội dung key: `cat ~/.ssh/id_rsa_github_acc1.pub`.
2. Lên GitHub (Tài khoản 1) -> **Settings** -> **SSH and GPG keys** -> **New SSH key** -> Dán nội dung vào.
3. Làm tương tự cho tài khoản 2.

### Bước 3: Cấu hình file SSH Config
Mở (hoặc tạo) file tại đường dẫn `C:\Users\TÊN_BẠN\.ssh\config` bằng Notepad và dán nội dung:
```text
# Tài khoản 1
Host github.com-acc1
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_rsa_github_acc1

# Tài khoản 2
Host github.com-acc2
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_rsa_github_acc2
```

### Bước 4: Áp dụng vào dự án cụ thể
Thay vì dùng URL HTTPS có sẵn, bạn hãy đổi sang URL SSH sử dụng "biệt danh" (Host) vừa đặt:
```powershell
# Đổi URL sang định dạng SSH của tài khoản 2 (ví dụ dự án này thuộc tài khoản 2)
git remote set-url origin git@github.com-acc2:ungdungtudonghoa/xuatnhapton.git

# Quan trọng: Cấu hình User nội bộ cho thư mục này để commit đúng tên
git config user.name "Tên Tài Khoản 2"
git config user.email "email_tai_khoan_2@gmail.com"
```

### Bước 5: Đẩy code (Push)
Bây giờ bạn có thể push mà không sợ xung đột tài khoản:
```powershell
git push origin main
```

---

## 8. CÁCH ĐƠN GIẢN NHẤT (Không dùng SSH - Dùng Giao Diện)

Nếu bạn thấy SSH quá phức tạp và muốn một giao diện chọn tài khoản như các dự án trước, hãy dùng 1 trong 2 cách sau:

### Cách 1: Sử dụng "Username trong URL" (Khuyên dùng cho CLI)
Đây là cách đơn giản nhất để ép Git phải hỏi đúng tài khoản của dự án đó:
Khi thiết lập Remote, bạn chèn tên User vào trước `@github.com`:
```powershell
# Cú pháp: git remote set-url origin https://TÊN_USER@github.com/TÊN_USER/TÊN_KHO.git

# Ví dụ cho dự án này:
git remote set-url origin https://ungdungtudonghoa@github.com/ungdungtudonghoa/xuatnhapton.git
```
**Khi bạn Push:** Git sẽ thấy tên `ungdungtudonghoa` và hiện lên bảng đăng nhập của GitHub. Bạn chỉ cần chọn tài khoản tương ứng trên giao diện web hiện ra. Git sẽ lưu riêng mật khẩu cho user đó mà không đè lên user cũ.

### Cách 2: Sử dụng VS Code GitHub Pull Requests extension
Nếu bạn dùng VS Code:
1. Cài Extension: **GitHub Pull Requests and Issues**.
2. Ở góc dưới bên trái VS Code (biểu tượng Accounts), bạn có thể đăng nhập nhiều tài khoản GitHub cùng lúc.
3. Khi bạn thực hiện Push/Pull bằng giao diện Source Control của VS Code, nó sẽ hỏi bạn muốn dùng tài khoản nào đã đăng nhập.

### Cách 3: Sử dụng GitHub Desktop (Dễ nhất)
Nếu bạn muốn có một phần mềm chuyên dụng để chọn tài khoản bằng chuột:
1. Tải [GitHub Desktop](https://desktop.github.com/).
2. Trong phần **Options** -> **Accounts**, bạn có thể đăng nhập nhiều tài khoản.
3. Mỗi khi mở một dự án, bạn chỉ cần chọn tài khoản tương ứng trong phần thiết lập của dự án đó trên giao diện phần mềm.

> [!IMPORTANT]
> **Tại sao dự án trước không lỗi?** 
> Vì có thể dự án trước bạn dùng chung 1 tài khoản, hoặc bạn đã chọn "Sign in with your browser" và trình duyệt lúc đó đang đăng nhập tài khoản đúng. Khi sang dự án này, do cache của Windows đang giữ tài khoản cũ nên nó tự động dùng luôn mà không hỏi lại, dẫn đến lỗi 403. Sử dụng **Cách 1** ở trên sẽ buộc nó phải hỏi lại bạn!
