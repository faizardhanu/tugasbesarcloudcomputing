'use client'

import { ArrowLeft } from 'lucide-react'
import { useNavigationHistory } from '@/hooks/useNavigationHistory'

interface BackButtonProps {
  fallbackPath?: string
  className?: string
  children?: React.ReactNode
}

export default function BackButton({ 
  fallbackPath = '/', 
  className = '',
  children 
}: BackButtonProps) {
  const { goBack, getPreviousPage } = useNavigationHistory()

  const handleBack = () => {
    const previousPage = getPreviousPage()
    
    // If there's a valid previous page, use custom goBack
    if (previousPage && previousPage !== '/login') {
      goBack()
    } else {
      // Fallback to browser back or specified path
      if (window.history.length > 1) {
        window.history.back()
      } else {
        window.location.href = fallbackPath
      }
    }
  }

  return (
    <button
      onClick={handleBack}
      className={`flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors ${className}`}
    >
      <ArrowLeft size={20} />
      {children || <span>Back</span>}
    </button>
  )
}
