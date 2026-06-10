'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { Calendar, Users, CreditCard, Smartphone, Wallet } from 'lucide-react'
import { getRoomById, createBooking } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { useNavigationHistory } from '@/hooks/useNavigationHistory'
import ConfirmModal from '@/components/ConfirmModal'
import BackButton from '@/components/BackButton'

interface Room {
  id: number
  hotelId: number
  hotelName: string
  name: string
  type: string
  price: number
  capacity: number
  image: string
  description: string
}

export default function BookingPage() {
  const params = useParams()
  const router = useRouter()
  const { isAuthenticated, loading: authLoading } = useAuth()
  const { showSuccess, showError, showWarning } = useToast()
  const [room, setRoom] = useState<Room | null>(null)
  const [loading, setLoading] = useState(true)
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [guests, setGuests] = useState(1)
  const [paymentMethod, setPaymentMethod] = useState('')
  const [showPayment, setShowPayment] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [showUnavailableModal, setShowUnavailableModal] = useState(false)
  const [unavailableMessage, setUnavailableMessage] = useState('')
  const [roomAvailable, setRoomAvailable] = useState(false)

  useEffect(() => {
    // Wait for auth to load before checking
    if (authLoading) return
    
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    
    // Get dates from URL params if available
    const urlParams = new URLSearchParams(window.location.search)
    const urlCheckIn = urlParams.get('checkIn')
    const urlCheckOut = urlParams.get('checkOut')
    const urlGuests = urlParams.get('guests')
    
    if (urlCheckIn) setCheckIn(urlCheckIn)
    if (urlCheckOut) setCheckOut(urlCheckOut)
    if (urlGuests) setGuests(Number(urlGuests))
    
    // Load room data after setting dates
    setTimeout(() => {
      if (urlCheckIn && urlCheckOut) {
        loadRoomData()
      } else {
        // If no dates provided, just load room info without date validation
        loadRoomDataWithoutDates()
      }
    }, 100)
  }, [isAuthenticated, authLoading])

  const loadRoomDataWithoutDates = async () => {
    try {
      const roomData = await getRoomById(Number(params.roomId))
      setRoom(roomData)
      setRoomAvailable(false) // Keep disabled until dates are selected
    } catch (error) {
      console.error('Failed to load room data:', error)
      showError('Failed to load room information')
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  // Reload room data when dates change
  useEffect(() => {
    if (checkIn && checkOut) {
      // Check if dates are valid first
      if (calculateNights() <= 0) {
        setRoomAvailable(false)
        return
      }
      
      // Reset availability state when dates change
      setRoomAvailable(false) // Set to false first, will be set to true if room is available
      loadRoomData()
    }
  }, [checkIn, checkOut])

  const loadRoomData = async () => {
    try {
      const roomData = await getRoomById(Number(params.roomId), checkIn || undefined, checkOut || undefined)
      setRoom(roomData)
      setRoomAvailable(true)
    } catch (error) {
      console.error('Failed to load room data:', error)
      const errorMessage = error instanceof Error ? error.message : 'This room is not available'
      setUnavailableMessage(errorMessage)
      setShowUnavailableModal(true)
      setRoomAvailable(false)
      setShowPayment(false) // Hide payment section if room not available
    } finally {
      setLoading(false)
    }
  }

  const calculateNights = () => {
    if (!checkIn || !checkOut) return 0
    const start = new Date(checkIn)
    const end = new Date(checkOut)
    const diffTime = end.getTime() - start.getTime() // Remove Math.abs to allow negative values
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const calculateTotal = () => {
    if (!room) return 0
    const nights = calculateNights()
    if (nights <= 0) return 0 // Prevent negative total
    return room.price * nights
  }

  const handleContinueToPayment = () => {
    if (!checkIn || !checkOut || guests < 1) {
      showWarning('Please fill in all booking details')
      return
    }
    if (calculateNights() < 1) {
      showWarning('Check-out date must be after check-in date')
      return
    }
    if (!roomAvailable) {
      showWarning('Room is not available for the selected dates')
      return
    }
    setShowPayment(true)
  }

  // Check if button should be disabled
  const isButtonDisabled = !checkIn || !checkOut || !roomAvailable || calculateNights() < 1

  const handleConfirmBooking = async () => {
    if (!paymentMethod) {
      showWarning('Please select a payment method')
      return
    }

    if (!room) {
      showError('Room data not found')
      return
    }

    setProcessing(true)
    try {
      await createBooking({
        roomId: Number(params.roomId),
        roomName: room.name,
        hotelName: room.hotelName,
        hotelLocation: room.hotelName.includes('Jakarta') ? 'Jakarta Pusat' :
                      room.hotelName.includes('Bali') ? 'Seminyak, Bali' :
                      room.hotelName.includes('Bandung') ? 'Lembang, Bandung' :
                      room.hotelName.includes('Surabaya') ? 'Surabaya' :
                      room.hotelName.includes('Yogyakarta') ? 'Malioboro, Yogyakarta' :
                      room.hotelName.includes('Lombok') ? 'Senggigi, Lombok' : 'Unknown',
        roomImage: room.image,
        checkIn,
        checkOut,
        guests,
        paymentMethod,
        totalPrice: calculateTotal(),
      })
      
      showSuccess('Booking confirmed! Redirecting to your bookings...')
      setTimeout(() => router.push('/bookings'), 2000)
    } catch (error) {
      console.error('Booking failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Booking failed. Please try again.'
      
      // If it's a date availability error, show modal instead of toast
      if (errorMessage.includes('not available for the selected dates')) {
        setUnavailableMessage(errorMessage)
        setShowUnavailableModal(true)
      } else {
        showError(errorMessage)
      }
    } finally {
      setProcessing(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading booking details...</p>
        </div>
      </div>
    )
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600">Room not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <BackButton fallbackPath={`/hotels/${room.hotelId}`}>
            Back to Hotel
          </BackButton>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Complete Your Booking</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Booking Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Room Details */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Room Details</h2>
              <div className="flex space-x-4">
                <div className="relative w-32 h-32 flex-shrink-0">
                  <Image
                    src={room.image}
                    alt={room.name}
                    fill
                    className="object-cover rounded-lg"
                  />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{room.name}</h3>
                  <p className="text-gray-600">{room.hotelName}</p>
                  <p className="text-gray-600 mt-2">{room.description}</p>
                  <p className="text-lg font-semibold text-primary-600 mt-2">
                    Rp {room.price.toLocaleString('id-ID')} / night
                  </p>
                </div>
              </div>
            </div>

            {/* Booking Details */}
            {!showPayment ? (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">Booking Details</h2>
                  {!roomAvailable && (
                    <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-semibold">
                      Not Available
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      <Calendar className="inline mr-2" size={20} />
                      Check-in Date
                    </label>
                    <input
                      type="date"
                      value={checkIn}
                      onChange={(e) => setCheckIn(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      <Calendar className="inline mr-2" size={20} />
                      Check-out Date
                    </label>
                    <input
                      type="date"
                      value={checkOut}
                      onChange={(e) => setCheckOut(e.target.value)}
                      min={checkIn || new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                {/* Date validation warning */}
                {checkIn && checkOut && calculateNights() <= 0 && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-800 text-sm font-medium">
                      Warning: Check-out date must be after check-in date
                    </p>
                  </div>
                )}

                <div className="mb-6">
                  <label className="block text-gray-700 font-medium mb-2">
                    <Users className="inline mr-2" size={20} />
                    Number of Guests
                  </label>
                  <input
                    type="number"
                    value={guests}
                    onChange={(e) => setGuests(Number(e.target.value))}
                    min="1"
                    max={room.capacity}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <p className="text-sm text-gray-500 mt-1">Maximum {room.capacity} guests</p>
                </div>

                <button
                  onClick={handleContinueToPayment}
                  disabled={isButtonDisabled}
                  className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                    isButtonDisabled 
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                      : 'bg-primary-600 text-white hover:bg-primary-700'
                  }`}
                >
                  {!checkIn || !checkOut ? 'Please Select Dates' :
                   calculateNights() < 1 ? 'Invalid Date Range' :
                   !roomAvailable ? 'Room Not Available' : 
                   'Continue to Payment'}
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Payment Method</h2>
                
                <div className="space-y-3 mb-6">
                  <div
                    onClick={() => setPaymentMethod('credit-card')}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                      paymentMethod === 'credit-card'
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-gray-300 hover:border-primary-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <CreditCard className="text-primary-600" size={24} />
                      <div>
                        <p className="font-semibold text-gray-900">Credit Card</p>
                        <p className="text-sm text-gray-600">Visa, Mastercard, JCB</p>
                      </div>
                    </div>
                  </div>

                  <div
                    onClick={() => setPaymentMethod('mbanking')}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                      paymentMethod === 'mbanking'
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-gray-300 hover:border-primary-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Smartphone className="text-primary-600" size={24} />
                      <div>
                        <p className="font-semibold text-gray-900">Mobile Banking</p>
                        <p className="text-sm text-gray-600">BCA, Mandiri, BNI, BRI</p>
                      </div>
                    </div>
                  </div>

                  <div
                    onClick={() => setPaymentMethod('ewallet')}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                      paymentMethod === 'ewallet'
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-gray-300 hover:border-primary-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Wallet className="text-primary-600" size={24} />
                      <div>
                        <p className="font-semibold text-gray-900">E-Wallet</p>
                        <p className="text-sm text-gray-600">GoPay, OVO, Dana, ShopeePay</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <button
                    onClick={() => setShowPayment(false)}
                    className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleConfirmBooking}
                    disabled={processing}
                    className="flex-1 bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50"
                  >
                    {processing ? 'Processing...' : 'Confirm Booking'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Booking Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-20">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Booking Summary</h2>
              
              <div className="space-y-3 mb-4 pb-4 border-b">
                <div className="flex justify-between text-gray-700">
                  <span>Check-in:</span>
                  <span className="font-semibold">
                    {checkIn ? new Date(checkIn).toLocaleDateString('id-ID') : '-'}
                  </span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Check-out:</span>
                  <span className="font-semibold">
                    {checkOut ? new Date(checkOut).toLocaleDateString('id-ID') : '-'}
                  </span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Guests:</span>
                  <span className="font-semibold">{guests}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Nights:</span>
                  <span className="font-semibold">{calculateNights()}</span>
                </div>
              </div>

              <div className="space-y-3 mb-4 pb-4 border-b">
                <div className="flex justify-between text-gray-700">
                  <span>Price per night:</span>
                  <span>Rp {room.price.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Subtotal ({calculateNights()} nights):</span>
                  <span>Rp {calculateTotal().toLocaleString('id-ID')}</span>
                </div>
              </div>

              <div className="flex justify-between text-xl font-bold text-gray-900">
                <span>Total:</span>
                <span className="text-primary-600">Rp {calculateTotal().toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Room Unavailable Modal */}
      {showUnavailableModal && (
        <ConfirmModal
          title="Room Not Available"
          message={unavailableMessage + " Please select different dates or choose another room."}
          confirmText="Back to Hotel"
          cancelText="Try Different Dates"
          type="warning"
          onConfirm={() => {
            setShowUnavailableModal(false)
            router.push(`/hotels/${room?.hotelId || ''}`)
          }}
          onCancel={() => {
            setShowUnavailableModal(false)
            // Don't reset roomAvailable here - keep button disabled until user changes dates
          }}
        />
      )}
    </div>
  )
}
