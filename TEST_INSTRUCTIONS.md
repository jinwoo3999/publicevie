# 🧪 Hướng Dẫn Test EVIE

## ✅ Server Đang Chạy

Server đã khởi động thành công trên: http://localhost:3000

## 📝 Test Các Tính Năng

### 1. Test Trang Chính (Public Check)

**Mở:** http://localhost:3000/index.html

**Test Website:**
- Nhập: `ok168.pro` → Quét → Kết quả: ✓ AN TOÀN → Xóa Mã Ẩn → Hiển thị tỉ lệ nổ 75-95%
- Nhập: `google.com` → Quét → Kết quả: ✗ NGUY HIỂM (không trong danh sách)

**Test Tài Khoản:**
- Chuyển tab sang "Tài Khoản"
- Nhập: `admin123` → Quét → Kết quả: ✓ AN TOÀN → Xóa Mã Ẩn → Hiển thị tỉ lệ nổ
- Nhập: `random123` → Quét → Kết quả: ✗ NGUY HIỂM

**Lưu ý:** 
- Trang public sẽ dùng danh sách mặc định từ admin
- Nếu chưa đăng nhập, sẽ dùng fallback từ config.js

### 2. Test Đăng Nhập

**Mở:** http://localhost:3000/login.html

**Thông tin đăng nhập:**
- Username: `admin`
- Password: `admin123`

**Kết quả:** Sẽ redirect đến SuperAdmin panel

### 3. Test SuperAdmin Panel

**Sau khi đăng nhập admin:**

**Tạo User Mới:**
1. Nhập username: `user1`
2. Nhập password: `123456`
3. Nhập tên hiển thị: `User Test 1`
4. Click "Tạo User"
5. Sẽ hiển thị thông báo thành công

**Reset Password:**
1. Click nút "🔑 Reset MK" trên user card
2. Nhập password mới
3. Gửi thông tin cho user

**Xóa User:**
1. Click nút "🗑️ Xóa" trên user card
2. Confirm xóa

### 4. Test User Panel

**Đăng xuất và đăng nhập lại với user1:**
- Username: `user1`
- Password: `123456`

**Thêm Website:**
1. Nhập domain: `test.com`
2. Click "Thêm Website"
3. Website xuất hiện trong danh sách

**Thêm Tài Khoản:**
1. Nhập tài khoản: `testuser`
2. Click "Thêm Tài Khoản"
3. Tài khoản xuất hiện trong danh sách

**Xóa:**
- Click nút "Xóa" bên cạnh item

### 5. Test Phân Quyền

**Với user1 đã thêm `test.com`:**
1. Mở trang chính (có thể dùng incognito)
2. Nhập: `test.com` → Quét
3. Kết quả: ✗ NGUY HIỂM (vì public không có API key)

**Để test đúng với user:**
1. Đăng nhập user1
2. Mở console (F12)
3. Chạy: `localStorage.getItem('adminApiKey')`
4. Copy API key
5. Mở index.html
6. Trong console, set: `localStorage.setItem('adminApiKey', 'YOUR_API_KEY')`
7. Reload page
8. Test lại `test.com` → Sẽ thành công

## 🔧 Troubleshooting

### Tính năng quét không chạy

**Kiểm tra:**
1. Mở F12 → Console
2. Xem có lỗi không
3. Check Network tab khi click "Quét"

**Nếu lỗi CORS:**
- Server đã config CORS cho tất cả origins
- Reload lại page

**Nếu lỗi API:**
- Check server đang chạy: http://localhost:3000/api/health
- Nếu không chạy: `npm run dev`

### Lỗi "Unauthorized"

**Nguyên nhân:** API key hết hạn hoặc không hợp lệ

**Giải pháp:**
1. Đăng xuất
2. F12 → Application → Clear Storage
3. Đăng nhập lại

### Port 3000 đang được dùng

```bash
# Check process
netstat -ano | Select-String ":3000"

# Kill process
taskkill /PID [PID] /F

# Start lại
npm run dev
```

## 📊 Kết Quả Mong Đợi

### Trang Public (index.html)
- ✅ Quét được website/account
- ✅ Hiển thị kết quả với animation
- ✅ Chỉ cho phép xóa mã ẩn nếu trong danh sách
- ✅ Hiển thị tỉ lệ nổ 75-95% sau khi xóa
- ✅ Dự đoán 3-5 lần nạp (hoặc cao hơn)

### Login
- ✅ Đăng nhập thành công với admin/admin123
- ✅ Redirect đúng theo role (admin → superadmin.html, user → admin.html)
- ✅ Lưu token và API key vào localStorage

### SuperAdmin Panel
- ✅ Hiển thị danh sách users
- ✅ Tạo user mới thành công
- ✅ Reset password thành công
- ✅ Xóa user thành công
- ✅ Hiển thị thống kê (tổng users, websites, accounts)

### User Panel
- ✅ Hiển thị username
- ✅ Thêm/xóa website thành công
- ✅ Thêm/xóa account thành công
- ✅ Mỗi user có danh sách riêng biệt

## 🎯 Test Flow Hoàn Chỉnh

1. **Admin** đăng nhập → Tạo user1, user2
2. **User1** đăng nhập → Thêm website: `site1.com`, account: `acc1`
3. **User2** đăng nhập → Thêm website: `site2.com`, account: `acc2`
4. **Public** check `site1.com` → Không thành công (cần API key)
5. **User1** (với API key) check `site1.com` → Thành công
6. **User1** check `site2.com` → Thất bại (không trong danh sách của user1)
7. **User2** (với API key) check `site2.com` → Thành công

## ✅ Checklist

- [ ] Server chạy thành công
- [ ] Trang index.html load được
- [ ] Quét website thành công
- [ ] Quét account thành công
- [ ] Xóa mã ẩn hiển thị tỉ lệ nổ
- [ ] Đăng nhập admin thành công
- [ ] Tạo user mới thành công
- [ ] Đăng nhập user thành công
- [ ] Thêm website vào danh sách user
- [ ] Thêm account vào danh sách user
- [ ] Mỗi user có danh sách riêng

## 🚀 Sẵn Sàng Deploy

Nếu tất cả test pass, hệ thống sẵn sàng deploy!

Xem: `DEPLOYMENT_CHECKLIST.md` để deploy lên production.
