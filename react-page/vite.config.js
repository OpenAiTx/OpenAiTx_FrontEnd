import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
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
    open: true
  }
}) 