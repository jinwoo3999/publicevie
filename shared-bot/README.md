# 🤖 EVIE Shared Bot Service

Shared bot service cho phép nhiều users sử dụng 1 bot để check tài khoản từ hậu đài.

## ✨ Tính Năng

- ✅ 1 bot phục vụ nhiều users
- ✅ Mỗi user có thể có nhiều hậu đài
- ✅ Session management - giữ trạng thái login
- ✅ Auto-reuse session nếu còn valid
- ✅ Cache danh sách player (refresh mỗi 5 phút)
- ✅ Tách biệt hoàn toàn giữa các user

## 📋 Yêu Cầu

- Python 3.8+
- Chrome/Chromium browser
- ChromeDriver

## 🚀 Cài Đặt

### 1. Cài đặt Python dependencies

```bash
cd shared-bot
pip install -r requirements.txt
```

### 2. Cài đặt ChromeDriver

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install -y chromium-browser chromium-chromedriver
```

**macOS:**
```bash
brew install chromedriver
```

**Windows:**
- Download ChromeDriver từ: https://chromedriver.chromium.org/
- Thêm vào PATH

### 3. Chạy Bot Service

```bash
python bot-service.py
```

Bot sẽ chạy trên: `http://localhost:5000`

## 🔧 Cấu Hình

### Environment Variables

```bash
# Port (default: 5000)
export PORT=5000

# Chrome options
export CHROME_HEADLESS=true
```

### Customize Selectors

Mở `bot-service.py` và chỉnh các selector trong:

1. `_login()` - Selectors cho form đăng nhập
2. `_refresh_players()` - Selectors cho danh sách player

Bot đã có multiple strategies để tự động tìm elements, nhưng bạn có thể customize thêm.

## 📡 API Endpoints

### Health Check

```bash
GET /
```

Response:
```json
{
  "status": "OK",
  "service": "EVIE Shared Bot Service",
  "version": "1.0.0",
  "stats": {
    "total_sessions": 2,
    "sessions": [...]
  }
}
```

### Check Player

```bash
POST /check
Content-Type: application/json

{
  "user_id": "user_123",
  "haudai_url": "https://haudai.com",
  "haudai_username": "agent1",
  "haudai_password": "pass123",
  "player": "player123"
}
```

Response:
```json
{
  "exists": true,
  "player": "player123",
  "total_players": 150
}
```

### List Sessions

```bash
GET /sessions
```

### Close Session

```bash
DELETE /sessions/<session_id>
```

## 🏗️ Kiến Trúc

```
User 1 (Hậu Đài A) ──┐
User 1 (Hậu Đài B) ──┤
User 2 (Hậu Đài C) ──┼──> Shared Bot Service ──> Selenium Sessions
User 3 (Hậu Đài D) ──┤
User 3 (Hậu Đài E) ──┘
```

Mỗi combination (user_id + haudai_url + username) tạo 1 session riêng.

## 🔒 Bảo Mật

- Mỗi session hoàn toàn tách biệt
- Session ID được hash từ (user_id + haudai_url + username)
- Không có cross-contamination giữa các user
- Password không được log

## 🐛 Troubleshooting

### Lỗi: ChromeDriver not found

```bash
# Ubuntu
sudo apt-get install chromium-chromedriver

# macOS
brew install chromedriver
```

### Lỗi: Session expired

Bot sẽ tự động re-login. Nếu vẫn lỗi, check:
- Thông tin đăng nhập có đúng không
- Hậu đài có thay đổi giao diện không
- Có CAPTCHA không (cần customize)

### Lỗi: Cannot find player list

Customize selectors trong `_refresh_players()`:
- Check HTML structure của hậu đài
- Thêm selector phù hợp

## 📊 Monitoring

Check health và stats:

```bash
curl http://localhost:5000/
```

Xem sessions đang active:

```bash
curl http://localhost:5000/sessions
```

## 🚀 Deploy Production

### Deploy lên VPS

1. **Setup VPS:**

```bash
# Update system
sudo apt-get update
sudo apt-get upgrade -y

# Install Python
sudo apt-get install -y python3 python3-pip

# Install Chrome
sudo apt-get install -y chromium-browser chromium-chromedriver

# Install dependencies
cd shared-bot
pip3 install -r requirements.txt
```

2. **Run with systemd:**

Create `/etc/systemd/system/evie-bot.service`:

```ini
[Unit]
Description=EVIE Shared Bot Service
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/evie-system/shared-bot
ExecStart=/usr/bin/python3 bot-service.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable và start:

```bash
sudo systemctl enable evie-bot
sudo systemctl start evie-bot
sudo systemctl status evie-bot
```

3. **Setup Nginx reverse proxy:**

```nginx
server {
    listen 80;
    server_name bot.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

4. **Update EVIE backend:**

Add to `.env`:

```bash
SHARED_BOT_URL=http://bot.yourdomain.com
```

## 📝 Notes

- Bot service nên chạy trên VPS riêng (không phải Vercel)
- Cần Chrome/Chromium để chạy Selenium
- Session được giữ trong memory, restart sẽ mất session
- Có thể scale bằng cách chạy nhiều instances với load balancer

## 🔄 Workflow

1. User thêm hậu đài trong EVIE
2. EVIE gửi request đến shared bot service
3. Bot service check session:
   - Nếu có session → reuse
   - Nếu không → login mới
4. Bot check player trong hậu đài
5. Trả kết quả về EVIE
6. EVIE hiển thị cho user

## ⚡ Performance

- Session reuse giảm thời gian check
- Cache player list (5 phút)
- Headless Chrome tiết kiệm tài nguyên
- Có thể handle 100+ concurrent sessions

---

**Developed for EVIE System** 🚀
