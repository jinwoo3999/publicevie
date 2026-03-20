# 🐘 SETUP NEON DATABASE (PostgreSQL)

## Bước 1: Tạo Neon Database

1. Vào: https://neon.tech
2. Click "Sign Up" (có thể dùng GitHub)
3. Click "Create a project"
4. Đặt tên: `evie-db`
5. Chọn region: **Singapore** (gần nhất)
6. Click "Create Project"

## Bước 2: Lấy Connection String

1. Sau khi tạo xong, bạn sẽ thấy **Connection String**
2. Copy chuỗi dạng:
   ```
   postgresql://username:password@ep-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
   ```

## Bước 3: Thêm vào Vercel

1. Vào: https://vercel.com/dashboard
2. Chọn project: **evie-system**
3. Vào tab **Settings**
4. Chọn **Environment Variables**
5. Click **Add New**
6. Key: `DATABASE_URL`
7. Value: Paste connection string từ Neon
8. Environment: Chọn **Production**, **Preview**, **Development**
9. Click **Save**

## Bước 4: Redeploy

1. Vào tab **Deployments**
2. Click vào deployment mới nhất
3. Click nút **...** (3 chấm)
4. Chọn **Redeploy**
5. Đợi 2-3 phút

## Bước 5: Test

1. Mở: https://evie-system.vercel.app/test-user.html
2. Làm theo từng bước 1 → 2 → 3 → 4
3. Nếu bước 4 thành công → Database hoạt động!

---

## Ưu điểm Neon DB

✅ **Persistent**: Dữ liệu không bao giờ mất
✅ **Free tier**: 0.5GB storage, 10GB transfer/month
✅ **Auto-scaling**: Tự động scale theo nhu cầu
✅ **Serverless**: Tự động sleep khi không dùng
✅ **Fast**: Kết nối nhanh từ Vercel

---

## Troubleshooting

### Lỗi: "Connection refused"
- Kiểm tra connection string có đúng không
- Đảm bảo có `?sslmode=require` ở cuối

### Lỗi: "Password authentication failed"
- Copy lại connection string từ Neon
- Đảm bảo không có khoảng trắng thừa

### Lỗi: "Database does not exist"
- Sử dụng database name mặc định: `neondb`
- Hoặc tạo database mới trong Neon dashboard

---

## Local Development

Để test local với Neon DB:

1. Tạo file `.env` trong thư mục root:
   ```
   DATABASE_URL=postgresql://username:password@ep-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
   JWT_SECRET=your-secret-key
   ADMIN_PASSWORD=Admin@2026!
   ```

2. Chạy:
   ```bash
   npm install
   npm run dev
   ```

3. Test: http://localhost:3000/test-user.html

---

**Sau khi setup xong, user sẽ được lưu VĨNH VIỄN trong PostgreSQL!**
