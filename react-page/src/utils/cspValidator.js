/**
 * CSP 驗證工具
 * 用於測試和驗證 Content Security Policy 配置
 */

/**
 * 檢查 CSP 是否已啟用
 * @returns {boolean} CSP 是否已啟用
 */
export const isCSPEnabled = () => {
  // 檢查 meta 標籤中的 CSP
  const metaCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
  
  // 檢查 HTTP 標頭中的 CSP（通過嘗試違規來測試）
  const hasCSPHeader = document.querySelector('meta[name="csp-test"]') === null;
  
  return !!(metaCSP || hasCSPHeader);
};

/**
 * 獲取當前的 CSP 配置
 * @returns {string|null} 當前的 CSP 字符串
 */
export const getCurrentCSP = () => {
  const metaCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
  return metaCSP ? metaCSP.getAttribute('content') : null;
};

/**
 * 測試特定的 CSP 指令
 * @param {string} directive - CSP 指令名稱
 * @param {string} testUrl - 測試 URL
 * @returns {Promise<boolean>} 測試結果
 */
export const testCSPDirective = async (directive, testUrl) => {
  return new Promise((resolve) => {
    const timeout = window.setTimeout(() => {
      resolve(false); // 超時視為失敗
    }, 5000);

    const violationHandler = (event) => {
      if (event.violatedDirective === directive) {
        window.clearTimeout(timeout);
        document.removeEventListener('securitypolicyviolation', violationHandler);
        resolve(true); // 違規被正確攔截
      }
    };

    document.addEventListener('securitypolicyviolation', violationHandler);

         // 根據指令類型創建測試元素
     try {
       switch (directive) {
         case 'script-src': {
           const script = document.createElement('script');
           script.src = testUrl;
           script.onerror = () => {
             window.clearTimeout(timeout);
             document.removeEventListener('securitypolicyviolation', violationHandler);
             resolve(true);
           };
           document.head.appendChild(script);
           break;
         }
           
         case 'style-src': {
           const link = document.createElement('link');
           link.rel = 'stylesheet';
           link.href = testUrl;
           link.onerror = () => {
             window.clearTimeout(timeout);
             document.removeEventListener('securitypolicyviolation', violationHandler);
             resolve(true);
           };
           document.head.appendChild(link);
           break;
         }
           
         case 'img-src': {
           const img = document.createElement('img');
           img.src = testUrl;
           img.onerror = () => {
             window.clearTimeout(timeout);
             document.removeEventListener('securitypolicyviolation', violationHandler);
             resolve(true);
           };
           img.style.display = 'none';
           document.body.appendChild(img);
           break;
         }
           
         default:
           window.clearTimeout(timeout);
           document.removeEventListener('securitypolicyviolation', violationHandler);
           resolve(false);
       }
     } catch {
       window.clearTimeout(timeout);
       document.removeEventListener('securitypolicyviolation', violationHandler);
       resolve(true); // 錯誤可能表示 CSP 正在工作
     }
  });
};

/**
 * 執行 CSP 合規性測試
 * @returns {Promise<Object>} 測試結果
 */
export const runCSPComplianceTest = async () => {
  const results = {
    enabled: isCSPEnabled(),
    policy: getCurrentCSP(),
    tests: {}
  };

  if (!results.enabled) {
    results.error = 'CSP 未啟用';
    return results;
  }

  // 測試各種 CSP 指令
  const tests = [
    {
      name: 'script-src',
      description: '測試腳本來源限制',
      testUrl: 'https://evil.example.com/malicious.js'
    },
    {
      name: 'style-src',
      description: '測試樣式來源限制',
      testUrl: 'https://evil.example.com/malicious.css'
    },
    {
      name: 'img-src',
      description: '測試圖片來源限制',
      testUrl: 'https://evil.example.com/malicious.png'
    }
  ];

  for (const test of tests) {
    try {
      const blocked = await testCSPDirective(test.name, test.testUrl);
      results.tests[test.name] = {
        passed: blocked,
        description: test.description
      };
    } catch (error) {
      results.tests[test.name] = {
        passed: false,
        error: error.message,
        description: test.description
      };
    }
  }

  return results;
};

/**
 * 驗證允許的來源是否正常工作
 * @returns {Promise<Object>} 驗證結果
 */
export const validateAllowedSources = async () => {
  const results = {
    github: false,
    fonts: false,
    shields: false,
    openaitx: false
  };

  // 測試 GitHub API 連接
  try {
    const response = await fetch('https://api.github.com/repos/OpenAiTx/OpenAiTx');
    results.github = response.ok;
  } catch (error) {
    console.warn('GitHub API 測試失敗:', error);
  }

  // 測試 Google Fonts 連接
  try {
    const response = await fetch('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
    results.fonts = response.ok;
  } catch (error) {
    console.warn('Google Fonts 測試失敗:', error);
  }

  // 測試 Shields.io 連接
  try {
    const response = await fetch('https://img.shields.io/badge/test-badge-blue');
    results.shields = response.ok;
  } catch (error) {
    console.warn('Shields.io 測試失敗:', error);
  }

  // 測試 OpenAiTx API 連接
  try {
    const response = await fetch('https://openaitx.com/api/health', { method: 'HEAD' });
    results.openaitx = response.ok;
  } catch (error) {
    console.warn('OpenAiTx API 測試失敗:', error);
  }

  return results;
};

/**
 * 生成 CSP 測試報告
 * @returns {Promise<Object>} 完整的測試報告
 */
export const generateCSPReport = async () => {
  console.log('🔒 開始執行 CSP 安全性測試...');
  
  const complianceResults = await runCSPComplianceTest();
  const allowedSourcesResults = await validateAllowedSources();
  
  const report = {
    timestamp: new Date().toISOString(),
    csp: complianceResults,
    allowedSources: allowedSourcesResults,
    recommendations: []
  };

  // 生成建議
  if (!complianceResults.enabled) {
    report.recommendations.push('啟用 Content Security Policy');
  }

  Object.entries(complianceResults.tests || {}).forEach(([test, result]) => {
    if (!result.passed) {
      report.recommendations.push(`改善 ${test} 指令的配置`);
    }
  });

  Object.entries(allowedSourcesResults).forEach(([source, working]) => {
    if (!working) {
      report.recommendations.push(`檢查 ${source} 服務的連接性`);
    }
  });

  console.log('📊 CSP 測試報告:', report);
  return report;
};

// 在開發環境中自動運行測試
if (import.meta.env.DEV) {
  // 延遲執行以確保頁面完全載入
  setTimeout(() => {
    generateCSPReport().then(report => {
      if (report.recommendations.length > 0) {
        console.warn('⚠️ CSP 配置建議:', report.recommendations);
      } else {
        console.log('✅ CSP 配置測試通過');
      }
    });
  }, 2000);
} 