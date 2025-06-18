#!/bin/bash

# 簡化的構建腳本 - 專為部署準備
echo "🚀 構建 OpenAITx React 頁面..."

# 清理舊的構建
rm -rf dist

# 構建
pnpm run build

if [ -d "dist" ]; then
    echo "✅ 構建完成！"
    echo ""
    echo "📁 dist 資料夾已準備好，包含："
    echo "   • index.html"
    echo "   • 404.html (GitHub Pages 路由支援)"
    echo "   • assets/ (所有靜態資源)"
    echo ""
    echo "🎯 請將 dist/ 內的所有檔案複製到您的 GitHub Pages 儲存庫"
else
    echo "❌ 構建失敗"
    exit 1
fi 