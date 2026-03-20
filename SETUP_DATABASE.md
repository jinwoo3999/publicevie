# 🗄️ SETUP DATABASE ĐỂ LƯU USER VĨNH VIỄN

## Vấn đề hiện tại
- ❌ Dùng in-memory storage → User mất khi server restart
- ❌ Vercel serverless restart mỗi ~15 phút không có traffic
- ❌ Mỗi lần restart phải tạo lại user

## Giải pháp: Vercel Postgres

### Bước 1: Tạo Postgres Database trong Vercel

1. Vào: https://vercel.com/dashboard
2. Chọn project: **evie-system**
3. Vào tab **Storage**
4. Click **Create Database**
5. Chọn **Postgres**
6. Đặt tên: `evie-db`
7. Chọn region gần nhất (Singapore hoặc Tokyo)
8. Click **Create**
9. Sau khi tạo xong, click **Connect to Project**
10. Chọn project **evie-system**
11. Click **Connect**

### Bước 2: Vercel sẽ tự động thêm Environment Variables

Sau khi connect, các biến sau sẽ được thêm tự động:
```
POSTGRES_URL
POSTGRES_PRISMA_URL
POSTGRES_URL_NON_POOLING
POSTGRES_USER
POSTGRES_HOST
POSTGRES_PASSWORD
POSTGRES_DATABASE
```

### Bước 3: Tôi sẽ update code để dùng Postgres

Sau khi bạn tạo xong database, cho tôi biết để tôi update code!

---

## Hoặc: Giải pháp đơn giản hơn - Vercel KV (Redis)

Nếu không muốn setup Postgres, có thể dùng lại Vercel KV:

1. Vào: https://vercel.com/dashboard
2. Chọn project: **evie-system**
3. Vào tab **Storage**
4. Nếu đã có **evie-db** (KV), click vào
5. Vào tab **Connected Projects**
6. Đảm bảo **evie-system** đã được connect
7. Cho tôi biết để tôi enable lại KV code

---

## Lựa chọn nào?

**Postgres**: Tốt hơn cho production, có SQL queries, relationships
**KV (Redis)**: Đơn giản hơn, nhanh hơn, nhưng ít tính năng hơn

Bạn muốn dùng cái nào?
