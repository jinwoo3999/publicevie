# EVIE - Xóa Mã Ẩn & Reset Tài Khoản

## 👑 Giới Thiệu

EVIE là hệ thống quản lý và kiểm tra website/tài khoản với giao diện luxury neon và backend chuyên nghiệp.

## 🚀 Tính Năng Hiện Tại

- ✅ RESTful API với Express.js
- ✅ JWT Authentication với auto-expire (7 ngày)
- ✅ API Key tự động hết hạn sau 24 giờ
- ✅ Phân quyền 3 cấp: SuperAdmin, User, Public
- ✅ Mỗi user có danh sách riêng (websites & accounts)
- ✅ Rate limiting (100 req/15min)
- ✅ Helmet.js + CORS security
- ✅ Giao diện neon luxury với hiệu ứng animated
- ✅ SuperAdmin có thể tạo user và reset password
- ✅ User có thể tự quản lý danh sách của mình

## 📦 Cài Đặt

```bash
npm install
```

## ⚙️ Cấu Hình

1. Copy `.env.example` thành `.env`:
```bash
cp .env.example .env
```

2. Cập nhật `.env`:
```env
PORT=3000
JWT_SECRET=your-jwt-secret-key-here
ADMIN_PASSWORD=admin123
```

## 🏃 Chạy Local

Development:
```bash
npm run dev
```

Production:
```bash
npm start
```

Mặc định:
- Server: http://localhost:3000
- Admin username: `admin`
- Admin password: `admin123` (hoặc theo ADMIN_PASSWORD trong .env)

## 👥 Hệ Thống Phân Quyền

### SuperAdmin (role: admin)
- Tạo tài khoản user mới
- Reset password cho user
- Xóa user
- Xem thống kê toàn hệ thống
- Quản lý danh sách riêng

### User (role: user)
- Quản lý danh sách website riêng
- Quản lý danh sách tài khoản riêng
- Kiểm tra và xóa mã ẩn

### Public
- Chỉ xem giao diện check
- Không truy cập được danh sách

## 📡 API Endpoints

Xem chi tiết trong `API_GUIDE.md`

### Auth Endpoints
- `POST /api/auth/login` - Đăng nhập (trả về JWT)
- `POST /api/auth/register` - Đăng ký user mới
- `POST /api/auth/generate-key` - Tạo API key (cần JWT)

### Check Endpoints (Cần API Key)
- `POST /api/check-website` - Kiểm tra website
- `POST /api/check-account` - Kiểm tra tài khoản
- `POST /api/clean` - Xóa mã ẩn

### Management Endpoints (Cần API Key)
- `GET /api/websites` - Lấy danh sách website
- `POST /api/websites` - Thêm website
- `DELETE /api/websites/:domain` - Xóa website
- `GET /api/accounts` - Lấy danh sách tài khoản
- `POST /api/accounts` - Thêm tài khoản
- `DELETE /api/accounts/:account` - Xóa tài khoản

### Admin Endpoints (Cần JWT + role admin)
- `GET /api/admin/users` - Lấy danh sách users
- `POST /api/admin/reset-password` - Reset password user
- `DELETE /api/admin/users/:userId` - Xóa user

## 🔒 Bảo Mật

- Rate limiting: 100 requests/15 phút
- Helmet.js security headers
- JWT authentication (expire 7 ngày)
- API Key tự động expire sau 24 giờ
- CORS configuration
- Password hashing với bcrypt
- Input validation

## 🚀 Deploy

Xem hướng dẫn chi tiết trong `DEPLOY_GUIDE.md`

### Nhanh:
1. Push code lên GitHub
2. Deploy trên Vercel/Railway/Render
3. Set environment variables
4. Cập nhật API_URL trong các file frontend

### Sau khi deploy:
1. Cập nhật `API_URL` trong:
   - `public/login.html`
   - `public/superadmin.html`
   - `public/admin.html`
   - `public/script.js`
2. Đổi `ADMIN_PASSWORD` và `JWT_SECRET` mạnh hơn
3. Test đăng nhập với admin/[password]

## 📁 Cấu Trúc

```
├── server.js              # Backend API
├── public/
│   ├── index.html        # Trang check công khai
│   ├── login.html        # Trang đăng nhập
│   ├── superadmin.html   # Panel SuperAdmin
│   ├── admin.html        # Panel User
│   ├── script.js         # Logic frontend
│   ├── style.css         # Giao diện neon luxury
│   └── config.js         # Config cũ (không dùng)
├── API_GUIDE.md          # Hướng dẫn API
├── DEPLOY_GUIDE.md       # Hướng dẫn deploy
└── USER_GUIDE.html       # Hướng dẫn cho user
```

## 🎯 Workflow

1. SuperAdmin đăng nhập → Tạo user cho team
2. User đăng nhập → Quản lý danh sách riêng
3. Public → Chỉ check website/account (không thấy danh sách)

## ⚠️ Lưu Ý

- Dữ liệu lưu trong memory (mất khi restart server)
- API key tự động expire sau 24h
- Mỗi user có danh sách hoàn toàn riêng biệt
- SuperAdmin không thể bị xóa

## 📝 Hướng Dẫn Sử Dụng

Xem `USER_GUIDE.html` để biết cách sử dụng cho người không biết IT.
