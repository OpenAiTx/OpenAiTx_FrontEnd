import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { marked } from 'marked'
import hljs from 'highlight.js'
// import 'highlight.js/styles/github.css' // 移除預設樣式，使用自定義樣式
import '../styles/markdown.css'
import { useTranslation } from 'react-i18next'
import TableOfContents from '../components/TableOfContents'
import { toast } from 'sonner'
import { convertEmojis } from '../lib/emojiUtils'
import DOMPurify from 'dompurify'

// Markdown 內容緩存
const markdownCache = new Map()

const MarkdownViewer = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [languageLoading, setLanguageLoading] = useState(false) // 語言切換時的 loading 狀態
  const [error, setError] = useState(null)
  const [showSubmitButton, setShowSubmitButton] = useState(false)
  const [tocOpen, setTocOpen] = useState(false)
  const { t: contextT, i18n } = useTranslation()
  
  // 用於追蹤重新高亮的 ref
  const rehighlightTimeoutRef = useRef(null)
  const observerRef = useRef(null)
  const mutationObserverRef = useRef(null)
  const previousLangRef = useRef(null)

  const user = searchParams.get('user')
  const project = searchParams.get('project')
  const urlLang = searchParams.get('lang') || 'en'

  // 同步 URL 參數中的 lang 與系統當前語言
  useEffect(() => {
    // 當 URL 中的 lang 參數與當前系統語言不同時，更新系統語言
    if (urlLang !== i18n.language) {
      i18n.changeLanguage(urlLang)
    }
  }, [urlLang, i18n])

  // 監聽系統語言變化，同步到 URL
  useEffect(() => {
    const handleLanguageChange = (lng) => {
      // 檢查當前語言是否與 URL 參數不同
      if (lng !== searchParams.get('lang')) {
        // 手動構建新的查詢字符串
        const params = {}
        searchParams.forEach((value, key) => {
          params[key] = value
        })
        params.lang = lng
        
        // 構建新的查詢字符串
        const queryString = Object.entries(params)
          .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
          .join('&')
        
        setSearchParams(queryString, { replace: true })
      }
    }

    // 監聽 i18next 語言變化事件
    i18n.on('languageChanged', handleLanguageChange)

    // 清理事件監聽器
    return () => {
      i18n.off('languageChanged', handleLanguageChange)
    }
  }, [searchParams, setSearchParams, i18n])

  // Header component to avoid duplication
  const PageHeader = ({ user, project }) => (
    <motion.header 
      className="text-center p-5"
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {user && project && (
        <motion.div 
          className="my-4 flex flex-col md:flex-row gap-4 md:gap-8 justify-center items-center" 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.2 }}
        >
          <div className="text-muted-foreground text-2xl text-center md:text-left">
            {contextT('badge.githubUser')}: <span className="text-foreground font-medium">{user}</span>
          </div>
          <div className="text-muted-foreground text-2xl text-center md:text-left">
            {contextT('badge.projectName')}: <span className="text-foreground font-medium">{project}</span>
          </div>
        </motion.div>
      )}
    </motion.header>
  )

  // Container component to avoid duplication
  const PageContainer = ({ children }) => (
    <div className="font-sans leading-6 text-foreground m-0 p-0 bg-background flex flex-col min-h-screen">
      {children}
    </div>
  )

  // Content wrapper component
  const ContentWrapper = ({ children }) => (
    <div className="mx-auto w-full">
      {children}
    </div>
  )

  const handleSubmit = async () => {
    try {
      const response = await fetch('https://openaitx.com/api/submit-project', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project: `https://github.com/${user}/${project}`
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`)
      }

      toast.success(contextT('viewer.submissionCompleted'))
    } catch (error) {
      toast.error(`${contextT('viewer.submissionFailed')}${error.message}`)
    }
  }

  // 強化的重新高亮代碼函數
  const rehighlightCode = useCallback(() => {
    // 清除之前的 timeout
    if (rehighlightTimeoutRef.current) {
      window.clearTimeout(rehighlightTimeoutRef.current)
    }

    rehighlightTimeoutRef.current = window.setTimeout(() => {
      const codeBlocks = document.querySelectorAll('.markdown-body pre code')
      
      codeBlocks.forEach((block) => {
        try {
          // 保存原始內容
          const originalText = block.textContent || block.innerText
          
          // 清除之前的高亮狀態和類名
          if (block.dataset.highlighted) {
            delete block.dataset.highlighted
          }
          
          // 重置類名，保留語言類
          const languageClass = Array.from(block.classList).find(cls => cls.startsWith('language-'))
          block.className = languageClass || ''
          
          // 重置內容為純文本
          block.textContent = originalText
          
          // 重新高亮
          hljs.highlightElement(block)
          
          // 強制重新應用樣式
          block.style.display = 'none'
          block.offsetHeight // 觸發重排
          block.style.display = ''
        } catch (e) {
          console.warn('Code highlighting failed for block:', e)
        }
      })
    }, 50) // 減少延遲時間
  }, [])

  // 設置 ResizeObserver 來監聽版面變化
  useEffect(() => {
    if (!content) return

    // 清理之前的 observer
    if (observerRef.current) {
      observerRef.current.disconnect()
    }

    // 創建新的 ResizeObserver
    if (window.ResizeObserver) {
      observerRef.current = new window.ResizeObserver(() => {
        // 防抖處理
        if (rehighlightTimeoutRef.current) {
          window.clearTimeout(rehighlightTimeoutRef.current)
        }
        
        rehighlightTimeoutRef.current = window.setTimeout(() => {
          rehighlightCode()
        }, 100)
      })

      // 觀察主要內容區域
      const mainContent = document.querySelector('.markdown-body')
      if (mainContent) {
        observerRef.current.observe(mainContent)
      }

      // 觀察整個文檔
      observerRef.current.observe(document.body)
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [content, rehighlightCode])

  // 強化的 sidebar 狀態變化監聽
  useEffect(() => {
    if (content) {
      // 立即重新高亮一次
      rehighlightCode()
      
      // 在動畫期間持續重新高亮
      const intervals = [50, 100, 200, 300, 400] // 多個時間點
      const timeouts = intervals.map(delay => 
        window.setTimeout(() => {
          rehighlightCode()
        }, delay)
      )

      return () => {
        timeouts.forEach(timeout => window.clearTimeout(timeout))
      }
    }
  }, [tocOpen, content, rehighlightCode])

  // 監聽語言變化並顯示 loading
  useEffect(() => {
    if (previousLangRef.current && previousLangRef.current !== urlLang && content) {
      setLanguageLoading(true)
    }
    previousLangRef.current = urlLang
  }, [urlLang, content])

  useEffect(() => {
    // 配置 marked 選項，增加安全性
    marked.setOptions({
      highlight: function(code, lang) {
        if (lang && hljs.getLanguage(lang)) {
          try {
            return hljs.highlight(code, { language: lang }).value
          } catch (e) {
            console.error(e)
          }
        }
        return hljs.highlightAuto(code).value
      },
      breaks: true,
      gfm: true,
      sanitize: false, // 我們將使用 DOMPurify 來清理
      silent: true // 靜默錯誤以避免控制台警告
    })

    // Validate required parameters
    if (!user || !project) {
      setError({
        type: 'missingParams',
        title: contextT('viewer.missingParams'),
        description: contextT('viewer.missingParamsDesc'),
        example: contextT('viewer.missingParamsExample')
      })
      setLoading(false)
      return
    }

    const fetchContent = async () => {
      try {
        // 生成緩存鍵
        const cacheKey = `${user}/${project}/${urlLang}`
        
        // 檢查緩存
        if (markdownCache.has(cacheKey)) {
          const cachedContent = markdownCache.get(cacheKey)
          setContent(cachedContent)
          setLoading(false)
          setLanguageLoading(false)
          
          // 更新頁面標題
          const tempDiv = document.createElement('div')
          tempDiv.innerHTML = cachedContent
          const firstH1 = tempDiv.querySelector('h1')
          if (firstH1) {
            document.title = `${firstH1.textContent} - Open AI Tx`
          }
          
          return
        }
        
        // Check if GitHub repository exists first - exactly like original
        const githubApiUrl = `https://api.github.com/repos/${user}/${project}`
        
        const repoResponse = await fetch(githubApiUrl)
        const repoData = await repoResponse.json()
        
        if (repoData.message === "Not Found") {
          // Repository doesn't exist
          setError({
            type: 'repoNotFound',
            title: contextT('viewer.repoNotFound'),
            description: contextT('viewer.repoNotFoundDesc')
          })
          setLoading(false)
          setLanguageLoading(false)
          return
        }

        // Repository exists, now check if README exists
        const apiUrl = `https://raw.githubusercontent.com/OpenAiTx/OpenAiTx/refs/heads/main/projects/${user}/${project}/README-${urlLang}.md`
        
        const response = await fetch(apiUrl)
        
        if (response.status === 404) {
          // README doesn't exist, show submit button
          setError({
            type: 'docNotFound',
            title: contextT('viewer.docNotFound'),
            description: contextT('viewer.docNotFoundDesc')
          })
          setShowSubmitButton(true)
          setLoading(false)
          setLanguageLoading(false)
          return
        }

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const markdown = await response.text()
        
        // 轉換 emoji
        const markdownWithEmojis = convertEmojis(markdown)
        
        // Render the markdown
        let renderedContent = marked.parse(markdownWithEmojis)
        
        // 使用 DOMPurify 清理 HTML 內容以提高安全性
        renderedContent = DOMPurify.sanitize(renderedContent, {
          ALLOWED_TAGS: [
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            'p', 'br', 'strong', 'em', 'u', 's', 'del', 'ins',
            'a', 'img', 'video', 'audio',
            'ul', 'ol', 'li',
            'blockquote', 'pre', 'code',
            'table', 'thead', 'tbody', 'tr', 'th', 'td',
            'div', 'span',
            'hr',
            'details', 'summary'
          ],
          ALLOWED_ATTR: [
            'href', 'title', 'alt', 'src', 'width', 'height',
            'class', 'id',
            'target', 'rel',
            'controls', 'autoplay', 'loop', 'muted',
            'colspan', 'rowspan',
            'open'
          ],
          ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|data):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i
        })
        
        // 存入緩存
        markdownCache.set(cacheKey, renderedContent)
        
        // 限制緩存大小（最多保存 20 個項目）
        if (markdownCache.size > 20) {
          const firstKey = markdownCache.keys().next().value
          markdownCache.delete(firstKey)
        }
        
        setContent(renderedContent)
        
        // Update page title with the first h1 from the markdown
        const tempDiv = document.createElement('div')
        tempDiv.innerHTML = renderedContent
        const firstH1 = tempDiv.querySelector('h1')
        if (firstH1) {
          document.title = `${firstH1.textContent} - Open AI Tx`
        }
        
        setLoading(false)
        setLanguageLoading(false)
      } catch (error) {
        console.error('Error:', error)
        setError({
          type: 'errorLoading',
          title: contextT('viewer.errorLoading'),
          description: contextT('viewer.errorLoadingDesc'),
          details: error.message
        })
        setLoading(false)
        setLanguageLoading(false)
      }
    }

    fetchContent()
  }, [user, project, urlLang, contextT])

  // Apply syntax highlighting after content is rendered
  useEffect(() => {
    if (content) {
      // 等待DOM更新後再高亮，使用多個時間點確保高亮成功
      const timeouts = [50, 100, 200].map(delay =>
        window.setTimeout(() => {
        rehighlightCode()
        }, delay)
      )

      // 處理第一個區塊中的圖片置中
      const processFirstBlockImages = () => {
        const markdownBody = document.querySelector('.markdown-body')
        if (!markdownBody) return

        // 找到第一個段落或div - 使用更安全的方法
        let firstElement = null
        
        // 嘗試不同的選擇器
        const selectors = [
          'p:first-child',
          'div:first-child',
          'h1:first-child + p',
          'h1:first-child + div'
        ]
        
        for (const selector of selectors) {
          try {
            const element = markdownBody.querySelector(selector)
            if (element) {
              firstElement = element
              break
            }
          } catch (e) {
            console.warn(`Selector "${selector}" failed:`, e)
          }
        }
        
        if (firstElement) {
          const images = firstElement.querySelectorAll('img')
          const textContent = firstElement.textContent?.trim()
          
          // 如果段落只包含圖片（沒有實質文字內容），標記為僅圖片段落
          if (images.length > 0 && (!textContent || textContent.length < 10)) {
            firstElement.setAttribute('data-img-only', 'true')
            firstElement.style.textAlign = 'center'
            
            images.forEach(img => {
              img.style.display = 'block'
              img.style.marginLeft = 'auto'
              img.style.marginRight = 'auto'
            })
          }
        }

        // 處理緊跟在 h1 後面的圖片段落
        try {
          const h1Element = markdownBody.querySelector('h1:first-child')
          if (h1Element) {
            const nextElement = h1Element.nextElementSibling
            if (nextElement && (nextElement.tagName === 'P' || nextElement.tagName === 'DIV')) {
              const images = nextElement.querySelectorAll('img')
              const textContent = nextElement.textContent?.trim()
              
              if (images.length > 0 && (!textContent || textContent.length < 10)) {
                nextElement.setAttribute('data-img-only', 'true')
                nextElement.style.textAlign = 'center'
                
                images.forEach(img => {
                  img.style.display = 'block'
                  img.style.marginLeft = 'auto'
                  img.style.marginRight = 'auto'
                })
              }
            }
          }
        } catch (e) {
          console.warn('Error processing h1 + element:', e)
        }
      }

      // 延遲執行圖片處理，確保DOM完全載入
      window.setTimeout(processFirstBlockImages, 100)

      return () => {
        timeouts.forEach(timeout => window.clearTimeout(timeout))
      }
    }
  }, [content, rehighlightCode])

  // 監聽主題變化並重新高亮代碼（優化版本）
  useEffect(() => {
    if (!content) return

      let lastTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light'
      
      const checkThemeChange = () => {
        const currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light'
        if (currentTheme !== lastTheme) {
          lastTheme = currentTheme
          // 主題變化了，重新高亮代碼
            rehighlightCode()
      }
    }

    // 清理之前的 observer
    if (mutationObserverRef.current) {
      mutationObserverRef.current.disconnect()
      }

    // 使用 MutationObserver 來監聽主題變化（更高效）
    mutationObserverRef.current = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          checkThemeChange()
        }
      })
    })

    mutationObserverRef.current.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })

    // 備用方案：定期檢查
    const themeCheckInterval = setInterval(checkThemeChange, 500)

    return () => {
      if (mutationObserverRef.current) {
        mutationObserverRef.current.disconnect()
      }
      clearInterval(themeCheckInterval)
    }
  }, [content, rehighlightCode])

  // 清理函數
  useEffect(() => {
      return () => {
      if (rehighlightTimeoutRef.current) {
        window.clearTimeout(rehighlightTimeoutRef.current)
      }
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
      if (mutationObserverRef.current) {
        mutationObserverRef.current.disconnect()
      }
    }
  }, [])

  const renderError = () => {
    return (
      <motion.div 
        className="text-center py-10 px-5 my-5 mx-auto max-w-2xl bg-muted/30 rounded-lg border border-border"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100, damping: 15 }}
      >
        <motion.h2 
          className="mb-4 text-foreground text-2xl font-semibold m-0"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {error.title}
        </motion.h2>
        <motion.p 
          className="my-2.5 text-muted-foreground leading-6"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {error.description}
        </motion.p>
        {error.example && (
          <motion.p 
            className="my-2.5 text-muted-foreground leading-6"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {error.example}
          </motion.p>
        )}
        {error.type === 'errorLoading' && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <ul className="text-left max-w-sm my-4 mx-auto text-muted-foreground list-disc list-inside">
              <li className="my-1.5">{contextT('viewer.errorLoadingList1')}</li>
              <li className="my-1.5">{contextT('viewer.errorLoadingList2')}</li>
              <li className="my-1.5">{contextT('viewer.errorLoadingList3')}</li>
            </ul>
            <p className="my-2.5 text-muted-foreground leading-6">
              {contextT('viewer.errorDetails')} {error.details}
            </p>
          </motion.div>
        )}
        {showSubmitButton && (
          <motion.button
            onClick={handleSubmit}
            className="py-3 px-6 bg-primary text-primary-foreground border-none rounded-lg cursor-pointer text-base font-semibold mt-6 mx-auto block transition-all duration-200 hover:bg-primary/90 hover:-translate-y-px min-w-30"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {contextT('viewer.submit')}
          </motion.button>
        )}
      </motion.div>
    )
  }

  // 語言切換時的 Loading 組件
  const renderLanguageLoading = () => (
    <motion.div 
      className="w-full max-w-4xl mx-auto p-6 space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Loading 標題 */}
      <div className="flex items-center justify-center gap-3 mb-8">
        <motion.div 
          className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <span className="text-foreground font-medium text-lg">
          {contextT('viewer.loadingLanguage') || '正在載入新語言版本...'}
        </span>
      </div>

      {/* Placeholder 內容 */}
      <div className="space-y-6">
        {/* 模擬標題 */}
        <div className="space-y-3">
          <div className="h-8 bg-muted rounded-md animate-pulse w-3/4" />
          <div className="h-4 bg-muted rounded-md animate-pulse w-1/2" />
        </div>

        {/* 模擬段落 */}
        <div className="space-y-3">
          <div className="h-4 bg-muted rounded-md animate-pulse w-full" />
          <div className="h-4 bg-muted rounded-md animate-pulse w-5/6" />
          <div className="h-4 bg-muted rounded-md animate-pulse w-4/5" />
        </div>

        {/* 模擬程式碼區塊 */}
        <div className="space-y-2">
          <div className="h-6 bg-muted rounded-md animate-pulse w-1/3" />
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="h-4 bg-muted rounded-md animate-pulse w-3/4" />
            <div className="h-4 bg-muted rounded-md animate-pulse w-2/3" />
            <div className="h-4 bg-muted rounded-md animate-pulse w-4/5" />
            <div className="h-4 bg-muted rounded-md animate-pulse w-1/2" />
          </div>
        </div>

        {/* 模擬列表 */}
        <div className="space-y-2">
          <div className="h-4 bg-muted rounded-md animate-pulse w-2/3" />
          <div className="ml-4 space-y-2">
            <div className="h-3 bg-muted rounded-md animate-pulse w-3/4" />
            <div className="h-3 bg-muted rounded-md animate-pulse w-2/3" />
            <div className="h-3 bg-muted rounded-md animate-pulse w-4/5" />
          </div>
        </div>

        {/* 模擬另一個段落 */}
        <div className="space-y-3">
          <div className="h-6 bg-muted rounded-md animate-pulse w-1/2" />
          <div className="h-4 bg-muted rounded-md animate-pulse w-full" />
          <div className="h-4 bg-muted rounded-md animate-pulse w-3/4" />
          <div className="h-4 bg-muted rounded-md animate-pulse w-5/6" />
        </div>

        {/* 模擬表格 */}
        <div className="space-y-2">
          <div className="h-4 bg-muted rounded-md animate-pulse w-1/3" />
          <div className="border border-border rounded-lg overflow-hidden">
            <div className="bg-muted/30 p-3 border-b border-border">
              <div className="flex gap-4">
                <div className="h-3 bg-muted rounded-md animate-pulse w-1/4" />
                <div className="h-3 bg-muted rounded-md animate-pulse w-1/4" />
                <div className="h-3 bg-muted rounded-md animate-pulse w-1/4" />
              </div>
            </div>
            <div className="p-3 space-y-2">
              <div className="flex gap-4">
                <div className="h-3 bg-muted rounded-md animate-pulse w-1/4" />
                <div className="h-3 bg-muted rounded-md animate-pulse w-1/4" />
                <div className="h-3 bg-muted rounded-md animate-pulse w-1/4" />
              </div>
              <div className="flex gap-4">
                <div className="h-3 bg-muted rounded-md animate-pulse w-1/4" />
                <div className="h-3 bg-muted rounded-md animate-pulse w-1/4" />
                <div className="h-3 bg-muted rounded-md animate-pulse w-1/4" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )

  if (loading) {
    return (
      <PageContainer>
        <ContentWrapper>
          <motion.div 
            className="text-center py-5 text-muted-foreground"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ 
              repeat: Infinity, 
              repeatType: "reverse", 
              duration: 1,
              ease: "easeInOut"
            }}
          >
            {contextT('viewer.loading')}
          </motion.div>
        </ContentWrapper>
      </PageContainer>
    )
  }

  if (error) {
    return (
      <PageContainer>
        <PageHeader user={user} project={project} />
        <ContentWrapper>
          {renderError()}
        </ContentWrapper>
      </PageContainer>
    )
  }

      return (
      <>
        {/* Table of Contents */}
      <TableOfContents content={content} isOpen={tocOpen} setIsOpen={setTocOpen} languageLoading={languageLoading} />
        
        {/* 主要內容區域 - 整個頁面 */}
        <motion.div 
          initial={false}
          animate={{ 
            marginLeft: tocOpen ? (window.innerWidth >= 768 ? 320 : 0) : 0 
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <PageContainer>
            <PageHeader user={user} project={project} />
            <ContentWrapper>
            {languageLoading ? (
              renderLanguageLoading()
            ) : (
              <motion.div 
                className="markdown-body"
                dangerouslySetInnerHTML={{ __html: content }}
                initial={false}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              />
            )}
            </ContentWrapper>
          </PageContainer>
        </motion.div>
      </>
  )
}

export default MarkdownViewer 