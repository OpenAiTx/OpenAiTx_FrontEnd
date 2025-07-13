/**
 * Content Security Policy (CSP) Configuration
 * Used to prevent XSS attacks and other security threats
 * Optimized for GitHub Pages deployment
 */

// CSP configuration for development and production environments
const CSP_CONFIG = {
  // Development environment configuration (more permissive, allows unsafe-inline and unsafe-eval)
  development: {
    'default-src': ["'self'"],
    'script-src': [
      "'self'", 
      "'unsafe-inline'", 
      "'unsafe-eval'", // Required for Vite development mode
      "blob:" // For dynamic imports
    ],
    'style-src': [
      "'self'", 
      "'unsafe-inline'" // Required for React and CSS-in-JS
    ],
    'font-src': [
      "'self'", 
      "data:" // For embedded fonts
    ],
    'img-src': [
      "'self'", 
      "data:", 
      "https:", 
      "blob:",
      "https://img.shields.io", // Badge images
      "https://raw.githubusercontent.com" // GitHub raw content
    ],
    'connect-src': [
      "'self'",
      "https://api.github.com", // GitHub API
      "https://raw.githubusercontent.com", // GitHub raw content
      "https://openaitx.com", // Project API
      "https://img.shields.io", // Badge service
      "ws://localhost:*", // Vite HMR WebSocket
      "wss://localhost:*" // Secure WebSocket
    ],
    'media-src': ["'self'", "data:", "https:"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'", "https://openaitx.com"],
    // Note: frame-ancestors and X-Frame-Options cannot be used in meta tags
    // These security headers can only be set in HTTP response headers, GitHub Pages doesn't support custom response headers
    // Therefore, clickjacking attacks cannot be completely prevented on GitHub Pages
    'upgrade-insecure-requests': []
  },

  // GitHub Pages production environment configuration (optimized for static deployment)
  production: {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'unsafe-inline'", // Required for GitHub Pages since nonce cannot be used
      // Remove unsafe-eval for improved security
    ],
    'style-src': [
      "'self'", 
      "'unsafe-inline'" // Required for CSS-in-JS and Tailwind
    ],
    'font-src': [
      "'self'"
    ],
    'img-src': [
      "'self'", 
      "data:", 
      "https:",
      "https://img.shields.io", // Badge service
      "https://raw.githubusercontent.com", // GitHub raw content
      "https://openaitx.github.io", // GitHub Pages domain
      "https://*.github.io" // Other GitHub Pages domains (if needed)
    ],
    'connect-src': [
      "'self'",
      "https://api.github.com", // GitHub API
      "https://raw.githubusercontent.com", // GitHub raw content
      "https://openaitx.com", // Project API
      "https://img.shields.io", // Badge service
      "https://openaitx.github.io" // GitHub Pages domain
    ],
    'media-src': ["'self'", "data:", "https:"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'", "https://openaitx.com"],
    // Note: frame-ancestors and X-Frame-Options cannot be used in meta tags
    // These security headers can only be set in HTTP response headers, GitHub Pages doesn't support custom response headers
    // Therefore, clickjacking attacks cannot be completely prevented on GitHub Pages
    'upgrade-insecure-requests': []
  },

  // GitHub Pages special configuration (if more permissive settings are needed)
  'github-pages': {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'unsafe-inline'", // Required for GitHub Pages static deployment
      "https://openaitx.github.io", // Explicitly allow own domain
      "https://*.github.io" // Allow other GitHub Pages domains
    ],
    'style-src': [
      "'self'", 
      "'unsafe-inline'", // Required for static CSS
      "https://openaitx.github.io"
    ],
    'font-src': [
      "'self'", 
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
      "https://github.com" // GitHub images
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
    // Note: frame-ancestors and X-Frame-Options cannot be used in meta tags
    // These security headers can only be set in HTTP response headers, GitHub Pages doesn't support custom response headers
    // Therefore, clickjacking attacks cannot be completely prevented on GitHub Pages
    'upgrade-insecure-requests': []
  }
};

/**
 * Generate CSP string
 * @param {string} env - Environment type ('development' | 'production' | 'github-pages')
 * @returns {string} CSP string
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
 * Get additional security headers
 * Note: These headers are only effective in development environment Vite server, GitHub Pages doesn't support custom response headers
 * @param {boolean} isGitHubPages - Whether it's a GitHub Pages deployment
 * @returns {Object} Security headers object
 */
export const getSecurityHeaders = (isGitHubPages = false) => {
  const baseHeaders = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY', // Only effective in development environment, GitHub Pages doesn't support
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin'
  };

  if (isGitHubPages) {
    // GitHub Pages specific header adjustments
    return {
      ...baseHeaders,
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
      // Don't include HSTS as GitHub Pages already handles it
    };
  }

  return {
    ...baseHeaders,
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
  };
};

/**
 * Validate CSP configuration
 * @param {string} env - Environment type
 * @returns {boolean} Whether the configuration is valid
 */
export const validateCSPConfig = (env = 'development') => {
  const config = CSP_CONFIG[env];
  if (!config) {
    console.warn(`CSP configuration does not exist for environment: ${env}`);
    return false;
  }

  // Check required directives
  const requiredDirectives = ['default-src', 'script-src', 'style-src', 'object-src'];
  for (const directive of requiredDirectives) {
    if (!config[directive]) {
      console.warn(`Missing required CSP directive: ${directive}`);
      return false;
    }
  }

  return true;
};

/**
 * Log CSP violations (for development debugging)
 */
export const logCSPViolation = (violationEvent) => {
  console.group('🚨 CSP Violation Report');
  console.log('Blocked URI:', violationEvent.blockedURI);
  console.log('Violated Directive:', violationEvent.violatedDirective);
  console.log('Original Policy:', violationEvent.originalPolicy);
  console.log('Source File:', violationEvent.sourceFile);
  console.log('Line Number:', violationEvent.lineNumber);
  console.groupEnd();
};

/**
 * Detect if running in GitHub Pages environment
 * @returns {boolean} Whether it's GitHub Pages
 */
export const isGitHubPages = () => {
  if (typeof window === 'undefined') return false;
  
  const hostname = window.location.hostname;
  return hostname.endsWith('.github.io') || hostname === 'github.io';
};

/**
 * Get appropriate CSP configuration for current environment
 * @returns {string} Appropriate environment type
 */
export const getEnvironmentType = () => {
  // Check if we're in a browser environment first
  if (typeof window !== 'undefined') {
    if (isGitHubPages()) {
      return 'github-pages';
    }
  }
  
  // Check if import.meta.env is available and has DEV property
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV) {
    return 'development';
  }
  
  return 'production';
};

// Set up CSP violation listener in development environment
if (typeof document !== 'undefined' && typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV) {
  document.addEventListener('securitypolicyviolation', logCSPViolation);
}

export default CSP_CONFIG; 