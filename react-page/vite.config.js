import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'
import { generateCSP, getSecurityHeaders } from './src/config/csp.js'

// 自定義插件：從模板創建 view.html 文件
const createViewHtml = () => {
  return {
    name: 'create-view-html',
    writeBundle() {
      const distViewHtmlPath = path.resolve(__dirname, 'dist/view.html');
      const publicViewHtmlPath = path.resolve(__dirname, 'public/view.html');
      
      // 從 public 目錄的模板創建 view.html
      if (fs.existsSync(publicViewHtmlPath)) {
        const templateContent = fs.readFileSync(publicViewHtmlPath, 'utf-8');
        fs.writeFileSync(distViewHtmlPath, templateContent);
        console.log('✅ view.html 已從模板創建');
      } else {
        console.warn('⚠️ 找不到 public/view.html 模板文件');
      }
    }
  };
};

export default defineConfig({
  plugins: [react(), createViewHtml()],
  // GitHub Pages 部署配置
  base: './', // 使用相對路徑，適用於任何部署環境
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // 確保生成的檔案名稱穩定
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name].[hash][extname]',
        chunkFileNames: 'assets/[name].[hash].js',
        entryFileNames: 'assets/[name].[hash].js'
      }
    },
    // 生成 source map 用於調試（可選）
    sourcemap: false,
    // 優化構建
    minify: 'terser',
    target: 'esnext'
  },
  server: {
    port: 3000,
    open: true,
    // 配置安全標頭
    headers: {
      'Content-Security-Policy': generateCSP('development'),
      ...getSecurityHeaders(false) // 開發環境不是 GitHub Pages
    }
  }
}) 