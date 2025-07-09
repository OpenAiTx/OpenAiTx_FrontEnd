import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { marked } from 'marked'
import hljs from 'highlight.js'
// import 'highlight.js/styles/github.css' // Remove default styles, use custom styles
import '../styles/markdown.css'
import { useTranslation } from 'react-i18next'
import TableOfContents from '../components/TableOfContents'
import { toast } from 'sonner'
import { convertEmojis } from '../lib/emojiUtils'
import DOMPurify from 'dompurify'

// Markdown content cache
const markdownCache = new Map()

const MarkdownViewer = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [languageLoading, setLanguageLoading] = useState(false) // Loading state during language switching
  const [error, setError] = useState(null)
  const [showSubmitButton, setShowSubmitButton] = useState(false)
  const [tocOpen, setTocOpen] = useState(false)
  const { t: contextT, i18n } = useTranslation()
  
  // Ref for tracking re-highlighting
  const rehighlightTimeoutRef = useRef(null)
  const observerRef = useRef(null)
  const mutationObserverRef = useRef(null)
  const previousLangRef = useRef(null)

  const user = searchParams.get('user')
  const project = searchParams.get('project')
  const urlLang = searchParams.get('lang') || 'en'

  // Synchronize lang parameter in URL with current system language
  useEffect(() => {
    // When URL lang parameter differs from current system language, update system language
    if (urlLang !== i18n.language) {
      i18n.changeLanguage(urlLang)
    }
  }, [urlLang, i18n])

  // Listen for system language changes, sync to URL
  useEffect(() => {
    const handleLanguageChange = (lng) => {
      // Check if current language differs from URL parameter
      if (lng !== searchParams.get('lang')) {
        // Manually build new query string
        const params = {}
        searchParams.forEach((value, key) => {
          params[key] = value
        })
        params.lang = lng
        
        // Build new query string
        const queryString = Object.entries(params)
          .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
          .join('&')
        
        setSearchParams(queryString, { replace: true })
      }
    }

    // Listen for i18next language change events
    i18n.on('languageChanged', handleLanguageChange)

    // Cleanup event listener
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

  // Enhanced code re-highlighting function
  const rehighlightCode = useCallback(() => {
    // Clear previous timeout
    if (rehighlightTimeoutRef.current) {
      window.clearTimeout(rehighlightTimeoutRef.current)
    }

    rehighlightTimeoutRef.current = window.setTimeout(() => {
      const codeBlocks = document.querySelectorAll('.markdown-body pre code')
      
      codeBlocks.forEach((block) => {
        try {
          // Save original content
          const originalText = block.textContent || block.innerText
          
          // Clear previous highlight state and class names
          if (block.dataset.highlighted) {
            delete block.dataset.highlighted
          }
          
          // Reset class names, keep language class
          const languageClass = Array.from(block.classList).find(cls => cls.startsWith('language-'))
          block.className = languageClass || ''
          
          // Reset content to plain text
          block.textContent = originalText
          
          // Re-highlight
          hljs.highlightElement(block)
          
          // Force re-apply styles
          block.style.display = 'none'
          block.offsetHeight // Trigger reflow
          block.style.display = ''
        } catch (e) {
          console.warn('Code highlighting failed for block:', e)
        }
      })
    }, 50) // Reduce delay time
  }, [])

  // Setup ResizeObserver to monitor layout changes
  useEffect(() => {
    if (!content) return

    // Cleanup previous observer
    if (observerRef.current) {
      observerRef.current.disconnect()
    }

    // Create new ResizeObserver
    if (window.ResizeObserver) {
      observerRef.current = new window.ResizeObserver(() => {
        // Debounce handling
        if (rehighlightTimeoutRef.current) {
          window.clearTimeout(rehighlightTimeoutRef.current)
        }
        
        rehighlightTimeoutRef.current = window.setTimeout(() => {
          rehighlightCode()
        }, 100)
      })

      // Observe main content area
      const mainContent = document.querySelector('.markdown-body')
      if (mainContent) {
        observerRef.current.observe(mainContent)
      }

      // Observe entire document
      observerRef.current.observe(document.body)
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [content, rehighlightCode])

  // Enhanced sidebar state change monitoring
  useEffect(() => {
    if (content) {
      // Re-highlight immediately once
      rehighlightCode()
      
      // Continue re-highlighting during animation
      const intervals = [50, 100, 200, 300, 400] // Multiple time points
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

  // Listen for language changes and show loading
  useEffect(() => {
    if (previousLangRef.current && previousLangRef.current !== urlLang && content) {
      setLanguageLoading(true)
    }
    previousLangRef.current = urlLang
  }, [urlLang, content])

  useEffect(() => {
    // Configure marked options, increase security
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
      sanitize: false, // We will use DOMPurify for sanitization
      silent: true // Silent errors to avoid console warnings
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
        // Generate cache key
        const cacheKey = `${user}/${project}/${urlLang}`
        
        // Check cache
        if (markdownCache.has(cacheKey)) {
          const cachedContent = markdownCache.get(cacheKey)
          setContent(cachedContent)
          setLoading(false)
          setLanguageLoading(false)
          
          // Update page title
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
        
        // Convert emojis
        const markdownWithEmojis = convertEmojis(markdown)
        
        // Render the markdown
        let renderedContent = marked.parse(markdownWithEmojis)
        
        // Use DOMPurify to sanitize HTML content for improved security
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
        
        // Store in cache
        markdownCache.set(cacheKey, renderedContent)
        
        // Limit cache size (store maximum 20 items)
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
      // Wait for DOM update before highlighting, use multiple time points to ensure highlighting succeeds
      const timeouts = [50, 100, 200].map(delay =>
        window.setTimeout(() => {
        rehighlightCode()
        }, delay)
      )

      // Process image centering in first block
      const processFirstBlockImages = () => {
        const markdownBody = document.querySelector('.markdown-body')
        if (!markdownBody) return

        // Find first paragraph or div - use safer method
        let firstElement = null
        
        // Try different selectors
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
          
          // If paragraph contains only images (no substantial text content), mark as image-only paragraph
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

        // Process image paragraphs immediately following h1
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

      // Delay image processing to ensure DOM is fully loaded
      window.setTimeout(processFirstBlockImages, 100)

      return () => {
        timeouts.forEach(timeout => window.clearTimeout(timeout))
      }
    }
  }, [content, rehighlightCode])

  // Listen for theme changes and re-highlight code (optimized version)
  useEffect(() => {
    if (!content) return

      let lastTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light'
      
      const checkThemeChange = () => {
        const currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light'
        if (currentTheme !== lastTheme) {
          lastTheme = currentTheme
          // Theme changed, re-highlight code
            rehighlightCode()
      }
    }

    // Cleanup previous observer
    if (mutationObserverRef.current) {
      mutationObserverRef.current.disconnect()
      }

    // Use MutationObserver to monitor theme changes (more efficient)
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

    // Fallback: periodic check
    const themeCheckInterval = setInterval(checkThemeChange, 500)

    return () => {
      if (mutationObserverRef.current) {
        mutationObserverRef.current.disconnect()
      }
      clearInterval(themeCheckInterval)
    }
  }, [content, rehighlightCode])

  // Cleanup function
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

  // Language switching loading component
  const renderLanguageLoading = () => (
    <motion.div 
      className="w-full max-w-4xl mx-auto p-6 space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Loading title */}
      <div className="flex items-center justify-center gap-3 mb-8">
        <motion.div 
          className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <span className="text-foreground font-medium text-lg">
          {contextT('viewer.loadingLanguage') || 'Loading new language version...'}
        </span>
      </div>

      {/* Placeholder content */}
      <div className="space-y-6">
        {/* Simulate title */}
        <div className="space-y-3">
          <div className="h-8 bg-muted rounded-md animate-pulse w-3/4" />
          <div className="h-4 bg-muted rounded-md animate-pulse w-1/2" />
        </div>

        {/* Simulate paragraph */}
        <div className="space-y-3">
          <div className="h-4 bg-muted rounded-md animate-pulse w-full" />
          <div className="h-4 bg-muted rounded-md animate-pulse w-5/6" />
          <div className="h-4 bg-muted rounded-md animate-pulse w-4/5" />
        </div>

        {/* Simulate code block */}
        <div className="space-y-2">
          <div className="h-6 bg-muted rounded-md animate-pulse w-1/3" />
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="h-4 bg-muted rounded-md animate-pulse w-3/4" />
            <div className="h-4 bg-muted rounded-md animate-pulse w-2/3" />
            <div className="h-4 bg-muted rounded-md animate-pulse w-4/5" />
            <div className="h-4 bg-muted rounded-md animate-pulse w-1/2" />
          </div>
        </div>

        {/* Simulate list */}
        <div className="space-y-2">
          <div className="h-4 bg-muted rounded-md animate-pulse w-2/3" />
          <div className="ml-4 space-y-2">
            <div className="h-3 bg-muted rounded-md animate-pulse w-3/4" />
            <div className="h-3 bg-muted rounded-md animate-pulse w-2/3" />
            <div className="h-3 bg-muted rounded-md animate-pulse w-4/5" />
          </div>
        </div>

        {/* Simulate another paragraph */}
        <div className="space-y-3">
          <div className="h-6 bg-muted rounded-md animate-pulse w-1/2" />
          <div className="h-4 bg-muted rounded-md animate-pulse w-full" />
          <div className="h-4 bg-muted rounded-md animate-pulse w-3/4" />
          <div className="h-4 bg-muted rounded-md animate-pulse w-5/6" />
        </div>

        {/* Simulate table */}
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
        
        {/* Main content area - entire page */}
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