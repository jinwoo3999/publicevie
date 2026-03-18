#!/usr/bin/env node

/**
 * Script hỗ trợ setup deploy EVIE
 */

const readline = require('readline');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

function exec(command) {
    try {
        const output = execSync(command, { encoding: 'utf8' });
        return { success: true, output };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function main() {
    console.log('🚀 EVIE Deploy Setup\n');
    console.log('Script này sẽ giúp bạn chuẩn bị deploy EVIE\n');
    
    // Check git
    console.log('📋 Bước 1: Kiểm tra Git...');
    const gitCheck = exec('git --version');
    if (!gitCheck.success) {
        console.log('❌ Git chưa được cài đặt!');
        console.log('   Tải Git tại: https://git-scm.com/download/win');
        process.exit(1);
    }
    console.log('✅ Git đã cài đặt:', gitCheck.output.trim());
    
    // Check if already initialized
    const isGitRepo = fs.existsSync('.git');
    
    if (!isGitRepo) {
        console.log('\n📋 Bước 2: Khởi tạo Git repository...');
        const init = exec('git init');
        if (init.success) {
            console.log('✅ Đã khởi tạo Git repository');
        } else {
            console.log('❌ Lỗi khởi tạo Git:', init.error);
            process.exit(1);
        }
    } else {
        console.log('\n✅ Git repository đã tồn tại');
    }
    
    // Add all files
    console.log('\n📋 Bước 3: Add files...');
    exec('git add .');
    console.log('✅ Đã add tất cả files');
    
    // Commit
    console.log('\n📋 Bước 4: Commit...');
    const commitResult = exec('git commit -m "Initial commit - EVIE system ready for deploy"');
    if (commitResult.success) {
        console.log('✅ Đã commit');
    } else {
        if (commitResult.error.includes('nothing to commit')) {
            console.log('ℹ️  Không có thay đổi để commit');
        } else {
            console.log('⚠️  Commit warning:', commitResult.error);
        }
    }
    
    // Check branch
    console.log('\n📋 Bước 5: Đổi branch thành main...');
    exec('git branch -M main');
    console.log('✅ Branch: main');
    
    // Ask for GitHub repo
    console.log('\n📋 Bước 6: Setup GitHub remote...');
    console.log('\n🔗 Tạo repository mới trên GitHub:');
    console.log('   1. Vào: https://github.com/new');
    console.log('   2. Tên repo: evie-system (hoặc tên bạn thích)');
    console.log('   3. Chọn Private hoặc Public');
    console.log('   4. KHÔNG tick "Add README"');
    console.log('   5. Click "Create repository"\n');
    
    const username = await question('Nhập GitHub username của bạn: ');
    const repoName = await question('Nhập tên repository (vd: evie-system): ');
    
    const remoteUrl = `https://github.com/${username.trim()}/${repoName.trim()}.git`;
    
    // Check if remote exists
    const remoteCheck = exec('git remote get-url origin');
    if (remoteCheck.success) {
        console.log('ℹ️  Remote origin đã tồn tại, đang update...');
        exec(`git remote set-url origin ${remoteUrl}`);
    } else {
        exec(`git remote add origin ${remoteUrl}`);
    }
    
    console.log('✅ Remote URL:', remoteUrl);
    
    // Push
    console.log('\n📋 Bước 7: Push lên GitHub...');
    console.log('⏳ Đang push... (có thể mất vài giây)');
    
    const pushResult = exec('git push -u origin main');
    if (pushResult.success) {
        console.log('✅ Đã push lên GitHub thành công!');
    } else {
        console.log('❌ Lỗi push:', pushResult.error);
        console.log('\n💡 Có thể bạn cần:');
        console.log('   1. Đăng nhập GitHub trong terminal');
        console.log('   2. Hoặc push thủ công: git push -u origin main');
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('🎉 HOÀN TẤT SETUP!');
    console.log('='.repeat(60));
    console.log('\n📍 Repository của bạn:');
    console.log(`   https://github.com/${username.trim()}/${repoName.trim()}`);
    
    console.log('\n🚀 BƯỚC TIẾP THEO - DEPLOY LÊN VERCEL:');
    console.log('   1. Vào: https://vercel.com/signup');
    console.log('   2. Đăng nhập bằng GitHub');
    console.log('   3. Click "Add New..." → "Project"');
    console.log(`   4. Chọn repository: ${repoName.trim()}`);
    console.log('   5. Click "Import"');
    console.log('   6. Thêm Environment Variables:');
    console.log('      - JWT_SECRET: [tạo string random dài]');
    console.log('      - ADMIN_PASSWORD: [password mạnh]');
    console.log('   7. Click "Deploy"');
    console.log('   8. Đợi 2-3 phút');
    console.log('   9. Copy domain (vd: https://evie-abc123.vercel.app)');
    console.log('   10. Chạy: node update-api-url.js [domain]');
    console.log('   11. Push lại: git add . && git commit -m "Update API URL" && git push');
    
    console.log('\n📖 Xem hướng dẫn chi tiết: DEPLOY_NOW.md');
    console.log('\n✨ Chúc bạn deploy thành công!\n');
    
    rl.close();
}

main().catch(error => {
    console.error('❌ Lỗi:', error);
    rl.close();
    process.exit(1);
});
