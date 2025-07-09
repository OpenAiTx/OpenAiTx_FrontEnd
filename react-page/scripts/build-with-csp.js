#!/usr/bin/env node

/**
 * 構建腳本：自動應用 CSP 配置到生產環境
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// GitHub Pages 生產環境 CSP 配置
const PRODUCTION_CSP = `
default-src 'self';
script-src 'self' 'unsafe-inline' https://openaitx.github.io https://*.github.io;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://openaitx.github.io;
font-src 'self' https://fonts.gstatic.com https://openaitx.github.io;
img-src 'self' data: https: https://img.shields.io https://raw.githubusercontent.com https://openaitx.github.io https://*.github.io https://github.com;
connect-src 'self' https://api.github.com https://raw.githubusercontent.com https://openaitx.com https://img.shields.io https://openaitx.github.io https://*.github.io;
media-src 'self' data: https:;
object-src 'none';
base-uri 'self';
form-action 'self' https://openaitx.com;
frame-ancestors 'none';
upgrade-insecure-requests;
`.replace(/\s+/g, ' ').trim();

/**
 * 更新 index.html 中的 CSP 配置
 */
function updateIndexHtmlCSP() {
  const indexPath = path.join(projectRoot, 'dist', 'index.html');
  
  if (!fs.existsSync(indexPath)) {
    throw new Error('找不到 dist/index.html 文件，請先執行構建');
  }

  let content = fs.readFileSync(indexPath, 'utf-8');
  
  // 查找並替換 CSP meta 標籤
  const cspRegex = /<meta\s+http-equiv="Content-Security-Policy"\s+content="[^"]*"\s*>/i;
  const newCSPTag = `<meta http-equiv="Content-Security-Policy" content="${PRODUCTION_CSP}">`;
  
  if (cspRegex.test(content)) {
    content = content.replace(cspRegex, newCSPTag);
    console.log('✅ 已更新 index.html 中的 CSP 配置');
  } else {
    // 如果沒有找到 CSP 標籤，在 head 中添加
    const headRegex = /<head>/i;
    if (headRegex.test(content)) {
      content = content.replace(headRegex, `<head>\n    ${newCSPTag}`);
      console.log('✅ 已在 index.html 中添加 CSP 配置');
    } else {
      console.warn('⚠️ 無法在 index.html 中找到 <head> 標籤');
    }
  }
  
  fs.writeFileSync(indexPath, content, 'utf-8');
}

/**
 * 創建 .htaccess 文件（用於 Apache 服務器）
 */
function createHtaccess() {
  const htaccessPath = path.join(projectRoot, 'dist', '.htaccess');
  
  const htaccessContent = `
# 安全標頭配置
<IfModule mod_headers.c>
    # Content Security Policy
    Header always set Content-Security-Policy "${PRODUCTION_CSP}"
    
    # 其他安全標頭
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-Frame-Options "DENY"
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
    Header always set Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=()"
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
</IfModule>

# 緩存配置
<IfModule mod_expires.c>
    ExpiresActive on
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
</IfModule>

# GZIP 壓縮
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>

# 單頁應用路由支持
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
         RewriteRule ^index\\.html$ - [L]
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule . /index.html [L]
</IfModule>
`.trim();

  fs.writeFileSync(htaccessPath, htaccessContent);
  console.log('✅ 已創建 .htaccess 文件');
}

/**
 * 創建 _headers 文件（用於 Netlify）
 */
function createNetlifyHeaders() {
  const headersPath = path.join(projectRoot, 'dist', '_headers');
  
  const headersContent = `
/*
  Content-Security-Policy: ${PRODUCTION_CSP}
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
  Strict-Transport-Security: max-age=31536000; includeSubDomains

/assets/*
  Cache-Control: public, max-age=31536000, immutable
`.trim();

  fs.writeFileSync(headersPath, headersContent);
  console.log('✅ 已創建 _headers 文件（Netlify）');
}

/**
 * 創建 vercel.json 文件（用於 Vercel）
 */
function createVercelConfig() {
  const vercelPath = path.join(projectRoot, 'dist', 'vercel.json');
  
  const vercelConfig = {
    headers: [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: PRODUCTION_CSP
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff"
          },
          {
            key: "X-Frame-Options",
            value: "DENY"
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block"
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin"
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()"
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains"
          }
        ]
      }
    ],
    rewrites: [
      {
        source: "/((?!api/).*)",
        destination: "/index.html"
      }
    ]
  };

  fs.writeFileSync(vercelPath, JSON.stringify(vercelConfig, null, 2));
  console.log('✅ 已創建 vercel.json 文件');
}

/**
 * 驗證構建結果
 */
function validateBuild() {
  const distPath = path.join(projectRoot, 'dist');
  const indexPath = path.join(distPath, 'index.html');
  
  if (!fs.existsSync(distPath)) {
    throw new Error('構建目錄不存在');
  }
  
  if (!fs.existsSync(indexPath)) {
    throw new Error('index.html 文件不存在');
  }
  
  const content = fs.readFileSync(indexPath, 'utf-8');
  
  // 驗證 CSP 是否存在
  if (!content.includes('Content-Security-Policy')) {
    throw new Error('CSP 配置未找到');
  }
  
  // 驗證關鍵 CSP 指令
  const requiredDirectives = ['default-src', 'script-src', 'style-src', 'object-src'];
  for (const directive of requiredDirectives) {
    if (!content.includes(directive)) {
      throw new Error(`缺少必需的 CSP 指令: ${directive}`);
    }
  }
  
  console.log('✅ 構建驗證通過');
}

/**
 * 主函數
 */
function main() {
  try {
    console.log('🚀 開始構建生產環境版本...');
    
    // 執行 Vite 構建
    console.log('📦 執行 Vite 構建...');
    execSync('npm run build', { 
      cwd: projectRoot,
      stdio: 'inherit'
    });
    
    // 更新 CSP 配置
    console.log('🔒 配置安全標頭...');
    updateIndexHtmlCSP();
    
    // 創建不同平台的配置文件
    console.log('📄 創建平台配置文件...');
    createHtaccess();
    createNetlifyHeaders();
    createVercelConfig();
    
    // 驗證構建結果
    console.log('✅ 驗證構建結果...');
    validateBuild();
    
    console.log('🎉 構建完成！已應用生產環境 CSP 配置');
    console.log('📁 構建文件位於 dist/ 目錄');
    
  } catch (error) {
    console.error('❌ 構建失敗:', error.message);
    process.exit(1);
  }
}

// 如果直接運行此腳本
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main, updateIndexHtmlCSP, createHtaccess, createNetlifyHeaders, createVercelConfig }; 