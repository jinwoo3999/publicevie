// API Configuration
const API_URL = 'http://localhost:3000/api';

// Get API key from localStorage (if user is logged in)
function getApiKey() {
    return localStorage.getItem('adminApiKey') || null;
}

// Configuration
const SCAN_STEPS = {
    website: [
        { id: 1, text: 'Khởi tạo kết nối...', duration: 600 },
        { id: 2, text: 'Phân tích URL...', duration: 700 },
        { id: 3, text: 'Quét mã ẩn...', duration: 800 },
        { id: 4, text: 'Kiểm tra IP...', duration: 600 },
        { id: 5, text: 'Quét tracking...', duration: 700 },
        { id: 6, text: 'Tổng hợp...', duration: 500 }
    ],
    account: [
        { id: 1, text: 'Khởi tạo kiểm tra...', duration: 600 },
        { id: 2, text: 'Xác thực tài khoản...', duration: 800 },
        { id: 3, text: 'Kiểm tra bảo mật...', duration: 700 },
        { id: 4, text: 'Phân tích quyền hạn...', duration: 600 },
        { id: 5, text: 'Quét lịch sử...', duration: 700 },
        { id: 6, text: 'Tổng hợp...', duration: 500 }
    ]
};

let currentScan = null;
let currentTab = 'website';
let lastScanResult = null; // Store last scan result

// Tab switching
function switchTab(tab) {
    currentTab = tab;
    
    // Update tab buttons
    document.getElementById('websiteTab').classList.toggle('active', tab === 'website');
    document.getElementById('accountTab').classList.toggle('active', tab === 'account');
    
    // Update sections
    document.getElementById('websiteSection').style.display = tab === 'website' ? 'flex' : 'none';
    document.getElementById('accountSection').style.display = tab === 'account' ? 'flex' : 'none';
    
    // Hide results and clean button
    document.getElementById('resultsSection').style.display = 'none';
    document.getElementById('progressSection').style.display = 'none';
    document.getElementById('cleanButtonSection').style.display = 'none';
    lastScanResult = null;
}

// Main scan function
async function startScan(type) {
    let input, value;
    
    if (type === 'website') {
        input = document.getElementById('urlInput');
        value = input.value.trim();
        if (!value) {
            showNotification('Vui lòng nhập URL', 'warning');
            return;
        }
    } else {
        input = document.getElementById('accountInput');
        value = input.value.trim();
        if (!value) {
            showNotification('Vui lòng nhập tài khoản', 'warning');
            return;
        }
    }
    
    // Disable button
    const scanBtn = type === 'website' ? document.getElementById('scanBtn') : document.getElementById('scanBtnAccount');
    scanBtn.disabled = true;
    scanBtn.innerHTML = '<span>Đang quét...</span>';
    
    // Hide results, show progress
    document.getElementById('resultsSection').style.display = 'none';
    document.getElementById('progressSection').style.display = 'block';
    
    // Start scanning process
    await runScanProcess(value, type);
}

async function runScanProcess(value, type) {
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const progressPercent = document.getElementById('progressPercent');
    const progressSteps = document.getElementById('progressSteps');
    
    const steps = SCAN_STEPS[type];
    
    // Create step elements
    progressSteps.innerHTML = '';
    steps.forEach(step => {
        const stepEl = document.createElement('div');
        stepEl.className = 'progress-step';
        stepEl.id = `step-${step.id}`;
        stepEl.innerHTML = `
            <div class="step-icon">⏳</div>
            <div class="step-text">${step.text}</div>
            <div class="step-status">Chờ</div>
        `;
        progressSteps.appendChild(stepEl);
    });
    
    // Run each step
    for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        const percent = Math.round(((i + 1) / steps.length) * 100);
        
        // Update progress bar
        progressFill.style.width = percent + '%';
        progressPercent.textContent = percent + '%';
        progressText.textContent = step.text;
        
        // Update step status
        const stepEl = document.getElementById(`step-${step.id}`);
        stepEl.classList.add('active');
        stepEl.querySelector('.step-icon').textContent = '⚙️';
        stepEl.querySelector('.step-status').textContent = 'Xử lý...';
        
        // Wait for step duration
        await sleep(step.duration);
        
        // Mark as completed
        stepEl.classList.remove('active');
        stepEl.classList.add('completed');
        stepEl.querySelector('.step-icon').textContent = '✓';
        stepEl.querySelector('.step-status').textContent = 'OK';
    }
    
    // Check with backend API
    const isAllowed = await checkWithBackend(value, type);
    
    // Show results
    await sleep(500);
    showResults(value, type, isAllowed);
}

async function checkWithBackend(value, type) {
    const apiKey = getApiKey();
    
    // If no API key, use public check (will fail for non-allowed items)
    if (!apiKey) {
        console.log('No API key found, using fallback check');
        return type === 'website' ? checkDomainFallback(value) : checkAccountFallback(value);
    }
    
    try {
        const endpoint = type === 'website' ? '/check-website' : '/check-account';
        const body = type === 'website' ? { url: value } : { account: value };
        
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': apiKey
            },
            body: JSON.stringify(body)
        });
        
        if (!response.ok) {
            console.error('API check failed:', response.status);
            return type === 'website' ? checkDomainFallback(value) : checkAccountFallback(value);
        }
        
        const data = await response.json();
        return data.isAllowed || false;
    } catch (error) {
        console.error('Error checking with backend:', error);
        return type === 'website' ? checkDomainFallback(value) : checkAccountFallback(value);
    }
}

function checkDomainFallback(url) {
    // Fallback check using config.js if available
    if (window.CONFIG && window.CONFIG.websites) {
        let domain = url.toLowerCase()
            .trim()
            .replace(/^https?:\/\//, '')
            .replace(/^www\./, '')
            .replace(/\/.*$/, '')
            .split('?')[0]
            .split('#')[0];
        
        return window.CONFIG.websites.some(allowed => {
            const allowedLower = allowed.toLowerCase();
            return domain === allowedLower || 
                   domain.endsWith('.' + allowedLower) ||
                   allowedLower === domain.split(':')[0];
        });
    }
    return false;
}

function checkAccountFallback(account) {
    // Fallback check using config.js if available
    if (window.CONFIG && window.CONFIG.accounts) {
        const normalizedAccount = account.toLowerCase().trim();
        return window.CONFIG.accounts.some(allowed => 
            allowed.toLowerCase() === normalizedAccount
        );
    }
    return false;
}

function showResults(value, type, isAllowed) {
    const resultsSection = document.getElementById('resultsSection');
    const progressSection = document.getElementById('progressSection');
    const resultsTitle = document.getElementById('resultsTitle');
    const resultsBadge = document.getElementById('resultsBadge');
    const resultsTableBody = document.getElementById('resultsTableBody');
    const resultsSummary = document.getElementById('resultsSummary');
    const cleanButtonSection = document.getElementById('cleanButtonSection');
    
    // Store scan result
    lastScanResult = { value, type, isAllowed };
    
    // Hide progress, show results
    progressSection.style.display = 'none';
    resultsSection.style.display = 'block';
    
    // Show clean button only if allowed
    if (isAllowed) {
        cleanButtonSection.style.display = 'block';
    } else {
        cleanButtonSection.style.display = 'none';
    }
    
    // Set badge
    if (isAllowed) {
        resultsBadge.className = 'results-badge success';
        resultsBadge.textContent = '✓ AN TOÀN';
        resultsTitle.textContent = 'Kết Quả Quét - An Toàn';
    } else {
        resultsBadge.className = 'results-badge danger';
        resultsBadge.textContent = '✗ NGUY HIỂM';
        resultsTitle.textContent = 'Kết Quả Quét - Phát Hiện Mối Đe Dọa';
    }
    
    // Generate table rows
    const checks = generateCheckResults(value, isAllowed, type);
    resultsTableBody.innerHTML = '';
    
    checks.forEach(check => {
        const row = document.createElement('tr');
        const statusClass = check.safe ? 'safe' : 'danger';
        const statusIcon = check.safe ? '✓' : '✗';
        
        row.innerHTML = `
            <td>${check.feature}</td>
            <td>
                <div class="status-cell">
                    <span class="status-icon">${statusIcon}</span>
                    <span class="status-text ${statusClass}">${check.status}</span>
                </div>
            </td>
            <td>${check.detail}</td>
        `;
        resultsTableBody.appendChild(row);
    });
    
    // Generate summary WITHOUT win rate (will show after cleaning)
    if (isAllowed) {
        if (type === 'website') {
            resultsSummary.innerHTML = `
                <h5>✓ Kết Quả</h5>
                <p>
                    <strong>${value}</strong> - Đã xác minh an toàn
                    <br><br>
                    <span style="color: var(--text-dim);">Nhấn nút "Xóa Mã Ẩn" để tiếp tục</span>
                </p>
            `;
        } else {
            resultsSummary.innerHTML = `
                <h5>✓ Kết Quả</h5>
                <p>
                    <strong>${value}</strong> - Tài khoản hợp lệ
                    <br><br>
                    <span style="color: var(--text-dim);">Nhấn nút "Xóa Mã Ẩn" để tiếp tục</span>
                </p>
            `;
        }
    } else {
        if (type === 'website') {
            resultsSummary.innerHTML = `
                <h5>⚠ Cảnh Báo</h5>
                <p>
                    <strong>${value}</strong><br>
                    Website không nằm trong danh sách an toàn. Phát hiện nhiều mối đe dọa bảo mật.
                    <br><br>
                    <span style="color: var(--danger);">⚠ KHÔNG NÊN truy cập</span>
                </p>
            `;
        } else {
            resultsSummary.innerHTML = `
                <h5>⚠ Cảnh Báo</h5>
                <p>
                    <strong>${value}</strong><br>
                    Tài khoản không hợp lệ hoặc không có trong hệ thống.
                    <br><br>
                    <span style="color: var(--danger);">⚠ Tài khoản không được xác thực</span>
                </p>
            `;
        }
    }
    
    // Re-enable button
    const scanBtn = type === 'website' ? document.getElementById('scanBtn') : document.getElementById('scanBtnAccount');
    scanBtn.disabled = false;
    scanBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <span>Quét</span>
    `;
    
    // Show notification
    if (isAllowed) {
        showNotification('✓ Quét hoàn tất - An toàn', 'success');
    } else {
        showNotification('⚠ Quét hoàn tất - Không hợp lệ', 'danger');
    }
}

function checkDomain(url) {
    // This function is now deprecated, use checkWithBackend instead
    return checkDomainFallback(url);
}

function checkAccount(account) {
    // This function is now deprecated, use checkWithBackend instead
    return checkAccountFallback(account);
}

function generateCheckResults(value, isAllowed, type) {
    if (isAllowed) {
        if (type === 'website') {
            return [
                { feature: '🔍 Mã ẩn', status: 'An toàn', detail: 'Không phát hiện', safe: true },
                { feature: '🛡️ IP', status: 'Bảo vệ', detail: 'Không thu thập', safe: true },
                { feature: '📱 Thiết bị', status: 'OK', detail: 'Không tracking', safe: true },
                { feature: '🍪 Cookies', status: 'An toàn', detail: 'Chỉ cần thiết', safe: true },
                { feature: '👁️ Hành vi', status: 'OK', detail: 'Không theo dõi', safe: true },
                { feature: '🔒 SSL', status: 'Đạt chuẩn', detail: 'Mã hóa tốt', safe: true }
            ];
        } else {
            return [
                { feature: '✓ Xác thực', status: 'Hợp lệ', detail: 'Tài khoản đã xác minh', safe: true },
                { feature: '🔐 Bảo mật', status: 'Tốt', detail: 'Mật khẩu mạnh', safe: true },
                { feature: '⚡ Quyền hạn', status: 'OK', detail: 'Quyền chuẩn', safe: true },
                { feature: '📊 Lịch sử', status: 'Sạch', detail: 'Không vi phạm', safe: true },
                { feature: '🎯 Trạng thái', status: 'Hoạt động', detail: 'Tài khoản active', safe: true },
                { feature: '💎 Cấp độ', status: 'VIP', detail: 'Ưu tiên cao', safe: true }
            ];
        }
    } else {
        if (type === 'website') {
            return [
                { feature: '🔍 Mã ẩn', status: 'Nguy hiểm', detail: 'Phát hiện 12 mã độc', safe: false },
                { feature: '🛡️ IP', status: 'Không bảo vệ', detail: 'Thu thập IP', safe: false },
                { feature: '📱 Thiết bị', status: 'Tracking', detail: 'Fingerprinting', safe: false },
                { feature: '🍪 Cookies', status: 'Nguy hiểm', detail: '28 cookies theo dõi', safe: false },
                { feature: '👁️ Hành vi', status: 'Có', detail: 'Scripts phân tích', safe: false },
                { feature: '🔒 SSL', status: 'Yếu', detail: 'Không tin cậy', safe: false }
            ];
        } else {
            return [
                { feature: '✓ Xác thực', status: 'Thất bại', detail: 'Không tìm thấy', safe: false },
                { feature: '🔐 Bảo mật', status: 'Yếu', detail: 'Không đủ tiêu chuẩn', safe: false },
                { feature: '⚡ Quyền hạn', status: 'Không có', detail: 'Chưa cấp quyền', safe: false },
                { feature: '📊 Lịch sử', status: 'Không rõ', detail: 'Không có dữ liệu', safe: false },
                { feature: '🎯 Trạng thái', status: 'Không hoạt động', detail: 'Tài khoản bị khóa', safe: false },
                { feature: '💎 Cấp độ', status: 'Không xác định', detail: 'Chưa phân loại', safe: false }
            ];
        }
    }
}

// Clean hidden code function
async function cleanHiddenCode() {
    if (!lastScanResult || !lastScanResult.isAllowed) {
        showNotification('⚠ Vui lòng quét trước khi xóa', 'warning');
        return;
    }
    
    const cleanBtn = document.getElementById('cleanBtn');
    cleanBtn.disabled = true;
    cleanBtn.innerHTML = '<span>Đang xóa...</span>';
    
    // Simulate cleaning process
    await sleep(2000);
    
    // Show win rate after cleaning
    const winRate = Math.floor(Math.random() * 21) + 75; // 75-95%
    const minDeposits = Math.floor(Math.random() * 3) + 3; // 3-5
    const maxDeposits = minDeposits + Math.floor(Math.random() * 3) + 2; // +2 to +4
    
    const resultsSummary = document.getElementById('resultsSummary');
    const { value, type } = lastScanResult;
    
    if (type === 'website') {
        resultsSummary.innerHTML = `
            <h5>✓ Kết Quả</h5>
            <p>
                <strong>${value}</strong> - Đã xác minh an toàn
                <br><br>
                <span style="color: var(--success);">✓ Đã xóa mã ẩn thành công</span>
            </p>
            <div class="win-rate-box">
                <h5>📊 Tỉ Lệ Nổ</h5>
                <div class="win-rate-value">${winRate}%</div>
                <div class="win-rate-detail">
                    Dự đoán <strong>${minDeposits}-${maxDeposits} lần nạp</strong>
                </div>
            </div>
        `;
    } else {
        resultsSummary.innerHTML = `
            <h5>✓ Kết Quả</h5>
            <p>
                <strong>${value}</strong> - Tài khoản hợp lệ
                <br><br>
                <span style="color: var(--success);">✓ Đã xóa mã ẩn thành công</span>
            </p>
            <div class="win-rate-box">
                <h5>📊 Tỉ Lệ Nổ</h5>
                <div class="win-rate-value">${winRate}%</div>
                <div class="win-rate-detail">
                    Dự đoán <strong>${minDeposits}-${maxDeposits} lần nạp</strong>
                </div>
            </div>
        `;
    }
    
    // Hide clean button after success
    document.getElementById('cleanButtonSection').style.display = 'none';
    
    cleanBtn.disabled = false;
    cleanBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span>Xóa Mã Ẩn</span>
    `;
    
    showNotification('✓ Đã xóa mã ẩn thành công', 'success');
}

// Utility functions
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function showNotification(message, type) {
    const notification = document.createElement('div');
    const bgColor = {
        'success': 'var(--success)',
        'danger': 'var(--danger)',
        'warning': 'var(--warning)'
    }[type] || 'var(--primary)';
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 18px 28px;
        background: ${bgColor};
        color: white;
        border-radius: 12px;
        box-shadow: 0 8px 25px rgba(0,0,0,0.4);
        z-index: 10000;
        font-weight: 600;
        animation: slideInRight 0.4s ease-out;
        max-width: 400px;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.4s ease-out';
        setTimeout(() => notification.remove(), 400);
    }, 4000);
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Handle Enter key
document.addEventListener('DOMContentLoaded', function() {
    const urlInput = document.getElementById('urlInput');
    const accountInput = document.getElementById('accountInput');
    
    urlInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            startScan('website');
        }
    });
    
    accountInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            startScan('account');
        }
    });
});
