# 🚀 Deploy Shared Bot Service to VPS

Hướng dẫn deploy EVIE Shared Bot Service lên VPS để sử dụng production.

## 📋 Yêu Cầu

- VPS với Ubuntu 20.04+ (hoặc Debian)
- RAM: Tối thiểu 2GB (khuyến nghị 4GB+)
- CPU: 2 cores+
- Storage: 10GB+
- SSH access

## 🔧 Bước 1: Chuẩn Bị VPS

### 1.1. SSH vào VPS

```bash
ssh root@your-vps-ip
```

### 1.2. Update system

```bash
apt-get update
apt-get upgrade -y
```

### 1.3. Tạo user mới (khuyến nghị)

```bash
adduser evie
usermod -aG sudo evie
su - evie
```

## 🐍 Bước 2: Cài Đặt Dependencies

### 2.1. Install Python

```bash
sudo apt-get install -y python3 python3-pip python3-venv
```

### 2.2. Install Chrome & ChromeDriver

```bash
# Install Chrome
sudo apt-get install -y chromium-browser chromium-chromedriver

# Verify installation
chromium-browser --version
chromedriver --version
```

### 2.3. Install Git

```bash
sudo apt-get install -y git
```

## 📦 Bước 3: Clone & Setup Project

### 3.1. Clone repository

```bash
cd ~
git clone https://github.com/jinwoo3999/evie-system.git
cd evie-system/shared-bot
```

### 3.2. Create virtual environment

```bash
python3 -m venv venv
source venv/bin/activate
```

### 3.3. Install Python dependencies

```bash
pip install -r requirements.txt
```

### 3.4. Test run

```bash
python bot-service.py
```

Nếu thấy:
```
🤖 EVIE Shared Bot Service Starting...
📝 Port: 5000
```

→ Thành công! Press Ctrl+C để dừng.

## 🔄 Bước 4: Setup Systemd Service

### 4.1. Create service file

```bash
sudo nano /etc/systemd/system/evie-bot.service
```

### 4.2. Paste nội dung:

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
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

**Lưu ý:** Thay `evie` bằng username của bạn nếu khác.

### 4.3. Enable và start service

```bash
sudo systemctl daemon-reload
sudo systemctl enable evie-bot
sudo systemctl start evie-bot
```

### 4.4. Check status

```bash
sudo systemctl status evie-bot
```

Phải thấy: `Active: active (running)`

### 4.5. View logs

```bash
# Real-time logs
sudo journalctl -u evie-bot -f

# Last 100 lines
sudo journalctl -u evie-bot -n 100
```

## 🌐 Bước 5: Setup Nginx Reverse Proxy (Optional)

Nếu muốn dùng domain thay vì IP:port

### 5.1. Install Nginx

```bash
sudo apt-get install -y nginx
```

### 5.2. Create Nginx config

```bash
sudo nano /etc/nginx/sites-available/evie-bot
```

### 5.3. Paste nội dung:

```nginx
server {
    listen 80;
    server_name bot.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}
```

### 5.4. Enable site

```bash
sudo ln -s /etc/nginx/sites-available/evie-bot /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 5.5. Setup SSL (Optional)

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d bot.yourdomain.com
```

## 🔗 Bước 6: Update EVIE Backend

### 6.1. Update Vercel Environment Variables

Vào Vercel Dashboard → Project → Settings → Environment Variables

Thêm:

```
SHARED_BOT_URL=http://your-vps-ip:5000
```

Hoặc nếu dùng domain:

```
SHARED_BOT_URL=https://bot.yourdomain.com
```

### 6.2. Redeploy EVIE

```bash
git push origin main
```

Vercel sẽ tự động redeploy.

## ✅ Bước 7: Test Production

### 7.1. Test bot health

```bash
curl http://your-vps-ip:5000/
```

Hoặc:

```bash
curl https://bot.yourdomain.com/
```

Phải thấy:
```json
{
  "status": "OK",
  "service": "EVIE Shared Bot Service"
}
```

### 7.2. Test từ EVIE

1. Login vào https://evie-system.vercel.app
2. Vào "🏛️ Quản Lý Hậu Đài"
3. Thêm hậu đài mới
4. Test connection
5. Check account

## 🔒 Bước 8: Security (Khuyến Nghị)

### 8.1. Setup Firewall

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 8.2. Restrict bot port (nếu dùng Nginx)

```bash
sudo ufw deny 5000/tcp
```

Bot chỉ accessible qua Nginx.

### 8.3. Setup fail2ban

```bash
sudo apt-get install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

## 📊 Monitoring & Maintenance

### Check service status

```bash
sudo systemctl status evie-bot
```

### View logs

```bash
sudo journalctl -u evie-bot -f
```

### Restart service

```bash
sudo systemctl restart evie-bot
```

### Update code

```bash
cd ~/evie-system
git pull origin main
cd shared-bot
source venv/bin/activate
pip install -r requirements.txt
sudo systemctl restart evie-bot
```

### Check resource usage

```bash
# CPU & Memory
htop

# Disk
df -h

# Network
netstat -tulpn | grep 5000
```

## 🐛 Troubleshooting

### Service không start

```bash
# Check logs
sudo journalctl -u evie-bot -n 50

# Check permissions
ls -la /home/evie/evie-system/shared-bot

# Test manual run
cd ~/evie-system/shared-bot
source venv/bin/activate
python bot-service.py
```

### ChromeDriver error

```bash
# Reinstall
sudo apt-get remove chromium-browser chromium-chromedriver
sudo apt-get install -y chromium-browser chromium-chromedriver

# Check version
chromedriver --version
```

### Port already in use

```bash
# Find process
sudo lsof -i :5000

# Kill process
sudo kill -9 <PID>

# Restart service
sudo systemctl restart evie-bot
```

### Memory issues

```bash
# Check memory
free -h

# Add swap if needed
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

## 📈 Performance Tuning

### Increase worker processes

Edit `bot-service.py`:

```python
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False, threaded=True)
```

### Setup multiple instances with load balancer

```bash
# Run on multiple ports
# Instance 1: port 5000
# Instance 2: port 5001
# Instance 3: port 5002

# Nginx load balancer
upstream evie_bot {
    server localhost:5000;
    server localhost:5001;
    server localhost:5002;
}
```

## 🎉 Done!

Shared bot service đã được deploy thành công!

**Test checklist:**
- [ ] Bot service running
- [ ] Health check OK
- [ ] EVIE có thể connect
- [ ] Thêm hậu đài thành công
- [ ] Check account thành công
- [ ] Logs không có error

---

**Support:** Nếu gặp vấn đề, check logs và troubleshooting section.
