'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Calendar, MapPin, Users, CreditCard, X, Edit } from 'lucide-react'
import { getUserBookings, cancelBooking, createRescheduleRequest, getUserRescheduleRequests } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { useNavigationHistory } from '@/hooks/useNavigationHistory'
import { useWebSocket } from '@/hooks/useWebSocket'
import RescheduleModal from '@/components/RescheduleModal'
import ConfirmModal from '@/components/ConfirmModal'
import BackButton from '@/components/BackButton'

interface Booking {
  id: number
  roomId: number
  roomName: string
  hotelName: string
  hotelLocation: string
  roomImage: string
  checkIn: string
  checkOut: string
  guests: number
  totalPrice: number
  paymentMethod: string
  status: string
  createdAt: string
  rescheduleRequestId?: number
  requestedCheckIn?: string
  requestedCheckOut?: string
  rescheduleReason?: string
}

export default function BookingsPage() {
  const router = useRouter()
  const { isAuthenticated, loading: authLoading } = useAuth()
  const { showSuccess, showError, showInfo } = useToast()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [rescheduleRequests, setRescheduleRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showRescheduleModal, setShowRescheduleModal] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [bookingToCancel, setBookingToCancel] = useState<number | null>(null)

  useEffect(() => {
    // Wait for auth to load before checking
    if (authLoading) return
    
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    loadBookings()
    
    // Restore scroll position
    const savedScrollPos = sessionStorage.getItem('bookingsScroll')
    if (savedScrollPos) {
      setTimeout(() => {
        window.scrollTo(0, parseInt(savedScrollPos))
      }, 100)
    }
  }, [isAuthenticated, authLoading])

  // Save scroll position
  useEffect(() => {
    const handleScroll = () => {
      sessionStorage.setItem('bookingsScroll', window.scrollY.toString())
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useWebSocket({
    enabled: !authLoading && isAuthenticated,
    types: ['BOOKINGS_CHANGED', 'BOOKING_CREATED', 'BOOKING_CANCELLED', 'RESCHEDULE_UPDATED'],
    onMessage: () => loadBookings(),
  })

  const loadBookings = async () => {
    try {
      const [bookingsData, requestsData] = await Promise.all([
        getUserBookings(),
        getUserRescheduleRequests()
      ])
      setBookings(bookingsData)
      setRescheduleRequests(requestsData)
    } catch (error) {
      console.error('Failed to load bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelBooking = (bookingId: number) => {
    setBookingToCancel(bookingId)
    setShowCancelConfirm(true)
  }

  const confirmCancelBooking = async () => {
    if (!bookingToCancel) return
    
    try {
      await cancelBooking(bookingToCancel)
      loadBookings() // Reload bookings
      showSuccess('Booking cancelled successfully')
    } catch (error) {
      console.error('Failed to cancel booking:', error)
      showError('Failed to cancel booking')
    } finally {
      setShowCancelConfirm(false)
      setBookingToCancel(null)
    }
  }

  const handleRescheduleBooking = (booking: Booking) => {
    setSelectedBooking(booking)
    setShowRescheduleModal(true)
  }

  const handleConfirmReschedule = async (newCheckIn: string, newCheckOut: string, reason: string) => {
    if (!selectedBooking) return
    
    try {
      await createRescheduleRequest(selectedBooking.id, newCheckIn, newCheckOut, reason)
      setShowRescheduleModal(false)
      setSelectedBooking(null)
      loadBookings() // Reload bookings and requests
      showInfo('Reschedule request submitted! Hotel management will review your request.')
    } catch (error: any) {
      console.error('Failed to create reschedule request:', error)
      const message = error instanceof Error ? error.message : 'Failed to submit reschedule request'
      showError(message)
    }
  }

  const getRescheduleRequestStatus = (bookingId: number) => {
    return rescheduleRequests.find(req => req.bookingId === bookingId && req.status === 'pending')
  }


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'reschedule_pending':
        return 'bg-orange-100 text-orange-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      case 'rescheduled':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'credit-card':
        return 'Credit Card'
      case 'mbanking':
        return 'Mobile Banking'
      case 'ewallet':
        return 'E-Wallet'
      default:
        return method
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your bookings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <BackButton fallbackPath="/">
            Back to Hotels
          </BackButton>
        </div>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">My Bookings</h1>
        </div>

        {bookings.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-xl text-gray-600 mb-4">You don't have any bookings yet</p>
            <button
              onClick={() => router.push('/')}
              className="bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
            >
              Browse Hotels
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {bookings.map((booking) => (
              <div key={booking.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="flex flex-col md:flex-row">
                  <div className="relative w-full md:w-64 h-48">
                    <Image
                      src={booking.roomImage || 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800'}
                      alt={booking.roomName}
                      fill
                      className="object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800';
                      }}
                    />
                  </div>
                  <div className="flex-1 p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-1">{booking.roomName}</h3>
                        <p className="text-lg text-gray-700 font-semibold">{booking.hotelName}</p>
                        <div className="flex items-center text-gray-600 mt-1">
                          <MapPin size={16} className="mr-1" />
                          <span className="text-sm">{booking.hotelLocation}</span>
                        </div>
                      </div>
                      <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(booking.status)}`}>
                        {booking.status === 'reschedule_pending' ? 'Reschedule Pending' : 
                         booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <div className="flex items-center text-gray-600 mb-1">
                          <Calendar size={16} className="mr-1" />
                          <span className="text-sm font-medium">Check-in</span>
                        </div>
                        <p className="text-gray-900 font-semibold">
                          {new Date(booking.checkIn).toLocaleDateString('id-ID')}
                        </p>
                      </div>
                      <div>
                        <div className="flex items-center text-gray-600 mb-1">
                          <Calendar size={16} className="mr-1" />
                          <span className="text-sm font-medium">Check-out</span>
                        </div>
                        <p className="text-gray-900 font-semibold">
                          {new Date(booking.checkOut).toLocaleDateString('id-ID')}
                        </p>
                      </div>
                      <div>
                        <div className="flex items-center text-gray-600 mb-1">
                          <Users size={16} className="mr-1" />
                          <span className="text-sm font-medium">Guests</span>
                        </div>
                        <p className="text-gray-900 font-semibold">{booking.guests}</p>
                      </div>
                      <div>
                        <div className="flex items-center text-gray-600 mb-1">
                          <CreditCard size={16} className="mr-1" />
                          <span className="text-sm font-medium">Payment</span>
                        </div>
                        <p className="text-gray-900 font-semibold">
                          {getPaymentMethodLabel(booking.paymentMethod)}
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t">
                      <div>
                        <p className="text-sm text-gray-600">Total Price</p>
                        <p className="text-2xl font-bold text-primary-600">
                          Rp {booking.totalPrice.toLocaleString('id-ID')}
                        </p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="text-right mr-4">
                          <p className="text-sm text-gray-600">Booked on</p>
                          <p className="text-sm text-gray-900">
                            {new Date(booking.createdAt).toLocaleDateString('id-ID')}
                          </p>
                        </div>
                        
                        {booking.status === 'confirmed' && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleRescheduleBooking(booking)}
                              className="flex items-center space-x-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              <Edit size={16} />
                              <span>Reschedule</span>
                            </button>
                            <button
                              onClick={() => handleCancelBooking(booking.id)}
                              className="flex items-center space-x-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            >
                              <X size={16} />
                              <span>Cancel</span>
                            </button>
                          </div>
                        )}

                        {booking.status === 'reschedule_pending' && (
                          <div className="flex items-center space-x-2">
                            <div className="text-sm text-gray-600">
                              <p>Requested dates:</p>
                              <p className="font-semibold">
                                {booking.requestedCheckIn && booking.requestedCheckOut ? 
                                  `${new Date(booking.requestedCheckIn).toLocaleDateString('id-ID')} - ${new Date(booking.requestedCheckOut).toLocaleDateString('id-ID')}` :
                                  'N/A'
                                }
                              </p>
                              <p className="text-xs mt-1">Reason: {booking.rescheduleReason || 'N/A'}</p>
                            </div>
                            <button
                              onClick={() => handleCancelBooking(booking.id)}
                              className="flex items-center space-x-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            >
                              <X size={16} />
                              <span>Cancel</span>
                            </button>
                          </div>
                        )}
                        
                        {booking.status === 'rescheduled' && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleCancelBooking(booking.id)}
                              className="flex items-center space-x-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            >
                              <X size={16} />
                              <span>Cancel</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {showRescheduleModal && selectedBooking && (
        <RescheduleModal
          booking={selectedBooking}
          onClose={() => {
            setShowRescheduleModal(false)
            setSelectedBooking(null)
          }}
          onConfirm={handleConfirmReschedule}
        />
      )}

      {showCancelConfirm && (
        <ConfirmModal
          title="Cancel Booking"
          message="Are you sure you want to cancel this booking? This action cannot be undone."
          confirmText="Yes, Cancel"
          cancelText="Keep Booking"
          type="danger"
          onConfirm={confirmCancelBooking}
          onCancel={() => {
            setShowCancelConfirm(false)
            setBookingToCancel(null)
          }}
        />
      )}
    </div>
  )
}
