# 🚀 QUICK START - Hậu Đài System

Hướng dẫn nhanh để bắt đầu sử dụng hệ thống hậu đài.

## 🎯 Mục Đích

Hệ thống hậu đài cho phép check tài khoản realtime từ hậu đài của bạn thay vì phải sync thủ công.

## 📋 Yêu Cầu

- ✅ EVIE đã deploy trên Vercel
- ✅ Database PostgreSQL (Neon) đã setup
- ✅ VPS để chạy shared bot service

## 🏃 Bước 1: Deploy Shared Bot (5 phút)

### Option A: Test Local (Nhanh)

```bash
# Clone repo
git clone https://github.com/jinwoo3999/evie-system.git
cd evie-system/shared-bot

# Install dependencies
pip install -r requirements.txt

# Run
python bot-service.py
```

Bot chạy tại: `http://localhost:5000`

### Option B: Deploy VPS (Production)

Follow guide: [DEPLOY_SHARED_BOT.md](DEPLOY_SHARED_BOT.md)

## 🔧 Bước 2: Cấu Hình EVIE

### Local Development

Tạo file `.env`:

```bash
DATABASE_URL=postgresql://neondb_owner:npg_XHSvkOG1suo0@ep-gentle-water-adtv0xqb-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
SHARED_BOT_URL=http://localhost:5000
JWT_SECRET=your-secret-key
ADMIN_PASSWORD=Admin@2026!
```

### Production (Vercel)

Vào Vercel Dashboard → Settings → Environment Variables

Thêm:
```
SHARED_BOT_URL=http://your-vps-ip:5000
```

Hoặc nếu có domain:
```
SHARED_BOT_URL=https://bot.yourdomain.com
```

## 🎮 Bước 3: Sử Dụng

### 3.1. Login

Truy cập: https://evie-system.vercel.app/login.html

Login với:
- Username: `admin`
- Password: `Admin@2026!`

### 3.2. Thêm Hậu Đài

1. Click "🏛️ Quản Lý Hậu Đài"
2. Click "➕ Thêm Hậu Đài Mới"
3. Nhập thông tin:
   - **Tên Hậu Đài:** Tên để phân biệt (VD: "Hậu Đài A")
   - **URL:** Link đăng nhập hậu đài (VD: "https://haudai.example.com")
   - **Username:** Tên đăng nhập hậu đài
   - **Password:** Mật khẩu hậu đài
4. Click "🧪 Test Kết Nối"
   - Nếu thành công → Click "💾 Lưu Hậu Đài"
   - Nếu thất bại → Check lại thông tin

### 3.3. Check Tài Khoản

**Cách 1: Từ Admin Panel**

1. Vào Admin Panel
2. Tab "Tài Khoản"
3. Nhập tên tài khoản
4. Hệ thống tự động check trong hậu đài

**Cách 2: Từ Trang Chính**

1. Vào trang chính: https://evie-system.vercel.app
2. Tab "TÀI KHOẢN"
3. Nhập tên tài khoản
4. Click "BẮT ĐẦU XỬ LÝ"

### 3.4. Quản Lý Hậu Đài

- **Tạm dừng:** Click "⏸️ Tạm Dừng" (hậu đài sẽ không được check)
- **Kích hoạt lại:** Click "▶️ Kích Hoạt"
- **Test:** Click "🧪 Test" để kiểm tra kết nối
- **Xóa:** Click "🗑️ Xóa" để xóa hậu đài

## 🔄 Workflow

```
1. User thêm hậu đài (1 lần)
   ↓
2. User check tài khoản
   ↓
3. EVIE gửi request đến Shared Bot
   ↓
4. Bot login vào hậu đài (hoặc reuse session)
   ↓
5. Bot check player trong hậu đài
   ↓
6. Trả kết quả về EVIE
   ↓
7. EVIE hiển thị cho user
```

## 💡 Tips

### Nhiều Hậu Đài

Bạn có thể thêm nhiều hậu đài:
- Hậu đài A: Khách VIP
- Hậu đài B: Khách thường
- Hậu đài C: Khách mới

Khi check, hệ thống sẽ check tất cả hậu đài cho đến khi tìm thấy.

### Session Reuse

- Lần check đầu: ~5-10s (phải login)
- Lần check sau: ~1-2s (reuse session)

Session được giữ trong 5 phút, sau đó refresh.

### Fallback

Nếu bot không hoạt động, hệ thống tự động fallback về database (danh sách đã sync thủ công).

## 🐛 Troubleshooting

### Bot không kết nối được

**Check 1:** Bot service có đang chạy không?

```bash
curl http://localhost:5000/
```

Phải thấy: `{"status": "OK"}`

**Check 2:** SHARED_BOT_URL có đúng không?

Xem trong Vercel environment variables.

**Check 3:** Firewall có block không?

```bash
sudo ufw status
```

### Test connection thất bại

**Nguyên nhân:**
1. Thông tin đăng nhập sai
2. URL hậu đài sai
3. Hậu đài có CAPTCHA
4. Selectors không đúng

**Giải pháp:**
1. Check lại username/password
2. Check URL (phải có https://)
3. Nếu có CAPTCHA → Cần customize bot
4. Customize selectors trong `bot-service.py`

### Check tài khoản lâu

**Nguyên nhân:**
- Lần đầu phải login (5-10s)
- Hậu đài load chậm
- Nhiều hậu đài phải check tuần tự

**Giải pháp:**
- Bình thường, lần sau sẽ nhanh hơn
- Disable hậu đài không cần thiết
- Chỉ enable hậu đài đang dùng

## 📊 Monitoring

### Check Bot Health

```bash
curl http://your-bot-url/
```

### Check Active Sessions

```bash
curl http://your-bot-url/sessions
```

### Check Logs (VPS)

```bash
sudo journalctl -u evie-bot -f
```

## 🎯 Next Steps

1. ✅ Thêm hậu đài
2. ✅ Test connection
3. ✅ Check tài khoản
4. ✅ Monitor logs
5. ⏳ Customize selectors (nếu cần)
6. ⏳ Deploy production

## 📚 More Info

- **Full Documentation:** [HAUDAI_SYSTEM_SUMMARY.md](HAUDAI_SYSTEM_SUMMARY.md)
- **Testing Guide:** [TEST_BOT_INTEGRATION.md](TEST_BOT_INTEGRATION.md)
- **Deployment Guide:** [DEPLOY_SHARED_BOT.md](DEPLOY_SHARED_BOT.md)
- **Bot README:** [shared-bot/README.md](shared-bot/README.md)

## ❓ FAQ

**Q: Có thể thêm bao nhiêu hậu đài?**  
A: Không giới hạn. Mỗi user có thể thêm nhiều hậu đài.

**Q: Hậu đài có CAPTCHA thì sao?**  
A: Hiện tại bot chưa support CAPTCHA. Cần customize thêm.

**Q: Mật khẩu có an toàn không?**  
A: Mật khẩu được lưu trong PostgreSQL. Nên encrypt thêm (TODO).

**Q: Bot có thể chạy trên Vercel không?**  
A: Không. Bot cần Selenium + Chrome, phải chạy trên VPS.

**Q: Nhiều user dùng chung bot có bị lộn không?**  
A: Không. Mỗi session hoàn toàn tách biệt.

**Q: Session có bị mất khi restart bot không?**  
A: Có. Session lưu trong memory. Restart sẽ phải login lại.

---

**Ready to start!** 🚀

Nếu gặp vấn đề, check troubleshooting section hoặc xem logs.
