'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { TrendingUp, DollarSign, Calendar, Users, Bed, MapPin } from 'lucide-react'
import { getAllRooms, getHotels, getAllBookings } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { useWebSocket } from '@/hooks/useWebSocket'
import BackButton from '@/components/BackButton'

interface Analytics {
  totalRevenue: number
  totalBookings: number
  averageBookingValue: number
  popularRoomTypes: { type: string; count: number }[]
  monthlyBookings: { month: string; count: number }[]
  hotelPerformance: { hotel: string; bookings: number; revenue: number }[]
}

export default function StaffAnalytics() {
  const router = useRouter()
  const { isAuthenticated, isStaff, loading: authLoading } = useAuth()
  const { showError, showInfo } = useToast()
  
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all')

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
    
    loadAnalytics()
  }, [isAuthenticated, isStaff, authLoading])

  useWebSocket({
    enabled: !authLoading && isAuthenticated && isStaff,
    types: ['BOOKING_CREATED', 'BOOKING_CANCELLED', 'BOOKINGS_CHANGED', 'RESCHEDULE_CREATED', 'RESCHEDULE_UPDATED'],
    onMessage: (type) => {
      if (type === 'BOOKING_CREATED') showInfo('New hotel booking received', 5000)
      else if (type === 'RESCHEDULE_CREATED') showInfo('New reschedule request received', 5000)
      loadAnalytics()
    },
  })

  const loadAnalytics = async () => {
    try {
      const [roomsData, hotelsData, bookingsData] = await Promise.all([
        getAllRooms(),
        getHotels(),
        getAllBookings()
      ])
      
      // Calculate analytics - exclude cancelled bookings
      const validBookings = bookingsData.filter((booking: any) => 
        booking.status !== 'cancelled'
      )
      
      const totalRevenue = validBookings.reduce((sum: number, booking: any) => {
        return sum + parseFloat(booking.totalPrice || '0')
      }, 0)

      const totalBookings = validBookings.length
      const totalRooms = roomsData.length
      const averageBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0

      // Popular room types - exclude cancelled bookings
      const roomTypeCounts: { [key: string]: number } = {}
      validBookings.forEach((booking: any) => {
        const roomType = booking.roomDetails?.name?.split(' ')[0] || 'Unknown'
        roomTypeCounts[roomType] = (roomTypeCounts[roomType] || 0) + 1
      })
      const popularRoomTypes = Object.entries(roomTypeCounts)
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      // Monthly bookings (last 6 months) - exclude cancelled bookings
      const monthlyData: { [key: string]: number } = {}
      const currentDate = new Date()
      for (let i = 5; i >= 0; i--) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
        const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        monthlyData[monthKey] = 0
      }

      validBookings.forEach((booking: any) => {
        const bookingDate = new Date(booking.createdAt)
        const monthKey = bookingDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        if (monthlyData.hasOwnProperty(monthKey)) {
          monthlyData[monthKey]++
        }
      })

      const monthlyBookings = Object.entries(monthlyData).map(([month, count]) => ({ month, count }))

      // Hotel performance - exclude cancelled bookings
      const hotelData: { [key: string]: { bookings: number; revenue: number } } = {}
      validBookings.forEach((booking: any) => {
        const hotelName = booking.hotelDetails?.name || 'Unknown Hotel'
        if (!hotelData[hotelName]) {
          hotelData[hotelName] = { bookings: 0, revenue: 0 }
        }
        hotelData[hotelName].bookings++
        hotelData[hotelName].revenue += parseFloat(booking.totalPrice || '0')
      })

      const hotelPerformance = Object.entries(hotelData)
        .map(([hotel, data]) => ({ hotel, ...data }))
        .sort((a, b) => b.revenue - a.revenue)

      setAnalytics({
        totalRevenue,
        totalBookings,
        averageBookingValue,
        popularRoomTypes,
        monthlyBookings,
        hotelPerformance
      })
    } catch (error) {
      console.error('Failed to load analytics:', error)
      showError('Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600">No analytics data available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 staff-override staff-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <BackButton fallbackPath="/staff/dashboard">
            Back to Dashboard
          </BackButton>
        </div>

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Analytics & Reports</h1>
            <p className="text-gray-600 mt-2">Business insights and performance metrics</p>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-3xl font-bold text-green-600">
                  Rp {analytics.totalRevenue.toLocaleString('id-ID')}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                <p className="text-3xl font-bold text-blue-600">{analytics.totalBookings}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Booking Value</p>
                <p className="text-3xl font-bold text-orange-600">
                  Rp {analytics.averageBookingValue.toLocaleString('id-ID')}
                </p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts and Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Monthly Bookings */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Monthly Bookings Trend</h3>
            <div className="space-y-3">
              {analytics.monthlyBookings.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">{item.month}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ 
                          width: `${Math.max((item.count / Math.max(...analytics.monthlyBookings.map(m => m.count))) * 100, 5)}%` 
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-bold text-gray-900 w-8 text-right">{item.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Popular Room Types */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Popular Room Types</h3>
            <div className="space-y-3">
              {analytics.popularRoomTypes.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">{item.type}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full" 
                        style={{ 
                          width: `${Math.max((item.count / Math.max(...analytics.popularRoomTypes.map(r => r.count))) * 100, 5)}%` 
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-bold text-gray-900 w-8 text-right">{item.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Hotel Performance */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Hotel Performance</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hotel
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bookings
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg. per Booking
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analytics.hotelPerformance.map((hotel, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <MapPin className="h-5 w-5 text-gray-400 mr-2" />
                        <div className="text-sm font-medium text-gray-900">{hotel.hotel}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{hotel.bookings}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        Rp {hotel.revenue.toLocaleString('id-ID')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        Rp {hotel.bookings > 0 ? (hotel.revenue / hotel.bookings).toLocaleString('id-ID') : '0'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {analytics.hotelPerformance.length === 0 && (
              <div className="text-center py-12">
                <MapPin className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No hotel data</h3>
                <p className="mt-1 text-sm text-gray-500">No bookings found to analyze hotel performance.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
