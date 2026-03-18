# EVIE API - Hướng Dẫn Sử Dụng

## 🔐 Hệ Thống Phân Quyền

### Roles
- **Admin**: Quản lý toàn bộ hệ thống, xem/xóa users
- **User**: Quản lý website/tài khoản riêng của mình

### API Key
- Tự động hết hạn sau **24 giờ**
- Mỗi user có thể tạo nhiều API keys
- Dùng để gọi API từ frontend

---

## 📝 Luồng Sử Dụng

### 1. Đăng Ký/Đăng Nhập

```javascript
// Đăng ký
const register = await fetch('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        username: 'user123',
        password: 'password123'
    })
});

// Đăng nhập
const login = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        username: 'user123',
        password: 'password123'
    })
});

const { token } = await login.json();
// Lưu token vào localStorage
localStorage.setItem('token', token);
```

### 2. Tạo API Key (24h auto-expire)

```javascript
const response = await fetch('http://localhost:3000/api/auth/generate-key', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${token}`
    }
});

const { apiKey, expiresAt } = await response.json();
// Lưu API key
localStorage.setItem('apiKey', apiKey);
```

### 3. Thêm Website/Tài Khoản Của Bạn

```javascript
// Thêm website
await fetch('http://localhost:3000/api/websites', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey
    },
    body: JSON.stringify({ domain: 'mysite.com' })
});

// Thêm tài khoản
await fetch('http://localhost:3000/api/accounts', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey
    },
    body: JSON.stringify({ account: 'customer123' })
});
```

### 4. Check Website/Tài Khoản

```javascript
// Check website
const checkWeb = await fetch('http://localhost:3000/api/check-website', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey
    },
    body: JSON.stringify({ url: 'mysite.com' })
});

const result = await checkWeb.json();
// { success: true, domain: 'mysite.com', isAllowed: true }
```

### 5. Xóa Mã Ẩn

```javascript
const clean = await fetch('http://localhost:3000/api/clean', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey
    },
    body: JSON.stringify({
        value: 'mysite.com',
        type: 'website'
    })
});

const result = await clean.json();
// { success: true, cleaned: true, winRate: 85, deposits: { min: 3, max: 6 } }
```

---

## 📋 API Endpoints

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | None | Đăng ký user mới |
| POST | `/api/auth/login` | None | Đăng nhập |
| POST | `/api/auth/generate-key` | JWT | Tạo API key (24h) |
| GET | `/api/auth/my-keys` | JWT | Xem API keys của mình |

### Website Management

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/websites` | API Key | Lấy danh sách websites |
| POST | `/api/websites` | API Key | Thêm website |
| DELETE | `/api/websites/:domain` | API Key | Xóa website |

### Account Management

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/accounts` | API Key | Lấy danh sách accounts |
| POST | `/api/accounts` | API Key | Thêm account |
| DELETE | `/api/accounts/:account` | API Key | Xóa account |

### Check & Clean

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/check-website` | API Key | Check website |
| POST | `/api/check-account` | API Key | Check account |
| POST | `/api/clean` | API Key | Xóa mã ẩn |

### Admin Only

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/admin/users` | JWT (Admin) | Xem tất cả users |
| DELETE | `/api/admin/users/:userId` | JWT (Admin) | Xóa user |

---

## 🎯 Use Cases

### Case 1: Người dùng cá nhân
1. Đăng ký tài khoản
2. Tạo API key
3. Thêm websites/accounts của mình
4. Sử dụng tool để check

### Case 2: Chia sẻ cho người khác
1. Người khác đăng ký tài khoản riêng
2. Họ tạo API key riêng
3. Họ thêm websites/accounts của họ
4. Mỗi người có danh sách riêng biệt

### Case 3: Admin quản lý
1. Login với admin account
2. Xem tất cả users
3. Xóa users nếu cần
4. Quản lý hệ thống

---

## ⚠️ Lưu Ý

- API Key tự động hết hạn sau 24h
- Mỗi user chỉ thấy websites/accounts của mình
- Admin mặc định: `username: admin`, `password: admin123`
- Đổi admin password trong file `.env`
- JWT token hết hạn sau 7 ngày

---

## 🚀 Quick Start

```bash
# 1. Install
npm install

# 2. Setup
cp .env.example .env
# Sửa JWT_SECRET và ADMIN_PASSWORD

# 3. Run
npm run dev

# 4. Test
# Login admin
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```
