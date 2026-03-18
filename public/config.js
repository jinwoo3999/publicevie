// Cấu hình danh sách website được phép
const ALLOWED_WEBSITES = [
    'ok168.pro',
    'ok168.com',
    'ok168.net',
    'ok168.vip',
    // Thêm các domain khác vào đây
];

// Cấu hình danh sách tài khoản được phép
const ALLOWED_ACCOUNTS = [
    'admin123',
    'user001',
    'vip888',
    'test123',
    // Thêm các tài khoản khác vào đây
];

// Export để sử dụng trong script.js
window.CONFIG = {
    websites: ALLOWED_WEBSITES,
    accounts: ALLOWED_ACCOUNTS
};
