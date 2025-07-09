import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'

const TableOfContents = ({ content, isOpen, setIsOpen, languageLoading = false }) => {
  const [headings, setHeadings] = useState([])
  const [activeId, setActiveId] = useState('')
  const { t } = useTranslation()

  // Extract headings and add anchor points
  useEffect(() => {
    if (!content || languageLoading) return

    const processHeadings = () => {
      const markdownBody = document.querySelector('.markdown-body')
      if (!markdownBody) {
        setTimeout(processHeadings, 100)
        return
      }

      const headingElements = markdownBody.querySelectorAll('h1, h2, h3, h4, h5, h6')
      if (headingElements.length === 0) {
        setTimeout(processHeadings, 100)
        return
      }

      // Clear all existing IDs first
      headingElements.forEach(heading => {
        heading.removeAttribute('id')
      })

      const extractedHeadings = Array.from(headingElements).map((heading, index) => {
        const level = parseInt(heading.tagName.charAt(1))
        const text = heading.textContent.trim()
        // Create more concise ID
        const id = `heading-${index}-${text.toLowerCase()
          .replace(/[^\w\u4e00-\u9fff\s-]/g, '') // Remove special characters, keep Chinese, English, numbers, spaces, hyphens
          .replace(/\s+/g, '-') // Replace spaces with hyphens
          .replace(/-+/g, '-') // Merge multiple hyphens
          .replace(/^-|-$/g, '')}`  // Remove leading and trailing hyphens
        
        // Add ID directly to actual DOM element
        heading.setAttribute('id', id)
        
        return {
          id,
          text,
          level
        }
      })
      
      setHeadings(extractedHeadings)
    }

    // Use requestAnimationFrame to optimize performance
    requestAnimationFrame(() => {
      setTimeout(processHeadings, 100)
    })
  }, [content, languageLoading])

  // Monitor scrolling to highlight current heading
  useEffect(() => {
    if (typeof window === 'undefined' || !window.IntersectionObserver || headings.length === 0 || languageLoading) return

    const observer = new window.IntersectionObserver(
      (entries) => {
        // Find the visible heading closest to the top
        const visibleEntries = entries.filter(entry => entry.isIntersecting)
        if (visibleEntries.length > 0) {
          // Sort by position on page, select the one closest to top
          const sortedEntries = visibleEntries.sort((a, b) => 
            a.boundingClientRect.top - b.boundingClientRect.top
          )
          setActiveId(sortedEntries[0].target.id)
        }
      },
      {
        // rootMargin setting considering navbar height
        rootMargin: '-80px 0% -50% 0%',
        threshold: [0, 0.1, 0.5, 1]
      }
    )

    // Delay observation to ensure DOM elements have IDs set
    const setupObserver = () => {
      let observedCount = 0
      headings.forEach(({ id }) => {
        const element = document.getElementById(id)
        if (element) {
          observer.observe(element)
          observedCount++
        }
      })
      
      // If no elements observed, retry later
      if (observedCount === 0 && headings.length > 0) {
        setTimeout(setupObserver, 200)
      }
    }

    requestAnimationFrame(() => {
      setTimeout(setupObserver, 50)
    })

    return () => {
      observer.disconnect()
    }
  }, [headings, languageLoading])

  // Click heading to jump
  const scrollToHeading = (id) => {
    if (languageLoading) return // Disable jumping during loading
    
    const performScroll = (element) => {
      const navbarHeight = 80
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset
      const offsetPosition = elementPosition - navbarHeight
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
    }
    
    // Immediately try to find by ID
    let element = document.getElementById(id)
    if (element) {
      performScroll(element)
      return
    }
    
    // If not found, try to reset ID and find again
    const targetHeading = headings.find(h => h.id === id)
    if (targetHeading) {
      // Re-find and set ID
      const allHeadings = document.querySelectorAll('.markdown-body h1, .markdown-body h2, .markdown-body h3, .markdown-body h4, .markdown-body h5, .markdown-body h6')
      const headingByText = Array.from(allHeadings).find(h => h.textContent.trim() === targetHeading.text)
      
      if (headingByText) {
        headingByText.setAttribute('id', id)
        performScroll(headingByText)
        return
      }
    }
    
    // Final retry mechanism
    const attemptScroll = (retries = 3) => {
      element = document.getElementById(id)
      if (element) {
        performScroll(element)
      } else if (retries > 0) {
        setTimeout(() => attemptScroll(retries - 1), 100)
      }
    }
    
    attemptScroll()
  }

  // Get heading indent level
  const getIndentClass = (level) => {
    const indentMap = {
      1: 'pl-0',
      2: 'pl-4',
      3: 'pl-8',
      4: 'pl-12',
      5: 'pl-16',
      6: 'pl-20'
    }
    return indentMap[level] || 'pl-0'
  }

  // Loading state placeholder
  const renderLoadingPlaceholder = () => (
    <motion.div 
      className="space-y-3 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Loading title */}
      <div className="flex items-center gap-2 mb-4">
        <motion.div 
          className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <span className="text-sm text-muted-foreground font-medium">
          {t('viewer.loadingLanguage') || '載入目錄中...'}
        </span>
      </div>

      {/* Simulate table of contents items */}
      <div className="space-y-2">
        {/* Main title */}
        <div className="h-6 bg-muted rounded-md animate-pulse w-4/5" />
        
        {/* Secondary title */}
        <div className="pl-4 space-y-2">
          <div className="h-5 bg-muted rounded-md animate-pulse w-3/4" />
          <div className="h-5 bg-muted rounded-md animate-pulse w-2/3" />
          
          {/* Third-level title */}
          <div className="pl-4 space-y-1">
            <div className="h-4 bg-muted rounded-md animate-pulse w-5/6" />
            <div className="h-4 bg-muted rounded-md animate-pulse w-3/5" />
            <div className="h-4 bg-muted rounded-md animate-pulse w-4/5" />
          </div>
        </div>

        {/* Another main title */}
        <div className="h-6 bg-muted rounded-md animate-pulse w-3/4 mt-4" />
        
        {/* More secondary titles */}
        <div className="pl-4 space-y-2">
          <div className="h-5 bg-muted rounded-md animate-pulse w-4/5" />
          <div className="h-5 bg-muted rounded-md animate-pulse w-3/5" />
          <div className="h-5 bg-muted rounded-md animate-pulse w-2/3" />
        </div>

        {/* Third main title */}
        <div className="h-6 bg-muted rounded-md animate-pulse w-5/6 mt-4" />
        
        {/* Corresponding subtitles */}
        <div className="pl-4 space-y-1">
          <div className="h-5 bg-muted rounded-md animate-pulse w-3/4" />
          <div className="h-5 bg-muted rounded-md animate-pulse w-4/5" />
        </div>
      </div>
    </motion.div>
  )

  // If no content and not loading, don't display component
  if (headings.length === 0 && !languageLoading) return null

  return (
    <>
      {/* Unified toggle button - fixed on the right side outside of sidebar */}
      <motion.div
        className="fixed top-24 z-30"
        animate={{ 
          left: isOpen ? 320 : 0 
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="bg-background/80 backdrop-blur-sm border border-border shadow-lg"
        >
          {isOpen ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      </motion.div>

              {/* Sidebar */}
        <AnimatePresence>
          {isOpen && (
            <>
              {/* Mobile background overlay */}
              <motion.div
                className="md:hidden fixed inset-0 bg-black/20 z-20"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                onClick={() => setIsOpen(false)}
              />
              
              {/* Sidebar main body */}
              <motion.aside
                className="fixed top-16 bottom-0 left-0 z-20 w-full md:w-80 bg-background/95 backdrop-blur-sm border-r border-border shadow-xl"
                initial={{ x: -320 }}
                animate={{ x: 0 }}
                exit={{ x: -320 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <div className="flex flex-col h-full">
                  {/* Table of contents content */}
                  <div className="flex-1 overflow-y-auto p-2">
                  {languageLoading ? (
                    renderLoadingPlaceholder()
                  ) : (
                  <nav className="space-y-1">
                    {headings.map(({ id, text, level }) => (
                      <motion.button
                        key={id}
                        onClick={() => scrollToHeading(id)}
                        className={cn(
                          "w-full text-left px-3 py-2 rounded-md text-sm transition-colors duration-200",
                          "hover:bg-accent hover:text-accent-foreground",
                          getIndentClass(level),
                          activeId === id
                            ? "bg-accent text-accent-foreground font-medium"
                            : "text-muted-foreground"
                        )}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <span className="block truncate">{text}</span>
                      </motion.button>
                    ))}
                  </nav>
                  )}
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

export default TableOfContents 