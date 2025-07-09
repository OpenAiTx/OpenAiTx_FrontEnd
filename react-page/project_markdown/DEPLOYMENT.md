# OpenAITx React Page Deployment Guide

## 🚀 Quick Deployment

### 1. Prepare Build
```bash
# Run deployment preparation script
./deploy.sh
```

### 2. Manual Build (Optional)
```bash
# Install dependencies
pnpm install

# Build project
pnpm run build
```

## 📁 Deploy to GitHub Pages

### Step 1: Prepare Target Repository
1. Create or prepare a GitHub repository for deployment
2. Ensure the repository has GitHub Pages enabled
3. Configure GitHub Pages to deploy from `root` or `docs/` folder

### Step 2: Copy Build Files
1. After build completion, the `dist/` folder will contain all static files
2. Copy **all contents** from the `dist/` folder to the target repository
3. Ensure the following files are included:
   - `index.html` - Main page
   - `404.html` - Routing support
   - `assets/` - Static assets folder

### Step 3: Deploy
```bash
# In the target repository
git add .
git commit -m "Deploy OpenAITx React App"
git push origin main
```

## 🔧 Configuration Details

### Vite Configuration Features
- ✅ Uses relative paths (`base: './'`)
- ✅ Supports any deployment environment
- ✅ Optimized build output
- ✅ Hash routing support

### Routing Support
- Uses `404.html` to handle client-side routing
- Supports direct access to any route URL
- Compatible with GitHub Pages routing limitations

## 🌐 Deployment Environments

### Testing Environment
- Can be deployed to any service supporting static files
- GitHub Pages, Netlify, Vercel, etc.

### Domain Configuration
If using a custom domain, add a `CNAME` file to the target repository root:
```
your-domain.com
```

## 🔍 Deployment Verification

After deployment, check the following functionality:
- [ ] Homepage loads properly
- [ ] Language switching functionality
- [ ] Badge generator functionality
- [ ] Markdown viewer functionality
- [ ] Route navigation works properly
- [ ] All links point to correct domains

## 🐛 Common Issues

### Issue: Page shows 404
**Solution:**
- Ensure `404.html` file exists in the root directory
- Check if GitHub Pages settings are configured correctly

### Issue: Asset files fail to load
**Solution:**
- Confirm `assets/` folder has been copied correctly
- Check if file paths are correct

### Issue: Routing doesn't work
**Solution:**
- Confirm using hash routing (`/#/`)
- Check `404.html` redirect logic

## 📝 Important Notes

1. **File Integrity**: Ensure all files in `dist/` are copied
2. **Path Issues**: Use relative path configuration, suitable for any deployment path
3. **Caching Issues**: File names include hash, automatically handles cache updates
4. **Deployment Time**: GitHub Pages may take a few minutes to update

## 🔄 Update Deployment

When updates are needed:
1. Re-run `./deploy.sh`
2. Copy new `dist/` contents to target repository
3. Commit and push changes 