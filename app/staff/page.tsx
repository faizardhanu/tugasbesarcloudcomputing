'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

export default function StaffPage() {
  const router = useRouter()
  const { isAuthenticated, isStaff, loading: authLoading } = useAuth()
  
  // Redirect to dashboard
  useEffect(() => {
    // Wait for auth to load before checking
    if (authLoading) return
    
    if (!isAuthenticated || !isStaff) {
      router.push('/login')
      return
    }
    
    // Redirect to dashboard
    router.push('/staff/dashboard')
  }, [isAuthenticated, isStaff, router, authLoading])
  
  // Show loading while redirecting
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting to staff dashboard...</p>
      </div>
    </div>
  )
}
