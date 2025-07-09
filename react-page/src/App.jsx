import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Navbar from './components/Navbar'
import BadgeGenerator from './pages/BadgeGenerator'
import MarkdownViewer from './pages/MarkdownViewer'
import { Toaster } from './components/ui/sonner'

// Redirect component handling view.html to view redirection
const ViewHtmlRedirect = () => {
  const location = useLocation()
  
  // Keep all query parameters
  const searchParams = location.search
  
  return <Navigate to={`/view${searchParams}`} replace />
}

// Redirect component handling index.html to root path redirection
const IndexHtmlRedirect = () => {
  const location = useLocation()
  
  // Keep all query parameters
  const searchParams = location.search
  
  return <Navigate to={`/${searchParams}`} replace />
}

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    // Get saved theme setting from localStorage
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme) {
      return savedTheme === 'dark'
    }
    // If no saved setting, use system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })
  const location = useLocation()

  // Handle legacy URL redirection (direct access without hash)
  useEffect(() => {
    const handleLegacyUrls = () => {
      const fullUrl = window.location.href
      // eslint-disable-next-line no-undef
      const urlObj = new URL(fullUrl)
      
      // Check if it's direct access to legacy format URL (without hash)
      if (!urlObj.hash && urlObj.pathname.includes('view.html')) {
        // Extract query parameters
        const searchParams = urlObj.search
        // Redirect to hash router format
        window.location.replace(`${urlObj.origin}${urlObj.pathname.replace('view.html', '')}#/view${searchParams}`)
        return
      }
      
      // Check if it's direct access to legacy format index.html
      if (!urlObj.hash && urlObj.pathname.includes('index.html')) {
        const searchParams = urlObj.search
        window.location.replace(`${urlObj.origin}${urlObj.pathname.replace('index.html', '')}#/${searchParams}`)
        return
      }
      
      // Handle possible base path, like /OpenAiTx.github.io/view.html
      if (!urlObj.hash && urlObj.pathname.endsWith('/view.html')) {
        const searchParams = urlObj.search
        const basePath = urlObj.pathname.replace('/view.html', '')
        window.location.replace(`${urlObj.origin}${basePath}/#/view${searchParams}`)
        return
      }
      
      // Handle /OpenAiTx.github.io/index.html
      if (!urlObj.hash && urlObj.pathname.endsWith('/index.html')) {
        const searchParams = urlObj.search
        const basePath = urlObj.pathname.replace('/index.html', '')
        window.location.replace(`${urlObj.origin}${basePath}/#/${searchParams}`)
        return
      }
    }

    // Execute only once on initial load
    handleLegacyUrls()
  }, [])

  // Initialize theme
  useEffect(() => {
    // Apply theme immediately to avoid flickering
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

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e) => {
      // Only follow system theme when no manual theme setting exists
      if (!localStorage.getItem('theme')) {
        setDarkMode(e.matches)
      }
    }
    
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  // Page transition animation configuration
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
              {/* Backward compatibility: redirect legacy HTML paths */}
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