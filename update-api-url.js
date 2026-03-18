#!/usr/bin/env node

/**
 * Script để cập nhật API_URL trong tất cả frontend files
 * 
 * Cách dùng:
 * node update-api-url.js https://your-domain.vercel.app
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);

if (args.length === 0) {
    console.log('❌ Thiếu domain!');
    console.log('');
    console.log('Cách dùng:');
    console.log('  node update-api-url.js https://your-domain.vercel.app');
    console.log('');
    console.log('Ví dụ:');
    console.log('  node update-api-url.js https://evie-abc123.vercel.app');
    process.exit(1);
}

const newDomain = args[0].replace(/\/$/, ''); // Remove trailing slash
const newApiUrl = `${newDomain}/api`;

console.log('🔄 Đang cập nhật API_URL...');
console.log(`📍 Domain mới: ${newDomain}`);
console.log(`🔗 API URL mới: ${newApiUrl}`);
console.log('');

const files = [
    'public/login.html',
    'public/superadmin.html',
    'public/admin.html',
    'public/script.js'
];

let successCount = 0;
let errorCount = 0;

files.forEach(file => {
    const filePath = path.join(__dirname, file);
    
    try {
        if (!fs.existsSync(filePath)) {
            console.log(`⚠️  File không tồn tại: ${file}`);
            errorCount++;
            return;
        }

        let content = fs.readFileSync(filePath, 'utf8');
        
        // Replace localhost API URL
        const oldPattern = /const API_URL = ['"]http:\/\/localhost:3000\/api['"];/g;
        const newLine = `const API_URL = '${newApiUrl}';`;
        
        if (content.match(oldPattern)) {
            content = content.replace(oldPattern, newLine);
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✅ Đã cập nhật: ${file}`);
            successCount++;
        } else {
            console.log(`⚠️  Không tìm thấy API_URL trong: ${file}`);
            errorCount++;
        }
    } catch (error) {
        console.log(`❌ Lỗi khi xử lý ${file}: ${error.message}`);
        errorCount++;
    }
});

console.log('');
console.log('📊 Kết quả:');
console.log(`   ✅ Thành công: ${successCount} files`);
console.log(`   ❌ Lỗi: ${errorCount} files`);
console.log('');

if (successCount > 0) {
    console.log('🎉 Hoàn tất! Nhớ commit và push code:');
    console.log('   git add .');
    console.log('   git commit -m "Update API_URL for production"');
    console.log('   git push');
}
