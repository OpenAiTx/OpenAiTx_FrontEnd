/**
 * Content Security Policy (CSP) 配置
 * 用於防止 XSS 攻擊和其他安全威脅
 * 專為 GitHub Pages 部署優化
 */

// 開發環境和生產環境的 CSP 配置
const CSP_CONFIG = {
  // 開發環境配置（較寬鬆，允許 unsafe-inline 和 unsafe-eval）
  development: {
    'default-src': ["'self'"],
    'script-src': [
      "'self'", 
      "'unsafe-inline'", 
      "'unsafe-eval'", // Vite 開發模式需要
      "blob:" // 用於動態導入
    ],
    'style-src': [
      "'self'", 
      "'unsafe-inline'", // React 和 CSS-in-JS 需要
      "https://fonts.googleapis.com"
    ],
    'font-src': [
      "'self'", 
      "https://fonts.gstatic.com",
      "data:" // 用於內嵌字體
    ],
    'img-src': [
      "'self'", 
      "data:", 
      "https:", 
      "blob:",
      "https://img.shields.io", // Badge 圖片
      "https://raw.githubusercontent.com" // GitHub 原始內容
    ],
    'connect-src': [
      "'self'",
      "https://api.github.com", // GitHub API
      "https://raw.githubusercontent.com", // GitHub 原始內容
      "https://openaitx.com", // 專案 API
      "https://img.shields.io", // Badge 服務
      "ws://localhost:*", // Vite HMR WebSocket
      "wss://localhost:*" // 安全 WebSocket
    ],
    'media-src': ["'self'", "data:", "https:"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'", "https://openaitx.com"],
    'frame-ancestors': ["'none'"],
    'upgrade-insecure-requests': []
  },

  // GitHub Pages 生產環境配置（針對靜態部署優化）
  production: {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'unsafe-inline'", // GitHub Pages 需要，因為無法使用 nonce
      // 移除 unsafe-eval 以提高安全性
    ],
    'style-src': [
      "'self'", 
      "'unsafe-inline'", // CSS-in-JS 和 Tailwind 需要
      "https://fonts.googleapis.com"
    ],
    'font-src': [
      "'self'", 
      "https://fonts.gstatic.com"
    ],
    'img-src': [
      "'self'", 
      "data:", 
      "https:",
      "https://img.shields.io", // Badge 服務
      "https://raw.githubusercontent.com", // GitHub 原始內容
      "https://openaitx.github.io", // GitHub Pages 域名
      "https://*.github.io" // 其他 GitHub Pages 域名（如果需要）
    ],
    'connect-src': [
      "'self'",
      "https://api.github.com", // GitHub API
      "https://raw.githubusercontent.com", // GitHub 原始內容
      "https://openaitx.com", // 專案 API
      "https://img.shields.io", // Badge 服務
      "https://openaitx.github.io" // GitHub Pages 域名
    ],
    'media-src': ["'self'", "data:", "https:"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'", "https://openaitx.com"],
    'frame-ancestors': ["'none'"],
    'upgrade-insecure-requests': []
  },

  // GitHub Pages 特殊配置（如果需要更寬鬆的設定）
  'github-pages': {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'unsafe-inline'", // GitHub Pages 靜態部署必需
      "https://openaitx.github.io", // 明確允許自己的域名
      "https://*.github.io" // 允許其他 GitHub Pages 域名
    ],
    'style-src': [
      "'self'", 
      "'unsafe-inline'", // 靜態 CSS 需要
      "https://fonts.googleapis.com",
      "https://openaitx.github.io"
    ],
    'font-src': [
      "'self'", 
      "https://fonts.gstatic.com",
      "https://openaitx.github.io"
    ],
    'img-src': [
      "'self'", 
      "data:", 
      "https:",
      "https://img.shields.io",
      "https://raw.githubusercontent.com",
      "https://openaitx.github.io",
      "https://*.github.io",
      "https://github.com" // GitHub 圖片
    ],
    'connect-src': [
      "'self'",
      "https://api.github.com",
      "https://raw.githubusercontent.com",
      "https://openaitx.com",
      "https://img.shields.io",
      "https://openaitx.github.io",
      "https://*.github.io"
    ],
    'media-src': ["'self'", "data:", "https:"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'", "https://openaitx.com"],
    'frame-ancestors': ["'none'"],
    'upgrade-insecure-requests': []
  }
};

/**
 * 生成 CSP 字符串
 * @param {string} env - 環境類型 ('development' | 'production' | 'github-pages')
 * @returns {string} CSP 字符串
 */
export const generateCSP = (env = 'development') => {
  const config = CSP_CONFIG[env] || CSP_CONFIG.development;
  
  return Object.entries(config)
    .map(([directive, sources]) => {
      if (sources.length === 0) {
        return directive;
      }
      return `${directive} ${sources.join(' ')}`;
    })
    .join('; ');
};

/**
 * 獲取額外的安全標頭
 * @param {boolean} isGitHubPages - 是否為 GitHub Pages 部署
 * @returns {Object} 安全標頭對象
 */
export const getSecurityHeaders = (isGitHubPages = false) => {
  const baseHeaders = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin'
  };

  if (isGitHubPages) {
    // GitHub Pages 特定的標頭調整
    return {
      ...baseHeaders,
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
      // 不包含 HSTS，因為 GitHub Pages 已經處理
    };
  }

  return {
    ...baseHeaders,
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
  };
};

/**
 * 驗證 CSP 配置
 * @param {string} env - 環境類型
 * @returns {boolean} 配置是否有效
 */
export const validateCSPConfig = (env = 'development') => {
  const config = CSP_CONFIG[env];
  if (!config) {
    console.warn(`CSP 配置不存在於環境: ${env}`);
    return false;
  }

  // 檢查必需的指令
  const requiredDirectives = ['default-src', 'script-src', 'style-src', 'object-src'];
  for (const directive of requiredDirectives) {
    if (!config[directive]) {
      console.warn(`缺少必需的 CSP 指令: ${directive}`);
      return false;
    }
  }

  return true;
};

/**
 * 記錄 CSP 違規（用於開發調試）
 */
export const logCSPViolation = (violationEvent) => {
  console.group('🚨 CSP 違規報告');
  console.log('被阻止的 URI:', violationEvent.blockedURI);
  console.log('違規指令:', violationEvent.violatedDirective);
  console.log('原始政策:', violationEvent.originalPolicy);
  console.log('來源文件:', violationEvent.sourceFile);
  console.log('行號:', violationEvent.lineNumber);
  console.groupEnd();
};

/**
 * 檢測是否為 GitHub Pages 環境
 * @returns {boolean} 是否為 GitHub Pages
 */
export const isGitHubPages = () => {
  if (typeof window === 'undefined') return false;
  
  const hostname = window.location.hostname;
  return hostname.endsWith('.github.io') || hostname === 'github.io';
};

/**
 * 獲取適合當前環境的 CSP 配置
 * @returns {string} 適合的環境類型
 */
export const getEnvironmentType = () => {
  if (import.meta.env.DEV) {
    return 'development';
  }
  
  if (isGitHubPages()) {
    return 'github-pages';
  }
  
  return 'production';
};

// 在開發環境中設置 CSP 違規監聽器
if (import.meta.env.DEV) {
  document.addEventListener('securitypolicyviolation', logCSPViolation);
}

export default CSP_CONFIG; 