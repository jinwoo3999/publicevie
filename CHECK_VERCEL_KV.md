# 🔍 KIỂM TRA VERCEL KV

## Vấn đề: Đăng nhập bị đứng im

Nguyên nhân có thể là Vercel KV chưa được kết nối đúng cách.

---

## BƯỚC 1: Kiểm tra Vercel Dashboard

1. Vào: https://vercel.com/dashboard
2. Chọn project: **evie-system**
3. Vào tab **Storage**
4. Kiểm tra xem có database **evie-db** không?

### Nếu CHƯA CÓ evie-db:
1. Click **Create Database**
2. Chọn **KV (Redis)**
3. Đặt tên: `evie-db`
4. Click **Create**
5. Sau khi tạo xong, click **Connect to Project**
6. Chọn project **evie-system**
7. Click **Connect**

### Nếu ĐÃ CÓ evie-db:
1. Click vào **evie-db**
2. Kiểm tra tab **Connected Projects**
3. Đảm bảo **evie-system** có trong danh sách
4. Nếu chưa có, click **Connect Project** và chọn **evie-system**

---

## BƯỚC 2: Kiểm tra Environment Variables

1. Vẫn trong project **evie-system**
2. Vào tab **Settings**
3. Chọn **Environment Variables**
4. Kiểm tra có các biến sau không:

### Biến bắt buộc từ KV (tự động thêm khi connect):
```
KV_REST_API_URL
KV_REST_API_TOKEN
KV_REST_API_READ_ONLY_TOKEN
KV_URL
```

### Biến cần thêm thủ công:
```
JWT_SECRET = your-super-secret-jwt-key-change-this-in-production
ADMIN_PASSWORD = Admin@2026!
```

**Cách thêm:**
1. Click **Add New**
2. Key: `JWT_SECRET`
3. Value: `your-super-secret-jwt-key-change-this-in-production`
4. Environment: Chọn **Production**, **Preview**, **Development**
5. Click **Save**
6. Lặp lại cho `ADMIN_PASSWORD`

---

## BƯỚC 3: Redeploy

Sau khi kết nối KV và thêm env vars:

1. Vào tab **Deployments**
2. Click vào deployment mới nhất
3. Click nút **...** (3 chấm)
4. Chọn **Redeploy**
5. Đợi 2-3 phút

---

## BƯỚC 4: Test lại

1. Mở: https://evie-system.vercel.app/login.html
2. Mở Console (F12)
3. Thử đăng nhập với: `admin` / `Admin@2026!`
4. Xem Console có lỗi gì không

---

## GIẢI PHÁP TẠM THỜI: Chạy local

Nếu Vercel vẫn chưa hoạt động, có thể test local:

```bash
npm install
npm run dev
```

Sau đó truy cập: http://localhost:3000/login.html

**Lưu ý**: Local sẽ KHÔNG dùng Vercel KV, mà dùng in-memory storage (dữ liệu sẽ mất khi restart)

---

## DEBUG: Xem logs trong Vercel

1. Vào project **evie-system**
2. Tab **Deployments**
3. Click vào deployment mới nhất
4. Xem **Function Logs** để tìm lỗi

Tìm các lỗi như:
- `KV_REST_API_URL is not defined`
- `Cannot connect to KV`
- `@vercel/kv error`

---

## NẾU VẪN KHÔNG ĐƯỢC

Có thể tạm thời quay về file-based storage (không khuyến khích):

Tôi sẽ tạo một phiên bản fallback nếu cần.
