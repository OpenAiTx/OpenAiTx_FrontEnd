# view.html 使用說明

## 概述

`dist/view.html` 是一個特殊的重定向頁面，用於將用戶導向到 React 應用的翻譯器頁面（`#view`）。

## 功能特點

### 1. 路由重定向
- 自動將訪問 `/view.html` 的用戶重定向到 `/#view`
- 保留原始 URL 中的所有查詢參數

### 2. 參數保留
例如：
- 訪問：`https://example.com/view.html?repo=test&org=user`
- 重定向到：`https://example.com/#view?repo=test&org=user`

### 3. 用戶體驗
- 顯示美觀的加載動畫
- 500ms 延遲後自動重定向
- 響應式設計，適配各種設備

## 模板系統

該文件使用模板系統管理：

1. **模板文件**：`public/view.html` 是源模板文件，受 Git 版本控制
2. **自動生成**：每次構建時從模板自動生成 `dist/view.html`
3. **一致性**：確保每次構建都使用最新的模板內容

## 使用場景

### 1. 直接訪問翻譯器
用戶可以直接訪問 `view.html` 來使用翻譯功能：
```
https://yourdomain.com/view.html
```

### 2. 帶參數的預填充
可以通過 URL 參數預填充表單：
```
https://yourdomain.com/view.html?repo=myproject&org=myorg
```

### 3. 外部鏈接
其他網站可以直接鏈接到翻譯器：
```html
<a href="https://yourdomain.com/view.html">翻譯我的專案</a>
```

## 技術實現

### JavaScript 核心邏輯
```javascript
// 獲取當前 URL 的參數
const currentUrl = new URL(window.location.href);
const params = currentUrl.searchParams;

// 構建目標 URL
const baseUrl = window.location.origin + window.location.pathname.replace('/view.html', '/');
let targetUrl = baseUrl + '#view';

// 如果有參數，添加到 hash 後面
if (params.toString()) {
    targetUrl += '?' + params.toString();
}

// 延遲重定向
setTimeout(() => {
    window.location.href = targetUrl;
}, 500);
```

## 修改指南

如果需要修改 `view.html`：

1. 編輯 `public/view.html` 模板文件
2. 執行 `npm run build` 重新構建項目
3. 新的 `dist/view.html` 將從模板自動生成

## 工作流程

1. **開發階段**：修改 `public/view.html` 模板
2. **構建階段**：運行 `npm run build`
3. **部署階段**：`dist/view.html` 自動包含在構建輸出中

## 注意事項

- 模板文件 `public/view.html` 受 Git 版本控制
- `dist/view.html` 是構建輸出，每次構建都會重新生成
- 不要直接修改 `dist/view.html`，修改會在下次構建時丟失 