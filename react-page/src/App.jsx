import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Navbar from './components/Navbar'
import BadgeGenerator from './pages/BadgeGenerator'
import MarkdownViewer from './pages/MarkdownViewer'
import { Toaster } from './components/ui/sonner'

// 重定向組件處理 view.html 到 view 的重定向
const ViewHtmlRedirect = () => {
  const location = useLocation()
  
  // 保持所有查詢參數
  const searchParams = location.search
  
  return <Navigate to={`/view${searchParams}`} replace />
}

// 重定向組件處理 index.html 到根路徑的重定向
const IndexHtmlRedirect = () => {
  const location = useLocation()
  
  // 保持所有查詢參數
  const searchParams = location.search
  
  return <Navigate to={`/${searchParams}`} replace />
}

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    // 從localStorage獲取保存的主題設置
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme) {
      return savedTheme === 'dark'
    }
    // 如果沒有保存的設置，使用系統偏好設置
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })
  const location = useLocation()

  // 處理舊版本 URL 重定向（非 hash 的直接訪問）
  useEffect(() => {
    const handleLegacyUrls = () => {
      const fullUrl = window.location.href
      // eslint-disable-next-line no-undef
      const urlObj = new URL(fullUrl)
      
      // 檢查是否是直接訪問舊格式的 URL（沒有 hash）
      if (!urlObj.hash && urlObj.pathname.includes('view.html')) {
        // 提取查詢參數
        const searchParams = urlObj.search
        // 重定向到 hash router 格式
        window.location.replace(`${urlObj.origin}${urlObj.pathname.replace('view.html', '')}#/view${searchParams}`)
        return
      }
      
      // 檢查是否是直接訪問舊格式的 index.html
      if (!urlObj.hash && urlObj.pathname.includes('index.html')) {
        const searchParams = urlObj.search
        window.location.replace(`${urlObj.origin}${urlObj.pathname.replace('index.html', '')}#/${searchParams}`)
        return
      }
      
      // 處理可能存在的基礎路徑，如 /OpenAiTx.github.io/view.html
      if (!urlObj.hash && urlObj.pathname.endsWith('/view.html')) {
        const searchParams = urlObj.search
        const basePath = urlObj.pathname.replace('/view.html', '')
        window.location.replace(`${urlObj.origin}${basePath}/#/view${searchParams}`)
        return
      }
      
      // 處理 /OpenAiTx.github.io/index.html
      if (!urlObj.hash && urlObj.pathname.endsWith('/index.html')) {
        const searchParams = urlObj.search
        const basePath = urlObj.pathname.replace('/index.html', '')
        window.location.replace(`${urlObj.origin}${basePath}/#/${searchParams}`)
        return
      }
    }

    // 只在初始加載時執行一次
    handleLegacyUrls()
  }, [])

  // 初始化主題
  useEffect(() => {
    // 立即應用主題，避免閃爍
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [darkMode])

  // 監聽系統主題變化
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e) => {
      // 只有在沒有手動設置主題時才跟隨系統主題
      if (!localStorage.getItem('theme')) {
        setDarkMode(e.matches)
      }
    }
    
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  // 頁面轉場動畫配置
  const pageVariants = {
    initial: {
      opacity: 0,
      y: 20,
      scale: 0.98
    },
    in: {
      opacity: 1,
      y: 0,
      scale: 1
    },
    out: {
      opacity: 0,
      y: -20,
      scale: 0.98
    }
  }

  const pageTransition = {
    type: "tween",
    ease: "anticipate",
    duration: 0.4
  }

  return (
    <motion.div 
      className={`min-h-screen bg-background transition-colors duration-200`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />
      </motion.div>
      
      <main className="container mx-auto px-4 py-8 pt-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
          >
            <Routes location={location}>
              <Route path="/" element={<BadgeGenerator />} />
              <Route path="/view" element={<MarkdownViewer />} />
              {/* 向後兼容性：重定向舊的 HTML 路徑 */}
              <Route path="/view.html" element={<ViewHtmlRedirect />} />
              <Route path="/index.html" element={<IndexHtmlRedirect />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>

      <motion.footer 
        className="mt-16 border-t border-border bg-background"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">
          <p className="text-sm">
            Powered by{' '}
            <a 
              href="https://github.com/OpenAiTx/OpenAiTx" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-foreground hover:text-primary transition-colors font-medium"
            >
              OpenAITx
            </a>
          </p>
        </div>
      </motion.footer>
      <Toaster />
    </motion.div>
  )
}

export default App 