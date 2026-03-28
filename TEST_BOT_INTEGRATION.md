# 🧪 TEST BOT INTEGRATION

Hướng dẫn test tính năng bot integration với EVIE.

## 🎯 Mục Tiêu

Test flow: EVIE → Bot API → Check player → Trả kết quả

## 📝 Bước 1: Chạy Mock Bot

Mock bot giả lập hậu đài với danh sách player có sẵn.

```bash
# Terminal 1: Chạy mock bot
cd mock-bot
node server.js
```

Mock bot sẽ chạy trên: `http://localhost:5000`

**Mock data:**
- Agent A: player1, player2, player3, testuser, vipuser
- Agent B: player4, player5, player6
- Default: demo1, demo2, demo3

## 📝 Bước 2: Chạy EVIE Backend

```bash
# Terminal 2: Chạy EVIE
npm run dev
```

EVIE sẽ chạy trên: `http://localhost:3000`

## 📝 Bước 3: Cấu Hình Bot Trong EVIE

1. Mở: http://localhost:3000/login.html
2. Login với: `admin` / `Admin@2026!`
3. Click "🤖 Cấu Hình Bot"
4. Bật toggle "Bật Bot"
5. Nhập:
   - Bot API URL: `http://localhost:5000/check`
   - Bot API Key: (để trống)
6. Click "🧪 Test Kết Nối"
   - Phải thấy: "✅ Kết nối bot thành công!"
7. Click "💾 Lưu Cấu Hình"

## 📝 Bước 4: Test Check Account

### Test 1: Check account có trong mock bot

1. Vào admin panel
2. Tab "Tài Khoản"
3. Nhập: `testuser`
4. Xem kết quả

**Kỳ vọng:**
- ✅ Thành công (vì testuser có trong mock data)

### Test 2: Check account không có trong mock bot

1. Nhập: `notexist`
2. Xem kết quả

**Kỳ vọng:**
- ❌ Thất bại (vì notexist không có trong mock data)

### Test 3: Check trên trang chính

1. Mở: http://localhost:3000/
2. Tab "TÀI KHOẢN"
3. Nhập: `player1`
4. Click "BẮT ĐẦU XỬ LÝ"

**Kỳ vọng:**
- ✅ ROOT ACCESS: GRANTED

## 📝 Bước 5: Test Fallback

Test khi bot không hoạt động, hệ thống fallback về database.

1. Tắt mock bot (Ctrl+C trong Terminal 1)
2. Trong EVIE admin panel, thêm account thủ công: `manualuser`
3. Check account: `manualuser`

**Kỳ vọng:**
- ✅ Thành công (check từ database)
- Console log: "Bot check error, falling back to database"

## 📝 Bước 6: Test API Trực Tiếp

### Test mock bot API

```bash
# Check player
curl -X POST http://localhost:5000/check \
  -H "Content-Type: application/json" \
  -d '{"player": "testuser"}'

# Response:
# {"exists": true, "player": "testuser", ...}
```

### Test EVIE bot config API

```bash
# Get config
curl http://localhost:3000/api/bot-config \
  -H "X-API-Key: YOUR_API_KEY"

# Update config
curl -X POST http://localhost:3000/api/bot-config \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "bot_enabled": true,
    "bot_api_url": "http://localhost:5000/check",
    "bot_api_key": ""
  }'
```

## 🐛 Troubleshooting

### Lỗi: Connection refused
- Kiểm tra mock bot có đang chạy không
- Kiểm tra port 5000 có bị chiếm không

### Lỗi: Bot check failed
- Xem console log trong EVIE
- Xem console log trong mock bot
- Kiểm tra URL có đúng không

### Lỗi: API key invalid
- Kiểm tra đã login EVIE chưa
- Kiểm tra API key trong localStorage

## ✅ Checklist

- [ ] Mock bot chạy thành công
- [ ] EVIE backend chạy thành công
- [ ] Cấu hình bot trong EVIE thành công
- [ ] Test connection thành công
- [ ] Check account qua bot thành công
- [ ] Check account không tồn tại thành công
- [ ] Fallback về database thành công
- [ ] Check trên trang chính thành công

## 🚀 Tiếp Theo

Sau khi test thành công với mock bot:

1. **Deploy mock bot lên VPS** (để test production)
2. **Customize bot template** (bot.py) cho hậu đài thật
3. **Deploy bot thật lên VPS**
4. **Update bot URL trong EVIE production**

---

**Nếu tất cả test pass → Bot integration hoạt động hoàn hảo!** ✅
