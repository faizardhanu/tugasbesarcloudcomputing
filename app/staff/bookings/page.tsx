'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, Clock, CheckCircle, XCircle, Users, MapPin } from 'lucide-react'
import { getAllBookings, getRescheduleRequests, approveRescheduleRequest, rejectRescheduleRequest } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { useWebSocket } from '@/hooks/useWebSocket'
import BackButton from '@/components/BackButton'

interface Booking {
  id: number
  roomId: number
  hotelId: number
  guestName: string
  guestEmail: string
  guestPhone: string
  checkIn: string
  checkOut: string
  guests: number
  totalPrice: string
  status: string
  specialRequests: string
  roomDetails: {
    id: number
    name: string
    roomNumber: string
  }
  hotelDetails: {
    id: number
    name: string
    location: string
  }
  createdAt: string
}

interface RescheduleRequest {
  id: number
  bookingId: number
  originalCheckIn: string
  originalCheckOut: string
  newCheckIn: string
  newCheckOut: string
  reason: string
  status: string
  createdAt: string
}

export default function BookingManagement() {
  const router = useRouter()
  const { isAuthenticated, isStaff, loading: authLoading } = useAuth()
  const { showSuccess, showError, showInfo } = useToast()
  
  const [bookings, setBookings] = useState<Booking[]>([])
  const [rescheduleRequests, setRescheduleRequests] = useState<RescheduleRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [showRescheduleModal, setShowRescheduleModal] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<RescheduleRequest | null>(null)

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
    
    loadData()
  }, [isAuthenticated, isStaff, authLoading])

  const loadData = async () => {
    try {
      const [bookingsData, requestsData] = await Promise.all([
        getAllBookings(),
        getRescheduleRequests()
      ])
      
      setBookings(bookingsData || [])
      setRescheduleRequests(requestsData || [])
    } catch (error) {
      console.error('Failed to load booking data:', error)
      showError('Failed to load booking data')
    } finally {
      setLoading(false)
    }
  }

  useWebSocket({
    enabled: !authLoading && isAuthenticated && isStaff,
    types: ['RESCHEDULE_CREATED', 'RESCHEDULE_UPDATED', 'BOOKINGS_CHANGED'],
    onMessage: (type) => {
      if (type === 'RESCHEDULE_CREATED') showInfo('New reschedule request received', 5000)
      loadData()
    },
  })

  const getBookingsForDate = (date: string) => {
    return bookings.filter(booking => {
      const checkIn = new Date(booking.checkIn)
      const checkOut = new Date(booking.checkOut)
      const selectedDateObj = new Date(date)
      
      return selectedDateObj >= checkIn && selectedDateObj < checkOut
    })
  }

  const filteredBookings = getBookingsForDate(selectedDate).filter(booking => {
    if (!statusFilter) return true
    return booking.status === statusFilter
  })

  const pendingRequests = rescheduleRequests.filter(req => req.status === 'pending')

  const handleApproveReschedule = async (requestId: number) => {
    try {
      await approveRescheduleRequest(requestId)
      showSuccess('Reschedule request approved successfully')
      loadData()
    } catch (error: any) {
      console.error('Failed to approve reschedule:', error)
      const message = error instanceof Error ? error.message : 'Failed to approve reschedule request'
      showError(message)
    }
  }

  const handleRejectReschedule = async (requestId: number) => {
    try {
      await rejectRescheduleRequest(requestId, 'Rejected by staff')
      showSuccess('Reschedule request rejected')
      loadData()
    } catch (error: any) {
      console.error('Failed to reject reschedule:', error)
      const message = error instanceof Error ? error.message : 'Failed to reject reschedule request'
      showError(message)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      case 'reschedule_pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'rescheduled':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading booking management...</p>
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
            <h1 className="text-4xl font-bold text-gray-900">Booking Management</h1>
            <p className="text-gray-600 mt-2">Manage customer bookings and reschedule requests</p>
          </div>
        </div>

        {/* Pending Reschedule Requests */}
        {pendingRequests.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <Clock className="mr-2 text-orange-600" size={24} />
              Pending Reschedule Requests ({pendingRequests.length})
            </h3>
            <div className="space-y-4">
              {pendingRequests.map((request) => {
                const booking = bookings.find(b => b.id === request.bookingId)
                return (
                  <div key={request.id} className="border border-orange-200 rounded-lg p-4 bg-orange-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-semibold text-gray-900">
                            {booking?.roomDetails?.name || 'Room'} - {booking?.hotelDetails?.name}
                          </h4>
                          <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                            Reschedule Request
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                          <div>
                            <p><strong>Guest:</strong> {booking?.guestName}</p>
                            <p><strong>Current:</strong> {request.originalCheckIn} to {request.originalCheckOut}</p>
                            <p><strong>Requested:</strong> {request.newCheckIn} to {request.newCheckOut}</p>
                          </div>
                          <div>
                            <p><strong>Email:</strong> {booking?.guestEmail}</p>
                            <p><strong>Phone:</strong> {booking?.guestPhone}</p>
                            <p><strong>Reason:</strong> {request.reason || 'No reason provided'}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() => handleApproveReschedule(request.id)}
                          className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <CheckCircle size={16} className="mr-1" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleRejectReschedule(request.id)}
                          className="flex items-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                          <XCircle size={16} className="mr-1" />
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Date and Status Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Filter Bookings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-gray-900"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status Filter
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-gray-900"
              >
                <option value="">All Statuses</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
                <option value="reschedule_pending">Reschedule Pending</option>
                <option value="rescheduled">Rescheduled</option>
              </select>
            </div>
          </div>
          
          <div className="mt-4 flex items-center space-x-4 text-sm text-gray-600">
            <span>
              {filteredBookings.length} bookings on {new Date(selectedDate).toLocaleDateString('en-US', { 
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
          </div>
        </div>

        {/* Bookings List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            Bookings for {new Date(selectedDate).toLocaleDateString('en-US', { 
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </h3>
          
          {filteredBookings.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="mx-auto text-gray-400 mb-4" size={64} />
              <p className="text-gray-500 text-lg">No bookings for this date</p>
              <p className="text-gray-400 text-sm mt-2">
                {statusFilter ? 'Try changing the status filter.' : 'Select a different date to view bookings.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredBookings.map((booking) => (
                <div key={booking.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-gray-900">{booking.roomDetails?.name}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                      {booking.status.replace('_', ' ')}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Users size={14} className="mr-2" />
                      <span>{booking.guestName}</span>
                    </div>
                    
                    <div className="flex items-center">
                      <MapPin size={14} className="mr-2" />
                      <span>{booking.hotelDetails?.name}</span>
                    </div>
                    
                    <div className="flex items-center">
                      <Calendar size={14} className="mr-2" />
                      <span>
                        {new Date(booking.checkIn).toLocaleDateString()} - {new Date(booking.checkOut).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="pt-2 border-t border-gray-200">
                      <p className="font-medium text-gray-900">
                        Rp {parseFloat(booking.totalPrice).toLocaleString('id-ID')}
                      </p>
                      <p className="text-xs text-gray-500">
                        {booking.guests} guest{booking.guests > 1 ? 's' : ''}
                      </p>
                    </div>
                    
                    {booking.specialRequests && (
                      <div className="pt-2 border-t border-gray-200">
                        <p className="text-xs text-gray-500">
                          <strong>Special Requests:</strong> {booking.specialRequests}
                        </p>
                      </div>
                    )}
                    
                    <div className="pt-2 border-t border-gray-200">
                      <p className="text-xs text-gray-500">
                        <strong>Contact:</strong> {booking.guestEmail}
                      </p>
                      <p className="text-xs text-gray-500">
                        {booking.guestPhone}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
