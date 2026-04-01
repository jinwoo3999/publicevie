"""
EVIE Shared Bot Service
1 bot phục vụ nhiều users, mỗi user có thể có nhiều hậu đài

Chạy: python bot-service.py
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
import time
import hashlib
import os

app = Flask(__name__)
CORS(app)

# Session manager - quản lý nhiều session
class SessionManager:
    def __init__(self):
        self.sessions = {}  # session_id -> session_data
    
    def generate_session_id(self, user_id, haudai_url, username):
        """Tạo unique session ID"""
        key = f"{user_id}_{haudai_url}_{username}"
        return hashlib.md5(key.encode()).hexdigest()
    
    def get_or_create_session(self, user_id, haudai_url, username, password):
        """Lấy session hoặc tạo mới"""
        session_id = self.generate_session_id(user_id, haudai_url, username)
        
        if session_id in self.sessions:
            session = self.sessions[session_id]
            # Check session còn valid không
            if session['logged_in'] and self._check_session_valid(session):
                print(f"✅ Reusing session: {session_id}")
                return session
            else:
                print(f"⚠️ Session expired, re-login: {session_id}")
                self._close_session(session_id)
        
        # Tạo session mới
        print(f"🆕 Creating new session: {session_id}")
        session = self._create_new_session(user_id, haudai_url, username, password)
        self.sessions[session_id] = session
        
        return session
    
    def _create_new_session(self, user_id, haudai_url, username, password):
        """Tạo session mới"""
        chrome_options = Options()
        chrome_options.add_argument('--headless')
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        
        driver = webdriver.Chrome(options=chrome_options)
        
        session = {
            'user_id': user_id,
            'haudai_url': haudai_url,
            'username': username,
            'password': password,
            'driver': driver,
            'logged_in': False,
            'players_cache': [],
            'last_refresh': None,
            'created_at': time.time()
        }
        
        # Login
        if self._login(session):
            session['logged_in'] = True
            self._refresh_players(session)
        
        return session
    
    def _login(self, session):
        """Login vào hậu đài"""
        try:
            driver = session['driver']
            haudai_url = session['haudai_url']
            username = session['username']
            password = session['password']
            
            print(f"🔐 Logging in to {haudai_url}...")
            driver.get(haudai_url + '/login')
            time.sleep(2)
            
            # Try multiple common selectors
            try:
                username_field = driver.find_element(By.ID, 'username')
            except:
                try:
                    username_field = driver.find_element(By.NAME, 'username')
                except:
                    username_field = driver.find_element(By.CSS_SELECTOR, 'input[type="text"]')
            
            username_field.send_keys(username)
            
            try:
                password_field = driver.find_element(By.ID, 'password')
            except:
                try:
                    password_field = driver.find_element(By.NAME, 'password')
                except:
                    password_field = driver.find_element(By.CSS_SELECTOR, 'input[type="password"]')
            
            password_field.send_keys(password)
            
            try:
                login_button = driver.find_element(By.ID, 'submit')
            except:
                try:
                    login_button = driver.find_element(By.CSS_SELECTOR, 'button[type="submit"]')
                except:
                    login_button = driver.find_element(By.TAG_NAME, 'button')
            
            login_button.click()
            
            time.sleep(3)
            
            # Check login success
            if 'dashboard' in driver.current_url or 'home' in driver.current_url:
                print(f"✅ Login successful")
                return True
            else:
                print(f"❌ Login failed")
                return False
                
        except Exception as e:
            print(f"❌ Login error: {e}")
            return False
    
    def _refresh_players(self, session):
        """Refresh danh sách player"""
        try:
            driver = session['driver']
            haudai_url = session['haudai_url']
            
            print(f"🔄 Refreshing players...")
            driver.get(haudai_url + '/players')
            time.sleep(2)
            
            # Try to find player list - multiple strategies
            player_elements = []
            
            # Strategy 1: Look for table rows
            try:
                rows = driver.find_elements(By.CSS_SELECTOR, 'table tr')
                for row in rows:
                    cells = row.find_elements(By.TAG_NAME, 'td')
                    if cells:
                        player_elements.append(cells[0])
            except:
                pass
            
            # Strategy 2: Look for list items
            if not player_elements:
                try:
                    player_elements = driver.find_elements(By.CSS_SELECTOR, 'ul li, ol li')
                except:
                    pass
            
            # Strategy 3: Look for divs with player class
            if not player_elements:
                try:
                    player_elements = driver.find_elements(By.CSS_SELECTOR, '[class*="player"], [class*="user"], [class*="account"]')
                except:
                    pass
            
            session['players_cache'] = [elem.text.lower() for elem in player_elements]
            session['last_refresh'] = time.time()
            
            print(f"✅ Found {len(session['players_cache'])} players")
            return True
            
        except Exception as e:
            print(f"❌ Refresh error: {e}")
            return False
    
    def _check_session_valid(self, session):
        """Check session còn valid không"""
        try:
            driver = session['driver']
            # Try to get current URL
            current_url = driver.current_url
            return True
        except:
            return False
    
    def _close_session(self, session_id):
        """Đóng session"""
        if session_id in self.sessions:
            session = self.sessions[session_id]
            try:
                session['driver'].quit()
            except:
                pass
            del self.sessions[session_id]
            print(f"🔒 Session closed: {session_id}")
    
    def check_player(self, user_id, haudai_url, username, password, player_name):
        """Check player có trong hậu đài không"""
        session = self.get_or_create_session(user_id, haudai_url, username, password)
        
        if not session['logged_in']:
            return {'error': 'Failed to login', 'exists': False}
        
        # Refresh nếu cache cũ hơn 5 phút
        if not session['last_refresh'] or (time.time() - session['last_refresh']) > 300:
            self._refresh_players(session)
        
        exists = player_name.lower() in session['players_cache']
        
        return {
            'exists': exists,
            'player': player_name,
            'total_players': len(session['players_cache'])
        }
    
    def get_stats(self):
        """Lấy thống kê"""
        return {
            'total_sessions': len(self.sessions),
            'sessions': [
                {
                    'user_id': s['user_id'],
                    'haudai_url': s['haudai_url'],
                    'username': s['username'],
                    'logged_in': s['logged_in'],
                    'players_count': len(s['players_cache']),
                    'uptime': time.time() - s['created_at']
                }
                for s in self.sessions.values()
            ]
        }

# Khởi tạo manager
manager = SessionManager()

# API Endpoints
@app.route('/', methods=['GET'])
def health():
    """Health check"""
    stats = manager.get_stats()
    return jsonify({
        'status': 'OK',
        'service': 'EVIE Shared Bot Service',
        'version': '1.0.0',
        'stats': stats
    })

@app.route('/check', methods=['POST'])
def check_player():
    """
    Check player có trong hậu đài không
    
    Request:
    {
        "user_id": "user_123",
        "haudai_url": "https://haudai.com",
        "haudai_username": "agent1",
        "haudai_password": "pass123",
        "player": "player123"
    }
    """
    data = request.json
    
    # Validate
    required_fields = ['user_id', 'haudai_url', 'haudai_username', 'haudai_password', 'player']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'{field} required'}), 400
    
    # Check player
    result = manager.check_player(
        user_id=data['user_id'],
        haudai_url=data['haudai_url'],
        username=data['haudai_username'],
        password=data['haudai_password'],
        player_name=data['player']
    )
    
    return jsonify(result)

@app.route('/sessions', methods=['GET'])
def list_sessions():
    """Lấy danh sách sessions"""
    stats = manager.get_stats()
    return jsonify(stats)

@app.route('/sessions/<session_id>', methods=['DELETE'])
def close_session(session_id):
    """Đóng session"""
    manager._close_session(session_id)
    return jsonify({'success': True, 'message': 'Session closed'})

if __name__ == '__main__':
    print("🤖 EVIE Shared Bot Service Starting...")
    print("📝 Port: 5000")
    print("🔗 Health: http://localhost:5000/")
    print("📡 API: POST /check")
    print("\n⚠️ LƯU Ý: Cần chỉnh selectors trong _login() và _refresh_players()\n")
    
    app.run(host='0.0.0.0', port=5000, debug=False)
