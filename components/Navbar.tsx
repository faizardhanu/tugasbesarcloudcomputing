'use client'

import Link from 'next/link'
import { Hotel, User, LogOut } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useState } from 'react'
import LoginModal from './LoginModal'
import LogoutConfirmModal from './LogoutConfirmModal'

export default function Navbar() {
  const { user, logout, isAuthenticated, isStaff } = useAuth()
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  const handleLogout = () => {
    logout()
    setShowLogoutConfirm(false)
  }

  return (
    <>
      <nav className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <Hotel className="text-primary-600" size={32} />
              <span className="text-2xl font-bold text-primary-600">HoTel-U</span>
            </Link>

            <div className="flex items-center space-x-6">
              {isAuthenticated ? (
                <>
                  {!isStaff && (
                    // Regular user navigation
                    <Link href="/bookings" className="text-gray-700 hover:text-primary-600 font-medium">
                      My Bookings
                    </Link>
                  )}
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2 text-gray-700">
                      <User size={20} />
                      <span className="font-medium">{user?.name} ({user?.role})</span>
                    </div>
                    <button
                      onClick={() => setShowLogoutConfirm(true)}
                      className="flex items-center space-x-1 text-gray-700 hover:text-primary-600"
                    >
                      <LogOut size={20} />
                      <span>Logout</span>
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-gray-700 hover:text-primary-600 font-medium"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} />}
      {showLogoutConfirm && (
        <LogoutConfirmModal
          onConfirm={handleLogout}
          onCancel={() => setShowLogoutConfirm(false)}
        />
      )}
    </>
  )
}
