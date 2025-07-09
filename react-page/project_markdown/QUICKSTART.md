# 🚀 OpenAI Tx React - Quick Start Guide

## 📋 Project Overview

✅ **Completed React Refactoring**
- ✅ Modern React 18 + Vite + Tailwind CSS architecture
- ✅ Two main functional pages (Badge Generator, Markdown Viewer)
- ✅ Multi-language support (Traditional Chinese, Simplified Chinese, English)
- ✅ Dark mode toggle
- ✅ Responsive design
- ✅ GitHub Actions automatic deployment setup

## 🎯 Getting Started

### 1. Navigate to React Project Directory
```bash
cd react-page
```

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Start Development Environment
```bash
pnpm dev
```
Access: http://localhost:3000

### 4. Build Production Version
```bash
pnpm build
```

### 5. Preview Production Version
```bash
pnpm preview
```

## 🚀 Deploy to GitHub Pages

### Automatic Deployment (Recommended)
1. Push code to `main` branch:
```bash
git add .
git commit -m "Add React version"
git push origin main
```

2. GitHub Actions will automatically:
   - Build React application
   - Deploy to GitHub Pages
   - Available at `https://YOUR_USERNAME.github.io/OpenAiTx.github.io/`

### Manual Deployment
```bash
cd react-page
./deploy.sh
```

## 📁 Project Structure
```
src/
├── components/
│   ├── Navbar.jsx               # Navigation bar
│   ├── NavLanguageSelector.jsx  # Language selector
│   ├── ProjectsShowcase.jsx     # Project showcase
│   ├── TableOfContents.jsx      # Table of contents component
│   └── ui/                      # UI component library
├── i18n/
│   ├── index.js                 # i18next configuration
│   └── locales/                 # Language resource files
├── pages/
│   ├── BadgeGenerator.jsx       # Badge generator (homepage)
│   └── MarkdownViewer.jsx       # Markdown viewer
├── hooks/
│   └── use-theme.js             # Theme hook
├── lib/
│   ├── emojiUtils.js            # Emoji utilities
│   └── utils.js                 # Common utilities
├── App.jsx                      # Main application
├── main.jsx                     # Entry point
└── index.css                    # Global styles (Tailwind)
```

## 🌟 Feature Highlights

### 1. Badge Generator (`/`)
- Input GitHub username and project name
- One-click generation of multilingual badges
- Support for HTML and Markdown formats
- Copy to clipboard functionality
- Project showcase area

### 2. Markdown Viewer (`/view`)
- GitHub-style rendering
- Code syntax highlighting
- Multilingual badge navigation
- Table of contents functionality
- Responsive design

## 🔧 Development Tips

### Adding New Languages
1. Create a new language file in `src/i18n/locales/` (e.g., `ja.json`)
2. Import and add to resources in `src/i18n/index.js`
3. Add to availableLanguages in `src/components/Navbar.jsx`

```javascript
// src/i18n/locales/ja.json
{
  "nav": {
    "home": "ホーム"
  }
}
```

### Adding New Pages
1. Create component in `src/pages/`
2. Add route in `src/App.jsx`
3. Add navigation in `src/components/Navbar.jsx`

### Custom Styling
- Modify `tailwind.config.js` to customize theme
- Add global styles in `src/index.css`

## 🐛 Common Issues

### Q: Development server fails to start?
A: Ensure Node.js version >= 18 and run `pnpm install`

### Q: Warnings during build?
A: Package size warnings are normal and can be ignored or optimized with dynamic imports

### Q: GitHub Pages deployment fails?
A: Check GitHub repository Pages settings and ensure source is set to "GitHub Actions"

## 📞 Support

- View complete documentation: `README-React.md`
- Original project: https://github.com/OpenAiTx/OpenAiTx
- Submit issues: Report in GitHub Issues

---

🎉 **Congratulations! Your React version is ready!** 