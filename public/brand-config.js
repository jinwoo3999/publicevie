/**
 * BRAND CONFIGURATION
 * Cấu hình được load từ localStorage (user có thể thay đổi trong Settings)
 */

// Load settings từ localStorage hoặc dùng mặc định
const savedSettings = JSON.parse(localStorage.getItem('brandSettings') || '{}');

window.BRAND_CONFIG = {
    name: savedSettings.name || 'EVIE',
    slogan: savedSettings.slogan || 'Xóa mã ẩn - Reset tài khoản & website',
    year: savedSettings.year || '2026',
    logo: savedSettings.logo || '👑',
    colors: savedSettings.colors || {
        primary: '#00f0ff',
        secondary: '#7b2ff7',
        gold: '#FFD700',
        success: '#10b981',
        danger: '#ef4444',
        warning: '#f59e0b'
    }
};

// Áp dụng config khi load trang
document.addEventListener('DOMContentLoaded', function() {
    const config = window.BRAND_CONFIG;
    
    // Update title
    document.title = document.title.replace(/EVIE/g, config.name);
    
    // Update brand name
    document.querySelectorAll('h1, h2, .logo-text h1').forEach(el => {
        if (el.textContent.trim() === 'EVIE' || el.textContent.includes('EVIE')) {
            el.textContent = el.textContent.replace(/EVIE/g, config.name);
        }
    });
    
    // Update slogan
    document.querySelectorAll('.logo-subtitle, .hero p').forEach(el => {
        if (el.textContent.includes('Xóa mã ẩn')) {
            el.textContent = config.slogan;
        }
    });
    
    // Update logo emoji
    document.querySelectorAll('.preview-logo, .logo-icon').forEach(el => {
        el.textContent = config.logo;
    });
    
    // Update year in footer
    document.querySelectorAll('footer p').forEach(el => {
        const text = el.textContent;
        if (text.includes('2024') || text.includes('2025') || text.includes('2026')) {
            el.textContent = `© ${config.year} ${config.name} - Công nghệ xóa mã ẩn & reset tự động`;
        }
    });
    
    // Apply custom colors
    const root = document.documentElement;
    Object.keys(config.colors).forEach(key => {
        root.style.setProperty(`--${key}`, config.colors[key]);
    });
});
