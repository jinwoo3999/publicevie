# 🤖 EVIE Bot Template

Template bot để kết nối EVIE với hậu đài và check player realtime.

## 📋 Yêu Cầu

- Python 3.8+
- Chrome/Chromium browser
- ChromeDriver

## 🚀 Cài Đặt

### 1. Cài đặt Python packages

```bash
pip install selenium flask flask-cors
```

### 2. Cài đặt ChromeDriver

**Windows:**
```bash
# Download từ: https://chromedriver.chromium.org/
# Hoặc dùng chocolatey:
choco install chromedriver
```

**Linux:**
```bash
sudo apt-get install chromium-chromedriver
```

**Mac:**
```bash
brew install chromedriver
```

## ⚙️ Cấu Hình

### Cách 1: Environment Variables

```bash
export HAUDAI_URL="https://your-haudai.com"
export HAUDAI_USERNAME="your_username"
export HAUDAI_PASSWORD="your_password"
```

### Cách 2: Sửa trực tiếp trong bot.py

```python
HAUDAI_URL = 'https://your-haudai.com'
HAUDAI_USERNAME = 'your_username'
HAUDAI_PASSWORD = 'your_password'
```

### ⚠️ QUAN TRỌNG: Chỉnh Selectors

Bạn CẦN chỉnh sửa các selector phù hợp với hậu đài của bạn:

**Line 45-50: Login selectors**
```python
username_field = self.driver.find_element(By.ID, 'username')  # Thay 'username'
password_field = self.driver.find_element(By.ID, 'password')  # Thay 'password'
login_button = self.driver.find_element(By.ID, 'submit')      # Thay 'submit'
```

**Line 72: Player list URL**
```python
self.driver.get(HAUDAI_URL + '/players')  # Thay '/players'
```

**Line 76: Player name selector**
```python
player_elements = self.driver.find_elements(By.CLASS_NAME, 'player-name')  # Thay 'player-name'
```

### 🔍 Cách Tìm Selectors

1. Mở hậu đài trong Chrome
2. Nhấn F12 (Developer Tools)
3. Click vào icon "Select element" (Ctrl+Shift+C)
4. Click vào element cần lấy
5. Xem HTML code để lấy ID/Class/XPath

## 🏃 Chạy Bot

```bash
python bot.py
```

Bot sẽ chạy trên: `http://localhost:5000`

## 📡 API Endpoints

### GET /
Health check

**Response:**
```json
{
    "status": "OK",
    "logged_in": true,
    "players_count": 10,
    "last_refresh": 1234567890
}
```

### POST /check
Check player có trong hậu đài không

**Request:**
```json
{
    "player": "player123"
}
```

**Response:**
```json
{
    "exists": true,
    "player": "player123",
    "timestamp": 1234567890
}
```

### POST /refresh
Refresh danh sách player từ hậu đài

**Response:**
```json
{
    "success": true,
    "players_count": 10,
    "timestamp": 1234567890
}
```

### GET /players
Lấy danh sách tất cả player

**Response:**
```json
{
    "players": ["player1", "player2", "player3"],
    "total": 3,
    "last_refresh": 1234567890
}
```

## 🔗 Kết Nối Với EVIE

1. Chạy bot: `python bot.py`
2. Login vào EVIE admin panel
3. Vào "🤖 Cấu Hình Bot"
4. Bật "Bật Bot"
5. Nhập Bot API URL: `http://your-server:5000/check`
6. Test kết nối
7. Lưu cấu hình

## 🚀 Deploy Lên VPS

### Railway (Free)

1. Tạo tài khoản: https://railway.app
2. New Project → Deploy from GitHub
3. Thêm environment variables
4. Deploy

### DigitalOcean ($5/month)

```bash
# SSH vào VPS
ssh root@your-vps-ip

# Cài đặt Python
apt update
apt install python3 python3-pip chromium-chromedriver

# Clone code
git clone your-repo
cd bot-template

# Cài packages
pip3 install -r requirements.txt

# Chạy với PM2
npm install -g pm2
pm2 start bot.py --interpreter python3
pm2 save
pm2 startup
```

## 🐛 Troubleshooting

### Lỗi: ChromeDriver not found
```bash
# Kiểm tra ChromeDriver
which chromedriver

# Nếu không có, cài lại
```

### Lỗi: Login failed
- Kiểm tra selectors có đúng không
- Kiểm tra username/password
- Kiểm tra hậu đài có CAPTCHA không

### Lỗi: Player list empty
- Kiểm tra URL player list
- Kiểm tra selector player name
- Xem console log để debug

## 📝 Customize

### Thêm xử lý CAPTCHA

```python
# Dùng 2Captcha API
from twocaptcha import TwoCaptcha

solver = TwoCaptcha('YOUR_API_KEY')
result = solver.recaptcha(sitekey='...', url='...')
```

### Thêm retry logic

```python
def login_with_retry(max_retries=3):
    for i in range(max_retries):
        if session.login():
            return True
        time.sleep(5)
    return False
```

### Thêm logging

```python
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

logger.info("Bot started")
```

## 📞 Support

Nếu cần hỗ trợ, cung cấp:
1. URL hậu đài (nếu có thể)
2. Screenshot trang login
3. Screenshot trang player list
4. Error logs

---

**Made for EVIE System** 🔓
