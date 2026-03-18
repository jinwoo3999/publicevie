# 🚀 EVIE - Quick Start Guide

## 📖 Tổng Quan

EVIE là hệ thống quản lý và kiểm tra website/tài khoản với:
- Giao diện luxury neon animated
- Backend chuyên nghiệp với JWT + API Key
- Phân quyền 3 cấp: SuperAdmin, User, Public
- Mỗi user có danh sách riêng biệt

## ⚡ Chạy Ngay (Local)

```bash
# 1. Cài đặt dependencies
npm install

# 2. Chạy server
npm run dev

# 3. Mở browser
# - Trang chính: http://localhost:3000/index.html
# - Đăng nhập: http://localhost:3000/login.html
# - Admin: admin / admin123
```

## 🌐 Deploy Lên Internet

### Cách Nhanh Nhất (Vercel)

```bash
# 1. Push lên GitHub
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/[username]/[repo].git
git push -u origin main

# 2. Deploy trên Vercel
# - Vào https://vercel.com
# - Import GitHub repo
# - Set env: JWT_SECRET, ADMIN_PASSWORD
# - Deploy!

# 3. Cập nhật API_URL
node update-api-url.js https://your-domain.vercel.app

# 4. Push lại
git add .
git commit -m "Update API_URL"
git push
```

## 👥 Cách Sử Dụng

### Với SuperAdmin
1. Đăng nhập: `admin` / `admin123`
2. Tạo tài khoản cho team members
3. Gửi username/password cho họ
4. Quản lý danh sách riêng của mình

### Với User
1. Đăng nhập bằng tài khoản được cấp
2. Thêm websites vào danh sách
3. Thêm accounts vào danh sách
4. Mỗi user có danh sách riêng biệt

### Với Public
1. Truy cập trang chính
2. Nhập URL hoặc tài khoản
3. Quét để kiểm tra
4. Nếu trong danh sách → Có thể xóa mã ẩn

## 📁 Files Quan Trọng

```
├── server.js                    # Backend API
├── public/
│   ├── index.html              # Trang check (public)
│   ├── login.html              # Đăng nhập
│   ├── superadmin.html         # Panel SuperAdmin
│   ├── admin.html              # Panel User
│   ├── script.js               # Logic frontend
│   └── style.css               # Giao diện neon
├── DEPLOY_GUIDE.md             # Hướng dẫn deploy chi tiết
├── DEPLOYMENT_CHECKLIST.md     # Checklist deploy
├── API_GUIDE.md                # API documentation
├── USER_GUIDE.html             # Hướng dẫn cho user
└── update-api-url.js           # Script update API URL
```

## 🔑 Thông Tin Đăng Nhập Mặc Định

- **Username**: `admin`
- **Password**: `admin123` (hoặc theo ADMIN_PASSWORD trong .env)
- **Role**: SuperAdmin

## 🛠️ Các Lệnh Hữu Ích

```bash
# Chạy development
npm run dev

# Chạy production
npm start

# Update API URL sau khi deploy
node update-api-url.js https://your-domain.com

# Check port đang dùng (nếu lỗi EADDRINUSE)
# Windows:
netstat -ano | findstr :3000
taskkill /PID [PID] /F
```

## 🎯 Workflow Thực Tế

1. **SuperAdmin** tạo tài khoản cho team (vd: user1, user2, user3)
2. Mỗi **User** đăng nhập và thêm danh sách riêng:
   - user1: Quản lý websites của khách A, B, C
   - user2: Quản lý websites của khách D, E, F
   - user3: Quản lý websites của khách G, H, I
3. **Public** check website → Chỉ thành công nếu trong danh sách của user nào đó

## ⚠️ Lưu Ý

- ✅ API key tự động expire sau 24h
- ✅ JWT token expire sau 7 ngày
- ✅ Dữ liệu lưu trong memory (mất khi restart)
- ✅ Mỗi user có danh sách hoàn toàn riêng
- ✅ SuperAdmin không thể bị xóa

## 🆘 Troubleshooting

### Lỗi "EADDRINUSE: address already in use"
```bash
# Port 3000 đang được dùng, kill process:
netstat -ano | findstr :3000
taskkill /PID [PID] /F
```

### Lỗi "Unauthorized" khi đăng nhập
1. Check API_URL đã đúng chưa
2. Xóa cache: F12 → Application → Clear Storage
3. Thử đăng nhập lại

### API key hết hạn
- Đăng xuất và đăng nhập lại
- System tự động tạo key mới

## 📚 Đọc Thêm

- **Deploy chi tiết**: `DEPLOY_GUIDE.md`
- **API documentation**: `API_GUIDE.md`
- **Hướng dẫn user**: `USER_GUIDE.html`
- **Checklist deploy**: `DEPLOYMENT_CHECKLIST.md`

## 🎉 Bắt Đầu Ngay!

```bash
npm run dev
```

Mở browser: http://localhost:3000/login.html

Đăng nhập: `admin` / `admin123`

Enjoy! 🚀
