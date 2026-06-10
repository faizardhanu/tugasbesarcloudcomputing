'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Calendar, Users, Bed, TrendingUp, Clock, CheckCircle } from 'lucide-react'
import { getAllRooms, getHotels, getAllBookings, getRescheduleRequests } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { useWebSocket } from '@/hooks/useWebSocket'
import BackButton from '@/components/BackButton'

interface Room {
  id: number
  name: string
  type: string
  price: number
  available: boolean
  hotelId: number
}

interface Hotel {
  id: number
  name: string
  location: string
}

export default function StaffDashboard() {
  const router = useRouter()
  const { isAuthenticated, isStaff, loading: authLoading } = useAuth()
  const { showError, showInfo } = useToast()
  
  const [rooms, setRooms] = useState<Room[]>([])
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [bookings, setBookings] = useState<any[]>([])
  const [rescheduleRequests, setRescheduleRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Wait for auth to load before checking
    if (authLoading) return
    
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    
    if (!isStaff) {
      router.push('/')
      showError('Access denied. Staff privileges required.')
      return
    }
    
    loadDashboardData()
  }, [isAuthenticated, isStaff, authLoading])

  const loadDashboardData = async () => {
    try {
      const [roomsData, hotelsData, bookingsData, requestsData] = await Promise.all([
        getAllRooms(),
        getHotels(),
        getAllBookings(),
        getRescheduleRequests()
      ])
      
      setRooms(roomsData || [])
      setHotels(hotelsData || [])
      setBookings(bookingsData || [])
      setRescheduleRequests(requestsData || [])
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
      showError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  useWebSocket({
    enabled: !authLoading && isAuthenticated && isStaff,
    types: ['BOOKING_CREATED', 'BOOKING_CANCELLED', 'BOOKINGS_CHANGED', 'RESCHEDULE_CREATED', 'RESCHEDULE_UPDATED'],
    onMessage: (type) => {
      if (type === 'BOOKING_CREATED') showInfo('New hotel booking received', 5000)
      else if (type === 'RESCHEDULE_CREATED') showInfo('New reschedule request received', 5000)
      loadDashboardData()
    },
  })

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  // Calculate statistics
  const totalRooms = rooms.length
  const availableRooms = rooms.filter(room => room.available).length
  const totalBookings = bookings.filter(booking => booking.status !== 'cancelled').length
  const pendingRequests = rescheduleRequests.filter(req => req.status === 'pending').length
  const todayBookings = bookings.filter(booking => {
    const today = new Date().toISOString().split('T')[0]
    const checkIn = new Date(booking.checkIn).toISOString().split('T')[0]
    return checkIn === today && booking.status !== 'cancelled'
  }).length

  return (
    <div className="min-h-screen bg-gray-50 py-12 staff-override staff-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <BackButton fallbackPath="/">
            Back to Home
          </BackButton>
        </div>

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 staff-text-dark" style={{ color: '#111827 !important' }}>Staff Dashboard</h1>
            <p className="text-gray-600 mt-2 staff-text-dark" style={{ color: '#4b5563 !important' }}>Welcome to Hotel-U management system</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 staff-text-dark" style={{ color: '#4b5563 !important' }}>Total Rooms</p>
                <p className="text-3xl font-bold text-gray-900 staff-text-dark" style={{ color: '#111827 !important' }}>{totalRooms}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Bed className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 staff-text-dark">Available Rooms</p>
                <p className="text-3xl font-bold text-green-600 staff-text-dark" style={{ color: '#16a34a !important' }}>{availableRooms}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 staff-text-dark" style={{ color: '#4b5563 !important' }}>Total Bookings</p>
                <p className="text-3xl font-bold text-purple-600 staff-text-dark" style={{ color: '#9333ea !important' }}>{totalBookings}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 staff-text-dark" style={{ color: '#4b5563 !important' }}>Pending Requests</p>
                <p className="text-3xl font-bold text-orange-600 staff-text-dark" style={{ color: '#ea580c !important' }}>{pendingRequests}</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link href="/staff/rooms" className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <Bed className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Room Management</h3>
                <p className="text-gray-600">Manage hotel rooms and availability</p>
              </div>
            </div>
          </Link>

          <Link href="/staff/bookings" className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center space-x-4">
              <div className="bg-purple-100 p-3 rounded-full">
                <Calendar className="h-8 w-8 text-purple-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Booking Management</h3>
                <p className="text-gray-600">View and manage customer bookings</p>
              </div>
            </div>
          </Link>

          <Link href="/staff/analytics" className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center space-x-4">
              <div className="bg-green-100 p-3 rounded-full">
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Analytics</h3>
                <p className="text-gray-600">View reports and statistics</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Bookings */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Recent Bookings</h3>
              <Link href="/staff/bookings" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                View All
              </Link>
            </div>
            <div className="space-y-4">
              {bookings.filter(booking => booking.status !== 'cancelled').slice(0, 5).map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{booking.guestName}</p>
                    <p className="text-sm text-gray-600">{booking.roomDetails?.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{booking.status}</p>
                    <p className="text-xs text-gray-600">{booking.createdAt}</p>
                  </div>
                </div>
              ))}
              {bookings.filter(booking => booking.status !== 'cancelled').length === 0 && (
                <p className="text-gray-500 text-center py-4">No recent bookings</p>
              )}
            </div>
          </div>

          {/* Recent Rooms */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Room Status</h3>
              <Link href="/staff/rooms" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                Manage Rooms
              </Link>
            </div>
            <div className="space-y-4">
              {rooms.slice(0, 5).map((room) => (
                <div key={room.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{room.name}</p>
                    <p className="text-sm text-gray-600">{room.type}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      room.available 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {room.available ? 'Available' : 'Occupied'}
                    </span>
                  </div>
                </div>
              ))}
              {rooms.length === 0 && (
                <p className="text-gray-500 text-center py-4">No rooms found</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
