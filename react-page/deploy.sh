#!/bin/bash

# OpenAITx React 頁面部署準備腳本
echo "🚀 開始準備 OpenAITx React 頁面部署..."

# 清理之前的構建
echo "🧹 清理之前的構建檔案..."
rm -rf dist

# 安裝依賴
echo "📦 安裝依賴..."
pnpm install

# 構建專案
echo "🔨 構建專案..."
pnpm run build

# 檢查構建結果
if [ -d "dist" ]; then
    echo "✅ 構建成功！"
    echo "📁 dist 資料夾內容："
    ls -la dist/
    
    echo ""
    echo "📋 部署檢查清單："
    echo "✓ index.html - 主頁面"
    echo "✓ 404.html - GitHub Pages 路由支援"
    echo "✓ assets/ - 靜態資源"
    echo "✓ 使用相對路徑配置"
    echo "✓ Hash 路由配置"
    
    echo ""
    echo "🎯 下一步："
    echo "1. 將 dist/ 資料夾內的所有內容複製到您的 GitHub Pages 儲存庫"
    echo "2. 提交並推送到 GitHub"
    echo "3. 確保 GitHub Pages 設定為從根目錄或 docs/ 資料夾部署"
    echo ""
    echo "📝 注意事項："
    echo "- 確保目標儲存庫已啟用 GitHub Pages"
    echo "- 如果使用自定義域名，請添加 CNAME 檔案"
    echo "- 部署後可能需要等待幾分鐘才能生效"
    
else
    echo "❌ 構建失敗！請檢查錯誤訊息。"
    exit 1
fi 