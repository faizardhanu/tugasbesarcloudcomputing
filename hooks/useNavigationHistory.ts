'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export function useNavigationHistory() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Save current path to history
    const saveToHistory = () => {
      if (typeof window !== 'undefined') {
        const history = JSON.parse(sessionStorage.getItem('navigationHistory') || '[]')
        
        // Don't save login page to history
        if (pathname !== '/login' && pathname !== '/register') {
          // Remove duplicate if current path is already the last item
          if (history[history.length - 1] !== pathname) {
            history.push(pathname)
            
            // Keep only last 10 pages
            if (history.length > 10) {
              history.shift()
            }
            
            sessionStorage.setItem('navigationHistory', JSON.stringify(history))
          }
        }
      }
    }

    saveToHistory()
  }, [pathname])

  const goBack = () => {
    if (typeof window !== 'undefined') {
      const history = JSON.parse(sessionStorage.getItem('navigationHistory') || '[]')
      
      if (history.length > 1) {
        // Remove current page
        history.pop()
        // Get previous page
        const previousPage = history[history.length - 1]
        
        if (previousPage && previousPage !== '/login') {
          // Update history without current page
          sessionStorage.setItem('navigationHistory', JSON.stringify(history))
          router.push(previousPage)
          return
        }
      }
      
      // Fallback to home page if no valid history
      router.push('/')
    }
  }

  const getPreviousPage = () => {
    if (typeof window !== 'undefined') {
      const history = JSON.parse(sessionStorage.getItem('navigationHistory') || '[]')
      return history.length > 1 ? history[history.length - 2] : '/'
    }
    return '/'
  }

  return { goBack, getPreviousPage }
}
