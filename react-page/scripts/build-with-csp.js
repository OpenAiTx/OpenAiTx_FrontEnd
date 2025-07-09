#!/usr/bin/env node

/**
 * Build script: Automatically apply CSP configuration to production environment
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// GitHub Pages production environment CSP configuration
// Note: frame-ancestors directive cannot be used in meta tags, use X-Frame-Options header instead
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
upgrade-insecure-requests;
`.replace(/\s+/g, ' ').trim();

/**
 * Update CSP configuration in index.html
 */
function updateIndexHtmlCSP() {
  const indexPath = path.join(projectRoot, 'dist', 'index.html');
  
  if (!fs.existsSync(indexPath)) {
    throw new Error('Cannot find dist/index.html file, please run build first');
  }

  let content = fs.readFileSync(indexPath, 'utf-8');
  
  // Find and replace CSP meta tag
  const cspRegex = /<meta\s+http-equiv="Content-Security-Policy"\s+content="[^"]*"\s*>/i;
  const newCSPTag = `<meta http-equiv="Content-Security-Policy" content="${PRODUCTION_CSP}">`;
  
  if (cspRegex.test(content)) {
    content = content.replace(cspRegex, newCSPTag);
    console.log('✅ Updated CSP configuration in index.html');
  } else {
    // If CSP tag not found, add it to head
    const headRegex = /<head>/i;
    if (headRegex.test(content)) {
      content = content.replace(headRegex, `<head>\n    ${newCSPTag}`);
      console.log('✅ Added CSP configuration to index.html');
    } else {
      console.warn('⚠️ Cannot find <head> tag in index.html');
    }
  }
  
  fs.writeFileSync(indexPath, content, 'utf-8');
}

/**
 * Create .htaccess file (for Apache server)
 */
function createHtaccess() {
  const htaccessPath = path.join(projectRoot, 'dist', '.htaccess');
  
  const htaccessContent = `
# Security headers configuration
<IfModule mod_headers.c>
    # Content Security Policy
    Header always set Content-Security-Policy "${PRODUCTION_CSP}"
    
    # Other security headers
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-Frame-Options "DENY"
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
    Header always set Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=()"
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
</IfModule>

# Cache configuration
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

# GZIP compression
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

# Single page application routing support
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
  console.log('✅ Created .htaccess file');
}

/**
 * Create _headers file (for Netlify)
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
  console.log('✅ Created _headers file (Netlify)');
}

/**
 * Create vercel.json file (for Vercel)
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
  console.log('✅ Created vercel.json file');
}

/**
 * Validate build results
 */
function validateBuild() {
  const distPath = path.join(projectRoot, 'dist');
  const indexPath = path.join(distPath, 'index.html');
  
  if (!fs.existsSync(distPath)) {
    throw new Error('Build directory does not exist');
  }
  
  if (!fs.existsSync(indexPath)) {
    throw new Error('index.html file does not exist');
  }
  
  const content = fs.readFileSync(indexPath, 'utf-8');
  
  // Validate CSP exists
  if (!content.includes('Content-Security-Policy')) {
    throw new Error('CSP configuration not found');
  }
  
  // Validate key CSP directives
  const requiredDirectives = ['default-src', 'script-src', 'style-src', 'object-src'];
  for (const directive of requiredDirectives) {
    if (!content.includes(directive)) {
      throw new Error(`Missing required CSP directive: ${directive}`);
    }
  }
  
  console.log('✅ Build validation passed');
}

/**
 * Main function
 */
function main() {
  try {
    console.log('🚀 Starting production build...');
    
    // Execute Vite build
    console.log('📦 Running Vite build...');
    execSync('npm run build', { 
      cwd: projectRoot,
      stdio: 'inherit'
    });
    
    // Update CSP configuration
    console.log('🔒 Configuring security headers...');
    updateIndexHtmlCSP();
    
    // Create platform-specific configuration files
    console.log('📄 Creating platform configuration files...');
    createHtaccess();
    createNetlifyHeaders();
    createVercelConfig();
    
    // Validate build results
    console.log('✅ Validating build results...');
    validateBuild();
    
    console.log('🎉 Build completed! Production CSP configuration applied');
    console.log('📁 Build files located in dist/ directory');
    
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

// If running this script directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main, updateIndexHtmlCSP, createHtaccess, createNetlifyHeaders, createVercelConfig }; 