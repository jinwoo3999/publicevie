"""
EVIE Bot Template - Kết nối với hậu đài và check player
Yêu cầu: Python 3.8+, Selenium, Flask

Cài đặt:
pip install selenium flask flask-cors

Chạy:
python bot.py
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
import time
import os

app = Flask(__name__)
CORS(app)

# Cấu hình
HAUDAI_URL = os.getenv('HAUDAI_URL', 'https://your-haudai.com')
HAUDAI_USERNAME = os.getenv('HAUDAI_USERNAME', 'your_username')
HAUDAI_PASSWORD = os.getenv('HAUDAI_PASSWORD', 'your_password')

# Session manager
class BotSession:
    def __init__(self):
        self.driver = None
        self.logged_in = False
        self.players_cache = []
        self.last_refresh = None
    
    def init_driver(self):
        """Khởi tạo Chrome driver"""
        chrome_options = Options()
        chrome_options.add_argument('--headless')  # Chạy ẩn
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        chrome_options.add_argument('--disable-blink-features=AutomationControlled')
        
        self.driver = webdriver.Chrome(options=chrome_options)
        print("✅ Chrome driver initialized")
    
    def login(self):
        """Login vào hậu đài"""
        if not self.driver:
            self.init_driver()
        
        try:
            print(f"🔐 Logging in to {HAUDAI_URL}...")
            self.driver.get(HAUDAI_URL + '/login')
            
            # Đợi trang load
            time.sleep(2)
            
            # Nhập username
            username_field = self.driver.find_element(By.ID, 'username')  # Thay đổi selector
            username_field.send_keys(HAUDAI_USERNAME)
            
            # Nhập password
            password_field = self.driver.find_element(By.ID, 'password')  # Thay đổi selector
            password_field.send_keys(HAUDAI_PASSWORD)
            
            # Click login
            login_button = self.driver.find_element(By.ID, 'submit')  # Thay đổi selector
            login_button.click()
            
            # Đợi login thành công
            time.sleep(3)
            
            # Kiểm tra login thành công
            if 'dashboard' in self.driver.current_url or 'home' in self.driver.current_url:
                self.logged_in = True
                print("✅ Login successful")
                self.refresh_players()
                return True
            else:
                print("❌ Login failed")
                return False
                
        except Exception as e:
            print(f"❌ Login error: {e}")
            return False
    
    def refresh_players(self):
        """Lấy danh sách player từ hậu đài"""
        if not self.logged_in:
            print("⚠️ Not logged in, attempting login...")
            if not self.login():
                return False
        
        try:
            print("🔄 Refreshing player list...")
            
            # Vào trang danh sách player
            self.driver.get(HAUDAI_URL + '/players')  # Thay đổi URL
            time.sleep(2)
            
            # Scrape danh sách player
            # Thay đổi selector phù hợp với hậu đài của bạn
            player_elements = self.driver.find_elements(By.CLASS_NAME, 'player-name')
            
            self.players_cache = [elem.text.lower() for elem in player_elements]
            self.last_refresh = time.time()
            
            print(f"✅ Found {len(self.players_cache)} players")
            return True
            
        except Exception as e:
            print(f"❌ Refresh error: {e}")
            return False
    
    def check_player(self, player_name):
        """Check player có trong hậu đài không"""
        # Refresh nếu cache cũ hơn 5 phút
        if not self.last_refresh or (time.time() - self.last_refresh) > 300:
            self.refresh_players()
        
        return player_name.lower() in self.players_cache
    
    def close(self):
        """Đóng browser"""
        if self.driver:
            self.driver.quit()
            print("🔒 Browser closed")

# Khởi tạo session
session = BotSession()

# API Endpoints
@app.route('/', methods=['GET'])
def health():
    """Health check"""
    return jsonify({
        'status': 'OK',
        'logged_in': session.logged_in,
        'players_count': len(session.players_cache),
        'last_refresh': session.last_refresh
    })

@app.route('/check', methods=['POST'])
def check_player():
    """Check player có trong hậu đài không"""
    data = request.json
    player_name = data.get('player')
    
    if not player_name:
        return jsonify({'error': 'Player name required'}), 400
    
    # Login nếu chưa login
    if not session.logged_in:
        if not session.login():
            return jsonify({'error': 'Failed to login to haudai'}), 500
    
    # Check player
    exists = session.check_player(player_name)
    
    return jsonify({
        'exists': exists,
        'player': player_name,
        'timestamp': time.time()
    })

@app.route('/refresh', methods=['POST'])
def refresh():
    """Refresh danh sách player"""
    success = session.refresh_players()
    
    return jsonify({
        'success': success,
        'players_count': len(session.players_cache),
        'timestamp': time.time()
    })

@app.route('/players', methods=['GET'])
def list_players():
    """Lấy danh sách player"""
    return jsonify({
        'players': session.players_cache,
        'total': len(session.players_cache),
        'last_refresh': session.last_refresh
    })

if __name__ == '__main__':
    print("🤖 EVIE Bot Template Starting...")
    print(f"📝 Hậu đài URL: {HAUDAI_URL}")
    print(f"👤 Username: {HAUDAI_USERNAME}")
    print("\n⚠️ LƯU Ý: Cần chỉnh sửa selectors phù hợp với hậu đài của bạn!")
    print("   - Line 45-50: Login selectors")
    print("   - Line 72: Player list URL")
    print("   - Line 76: Player name selector\n")
    
    # Auto login khi start
    # session.login()
    
    app.run(host='0.0.0.0', port=5000, debug=False)
