'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { login as apiLogin, register as apiRegister } from '@/lib/api'

interface User {
  id: number
  name: string
  email: string
  role: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<User>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
  isStaff: boolean
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in from localStorage
    const storedUser = sessionStorage.getItem('user')
    const storedToken = sessionStorage.getItem('token')
    
    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (error) {
        console.error('Failed to parse stored user:', error)
        sessionStorage.removeItem('user')
        sessionStorage.removeItem('token')
      }
    }
    setLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    const userData = await apiLogin(email, password)
    setUser(userData)
    sessionStorage.setItem('user', JSON.stringify(userData))
    sessionStorage.setItem('token', userData.token)
    return userData
  }

  const register = async (name: string, email: string, password: string) => {
    const userData = await apiRegister(name, email, password)
    // Set default role as 'user' for new registrations
    const userWithRole = { ...userData, role: 'user' }
    setUser(userWithRole)
    sessionStorage.setItem('user', JSON.stringify(userWithRole))
    sessionStorage.setItem('token', userData.token)
  }

  const logout = () => {
    setUser(null)
    sessionStorage.removeItem('user')
    sessionStorage.removeItem('token')
    // Clear navigation history on logout
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('navigationHistory')
    }
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      register, 
      logout, 
      isAuthenticated: !!user,
      isStaff: user?.role === 'staff',
      loading
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
