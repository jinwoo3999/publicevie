# 📖 HƯỚNG DẪN CÀI ĐẶT VÀ SỬ DỤNG HỆ THỐNG EVIE

## 📋 MỤC LỤC

1. [Giới Thiệu](#giới-thiệu)
2. [Yêu Cầu Hệ Thống](#yêu-cầu-hệ-thống)
3. [Cài Đặt](#cài-đặt)
4. [Sử Dụng](#sử-dụng)
5. [Quản Lý Hậu Đài](#quản-lý-hậu-đài)
6. [Xử Lý Sự Cố](#xử-lý-sự-cố)

---

## 🎯 GIỚI THIỆU

EVIE là hệ thống kiểm tra và xóa mã ẩn cho tài khoản và website. Hệ thống bao gồm:

- ✅ **Website chính**: Kiểm tra tài khoản và website
- ✅ **Admin Panel**: Quản lý danh sách tài khoản và website
- ✅ **Hệ thống Hậu Đài**: Kiểm tra realtime từ hậu đài
- ✅ **SuperAdmin**: Quản lý users

### Tính Năng Chính

- 🔍 Kiểm tra tài khoản có dính mã ẩn không
- 🌐 Kiểm tra website có trong danh sách cho phép không
- 🏛️ Kết nối với hậu đài để check realtime
- 👥 Quản lý nhiều users, mỗi user có danh sách riêng
- 🤖 Bot tự động check từ hậu đài

---

## 💻 YÊU CẦU HỆ THỐNG

### Cho Website (EVIE)

- ✅ Đã deploy trên Vercel: https://evie-system.vercel.app
- ✅ Database PostgreSQL (Neon) đã setup
- ✅ Không cần cài đặt gì thêm

### Cho Bot Service (Nếu dùng hậu đài)

- 🖥️ VPS với Ubuntu 20.04+
- 💾 RAM: Tối thiểu 2GB
- 🔧 Python 3.8+
- 🌐 Chrome/Chromium browser

---

## 🚀 CÀI ĐẶT

### PHẦN 1: Sử Dụng Website (Không cần cài đặt)

Website đã sẵn sàng tại: **https://evie-system.vercel.app**

Bạn chỉ cần:
1. Mở trình duyệt
2. Truy cập link trên
3. Đăng nhập và sử dụng

**Bỏ qua phần 2 nếu bạn chỉ muốn sử dụng website.**

---

### PHẦN 2: Cài Đặt Bot Service (Cho tính năng Hậu Đài)

#### Bước 1: Chuẩn Bị VPS

```bash
# Kết nối SSH vào VPS
ssh root@dia-chi-ip-vps

# Cập nhật hệ thống
apt-get update
apt-get upgrade -y

# Tạo user mới (khuyến nghị)
adduser evie
usermod -aG sudo evie
su - evie
```

#### Bước 2: Cài Đặt Python và Dependencies

```bash
# Cài Python
sudo apt-get install -y python3 python3-pip python3-venv

# Cài Chrome và ChromeDriver
sudo apt-get install -y chromium-browser chromium-chromedriver

# Cài Git
sudo apt-get install -y git
```

#### Bước 3: Tải Code và Cài Đặt

```bash
# Clone repository
cd ~
git clone https://github.com/jinwoo3999/evie-system.git
cd evie-system/shared-bot

# Tạo môi trường ảo Python
python3 -m venv venv
source venv/bin/activate

# Cài đặt thư viện Python
pip install -r requirements.txt
```

#### Bước 4: Test Chạy

```bash
# Chạy thử
python bot-service.py
```

Nếu thấy:
```
🤖 EVIE Shared Bot Service Starting...
📝 Port: 5000
🔗 Health: http://localhost:5000/
```

→ **Thành công!** Nhấn Ctrl+C để dừng.

#### Bước 5: Chạy Tự Động (Systemd)

```bash
# Tạo file service
sudo nano /etc/systemd/system/evie-bot.service
```

Dán nội dung sau (thay `evie` bằng username của bạn):

```ini
[Unit]
Description=EVIE Shared Bot Service
After=network.target

[Service]
Type=simple
User=evie
WorkingDirectory=/home/evie/evie-system/shared-bot
Environment="PATH=/home/evie/evie-system/shared-bot/venv/bin"
ExecStart=/home/evie/evie-system/shared-bot/venv/bin/python bot-service.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Lưu file (Ctrl+X, Y, Enter)

```bash
# Kích hoạt service
sudo systemctl daemon-reload
sudo systemctl enable evie-bot
sudo systemctl start evie-bot

# Kiểm tra trạng thái
sudo systemctl status evie-bot
```

Phải thấy: `Active: active (running)` ✅

#### Bước 6: Cấu Hình EVIE

Vào Vercel Dashboard → Project Settings → Environment Variables

Thêm biến:
```
SHARED_BOT_URL=http://dia-chi-ip-vps:5000
```

Ví dụ:
```
SHARED_BOT_URL=http://123.45.67.89:5000
```

Sau đó redeploy project.

---

## 📱 SỬ DỤNG

### 1. ĐĂNG NHẬP

#### Tài Khoản Mặc Định

**SuperAdmin:**
- URL: https://evie-system.vercel.app/login.html
- Username: `admin`
- Password: `Admin@2026!`

**User thường:**
- Được tạo bởi SuperAdmin
- Username và password do SuperAdmin cấp

#### Các Loại Tài Khoản

1. **SuperAdmin**: 
   - Tạo/xóa users
   - Reset mật khẩu
   - Xem tất cả users

2. **User**: 
   - Quản lý danh sách website và tài khoản của mình
   - Thêm hậu đài
   - Check tài khoản

3. **Public**: 
   - Chỉ check tài khoản/website
   - Không cần đăng nhập

---

### 2. QUẢN LÝ DANH SÁCH (User)

#### A. Quản Lý Website

1. Đăng nhập → Vào Admin Panel
2. Tab "Website"
3. Nhập domain website (VD: `ok168.com`)
4. Click "Thêm"

**Lưu ý:**
- Chỉ nhập domain, không cần http:// hoặc www
- Ví dụ đúng: `ok168.com`, `game123.net`
- Ví dụ sai: `https://ok168.com`, `www.ok168.com`

#### B. Quản Lý Tài Khoản

1. Đăng nhập → Vào Admin Panel
2. Tab "Tài Khoản"
3. Nhập tên tài khoản (VD: `player123`)
4. Click "Thêm"

**Lưu ý:**
- Tài khoản được lưu chữ thường
- `Player123` và `player123` là giống nhau

#### C. Xóa Khỏi Danh Sách

- Click nút "Xóa" bên cạnh item muốn xóa
- Xác nhận xóa

---

### 3. QUẢN LÝ HẬU ĐÀI

#### A. Hậu Đài Là Gì?

Hậu đài là tài khoản agent chứa danh sách khách hàng (cấp dưới). Thay vì phải thêm tài khoản thủ công, hệ thống sẽ tự động check trong hậu đài.

#### B. Thêm Hậu Đài

1. Đăng nhập → Click "🏛️ Quản Lý Hậu Đài"
2. Click "➕ Thêm Hậu Đài Mới"
3. Điền thông tin:

   **Tên Hậu Đài:**
   - Tên để phân biệt (VD: "Hậu Đài VIP", "Hậu Đài Thường")
   
   **URL Hậu Đài:**
   - Link đăng nhập hậu đài
   - VD: `https://haudai.example.com`
   
   **Tên Đăng Nhập:**
   - Username để login vào hậu đài
   
   **Mật Khẩu:**
   - Password để login vào hậu đài

4. Click "🧪 Test Kết Nối"
   - Nếu thành công → Click "💾 Lưu Hậu Đài"
   - Nếu thất bại → Kiểm tra lại thông tin

#### C. Quản Lý Hậu Đài

**Test Kết Nối:**
- Click "🧪 Test" để kiểm tra hậu đài còn hoạt động không

**Tạm Dừng:**
- Click "⏸️ Tạm Dừng" để tạm thời không check hậu đài này
- Hữu ích khi hậu đài đang bảo trì

**Kích Hoạt Lại:**
- Click "▶️ Kích Hoạt" để bật lại hậu đài

**Xóa:**
- Click "🗑️ Xóa" để xóa hậu đài vĩnh viễn

#### D. Nhiều Hậu Đài

Bạn có thể thêm nhiều hậu đài:
- Hậu Đài A: Khách VIP
- Hậu Đài B: Khách thường  
- Hậu Đài C: Khách mới

Khi check tài khoản, hệ thống sẽ:
1. Check Hậu Đài A
2. Nếu không có → Check Hậu Đài B
3. Nếu không có → Check Hậu Đài C
4. Nếu không có → Check database (danh sách thủ công)

---

### 4. KIỂM TRA TÀI KHOẢN

#### Cách 1: Từ Trang Chính (Public)

1. Truy cập: https://evie-system.vercel.app
2. Chọn tab "TÀI KHOẢN"
3. Nhập tên tài khoản
4. Click "BẮT ĐẦU XỬ LÝ"

**Kết quả:**
- ✅ **ROOT ACCESS: GRANTED** → Tài khoản sạch (có trong danh sách)
- ❌ **ACCESS DENIED** → Tài khoản dính mã ẩn (không có trong danh sách)

#### Cách 2: Từ Admin Panel (User)

1. Đăng nhập → Admin Panel
2. Tab "Tài Khoản"
3. Nhập tên tài khoản ở ô tìm kiếm
4. Xem kết quả

**Ưu điểm:**
- Thấy được source (bot hay database)
- Có thể thêm vào danh sách ngay

#### Cách 3: Kiểm Tra Website

1. Truy cập trang chính
2. Chọn tab "WEBSITE"
3. Nhập URL website
4. Click "BẮT ĐẦU XỬ LÝ"

**Kết quả:**
- ✅ **SYSTEM VERIFIED** → Website an toàn
- ❌ **THREAT DETECTED** → Website không an toàn

---

### 5. QUẢN LÝ USERS (SuperAdmin)

#### A. Tạo User Mới

1. Đăng nhập với tài khoản admin
2. Vào SuperAdmin Panel
3. Nhập username và password
4. Click "Tạo User"

**Lưu ý:**
- Username phải unique (không trùng)
- Password nên mạnh (ít nhất 6 ký tự)
- Ghi nhớ thông tin để cấp cho user

#### B. Reset Mật Khẩu

1. Vào SuperAdmin Panel
2. Tìm user cần reset
3. Click "Reset Password"
4. Nhập mật khẩu mới
5. Xác nhận

#### C. Xóa User

1. Vào SuperAdmin Panel
2. Tìm user cần xóa
3. Click "Xóa"
4. Xác nhận

**Cảnh báo:** 
- Xóa user sẽ xóa tất cả dữ liệu của user đó
- Không thể khôi phục

---

### 6. CÀI ĐẶT THƯƠNG HIỆU

Bạn có thể tùy chỉnh tên thương hiệu:

1. Click "⚙️ Cài Đặt"
2. Thay đổi:
   - Tên thương hiệu (mặc định: EVIE)
   - Slogan
   - Logo (emoji)
   - Màu sắc
3. Click "Lưu Cài Đặt"

Thay đổi sẽ áp dụng cho tất cả trang.

---

## 🔄 QUY TRÌNH HOẠT ĐỘNG

### Khi Check Tài Khoản (Có Hậu Đài)

```
User nhập tài khoản
    ↓
Hệ thống check có hậu đài không?
    ↓
CÓ → Gửi request đến Bot Service
    ↓
Bot login vào Hậu Đài 1
    ↓
Tìm thấy? → YES → Trả kết quả ✅
    ↓
   NO → Check Hậu Đài 2
    ↓
Tìm thấy? → YES → Trả kết quả ✅
    ↓
   NO → Check database
    ↓
Trả kết quả cuối cùng
```

### Khi Check Tài Khoản (Không Có Hậu Đài)

```
User nhập tài khoản
    ↓
Hệ thống check trong database
    ↓
Có trong danh sách? → YES → ✅ Sạch
    ↓
   NO → ❌ Dính mã ẩn
```

---

## ⚡ TIPS & TRICKS

### 1. Tăng Tốc Độ Check

- **Lần đầu:** 5-10 giây (phải login hậu đài)
- **Lần sau:** 1-2 giây (reuse session)

Session được giữ trong 5 phút, sau đó tự động refresh.

### 2. Quản Lý Nhiều Hậu Đài

**Tốt nhất:**
- Hậu Đài VIP: Khách VIP (enable)
- Hậu Đài Thường: Khách thường (enable)
- Hậu Đài Cũ: Không dùng nữa (disable)

**Lợi ích:**
- Check nhanh hơn (chỉ check hậu đài enable)
- Dễ quản lý
- Tiết kiệm tài nguyên

### 3. Sync Thủ Công

Nếu bot không hoạt động, bạn vẫn có thể:
1. Vào hậu đài
2. Copy danh sách tài khoản
3. Thêm thủ công vào Admin Panel

Hệ thống sẽ tự động fallback về danh sách này.

### 4. Backup Danh Sách

Định kỳ export danh sách:
1. Vào Admin Panel
2. Copy tất cả tài khoản
3. Lưu vào file text

Phòng trường hợp mất dữ liệu.

---

## 🐛 XỬ LÝ SỰ CỐ

### Vấn Đề 1: Không Đăng Nhập Được

**Triệu chứng:** Nhập username/password nhưng không vào được

**Nguyên nhân:**
- Sai username hoặc password
- API key hết hạn
- Database lỗi

**Giải pháp:**
1. Kiểm tra lại username/password
2. Xóa cache trình duyệt (Ctrl+Shift+Delete)
3. Thử trình duyệt khác
4. Liên hệ admin để reset password

### Vấn Đề 2: Bot Không Kết Nối

**Triệu chứng:** Test connection thất bại

**Nguyên nhân:**
- Bot service không chạy
- Thông tin đăng nhập sai
- Hậu đài có CAPTCHA
- Firewall block

**Giải pháp:**

**Bước 1:** Kiểm tra bot service
```bash
sudo systemctl status evie-bot
```

Nếu không chạy:
```bash
sudo systemctl start evie-bot
```

**Bước 2:** Kiểm tra logs
```bash
sudo journalctl -u evie-bot -n 50
```

**Bước 3:** Test thủ công
```bash
curl http://localhost:5000/
```

Phải thấy: `{"status": "OK"}`

**Bước 4:** Kiểm tra thông tin đăng nhập
- Thử login thủ công vào hậu đài
- Đảm bảo username/password đúng

### Vấn Đề 3: Check Tài Khoản Lâu

**Triệu chứng:** Mất 10-20 giây mới có kết quả

**Nguyên nhân:**
- Lần đầu phải login (bình thường)
- Hậu đài load chậm
- Nhiều hậu đài phải check tuần tự

**Giải pháp:**
1. Lần sau sẽ nhanh hơn (reuse session)
2. Disable hậu đài không cần thiết
3. Chỉ enable hậu đài đang dùng

### Vấn Đề 4: Kết Quả Sai

**Triệu chứng:** Tài khoản có trong hậu đài nhưng báo không có

**Nguyên nhân:**
- Selectors không đúng
- Hậu đài thay đổi giao diện
- Session expired

**Giải pháp:**
1. Test connection lại
2. Check logs bot service
3. Có thể cần customize selectors trong `bot-service.py`

### Vấn Đề 5: Hậu Đài Có CAPTCHA

**Triệu chứng:** Bot không login được vì có CAPTCHA

**Nguyên nhân:**
- Hậu đài bật CAPTCHA

**Giải pháp:**
- Hiện tại bot chưa support CAPTCHA
- Cần customize thêm CAPTCHA solver
- Hoặc sync thủ công vào database

---

## 📊 MONITORING

### Kiểm Tra Bot Service

```bash
# Trạng thái
sudo systemctl status evie-bot

# Logs realtime
sudo journalctl -u evie-bot -f

# Logs 100 dòng cuối
sudo journalctl -u evie-bot -n 100
```

### Kiểm Tra Health

```bash
# Local
curl http://localhost:5000/

# Remote
curl http://dia-chi-ip-vps:5000/
```

### Kiểm Tra Sessions

```bash
curl http://localhost:5000/sessions
```

### Restart Service

```bash
sudo systemctl restart evie-bot
```

---

## 📞 HỖ TRỢ

### Tài Liệu Khác

- **Quick Start:** `QUICK_START_HAUDAI.md`
- **Deployment:** `DEPLOY_SHARED_BOT.md`
- **Testing:** `TEST_BOT_INTEGRATION.md`
- **System Summary:** `HAUDAI_SYSTEM_SUMMARY.md`

### Logs Quan Trọng

**Bot Service:**
```bash
sudo journalctl -u evie-bot -f
```

**System:**
```bash
# CPU & Memory
htop

# Disk
df -h

# Network
netstat -tulpn | grep 5000
```

---

## ✅ CHECKLIST

### Cài Đặt Lần Đầu

- [ ] VPS đã chuẩn bị
- [ ] Python và Chrome đã cài
- [ ] Code đã clone
- [ ] Dependencies đã cài
- [ ] Bot service chạy được
- [ ] Systemd service đã setup
- [ ] SHARED_BOT_URL đã cấu hình
- [ ] Test connection thành công

### Sử Dụng Hàng Ngày

- [ ] Đăng nhập thành công
- [ ] Thêm hậu đài (nếu cần)
- [ ] Test connection hậu đài
- [ ] Check tài khoản hoạt động
- [ ] Kết quả chính xác

### Bảo Trì

- [ ] Check logs định kỳ
- [ ] Monitor resource usage
- [ ] Backup danh sách
- [ ] Update code khi có bản mới

---

## 🎉 KẾT LUẬN

Bạn đã hoàn thành cài đặt và biết cách sử dụng hệ thống EVIE!

**Tóm tắt:**
- ✅ Website: https://evie-system.vercel.app
- ✅ Login: admin / Admin@2026!
- ✅ Quản lý hậu đài: Dễ dàng với UI
- ✅ Check tài khoản: Realtime từ hậu đài
- ✅ Fallback: Tự động về database

**Bắt đầu ngay:**
1. Truy cập website
2. Đăng nhập
3. Thêm hậu đài (nếu có)
4. Check tài khoản

Chúc bạn sử dụng hiệu quả! 🚀
