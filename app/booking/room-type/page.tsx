'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { Calendar, Users, CreditCard, Smartphone, Wallet } from 'lucide-react'
import { bookRoomType } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'

export default function BookRoomTypePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated } = useAuth()
  const { showSuccess, showError, showWarning } = useToast()
  
  const [hotelId, setHotelId] = useState<number | null>(null)
  const [roomType, setRoomType] = useState<string>('')
  const [roomPrice, setRoomPrice] = useState<number>(0)
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [guests, setGuests] = useState(1)
  const [paymentMethod, setPaymentMethod] = useState('')
  const [showPayment, setShowPayment] = useState(false)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    // Get params from URL
    const hotelIdParam = searchParams.get('hotelId')
    const typeParam = searchParams.get('type')
    const priceParam = searchParams.get('price')

    if (!hotelIdParam || !typeParam || !priceParam) {
      router.push('/')
      return
    }

    setHotelId(Number(hotelIdParam))
    setRoomType(typeParam)
    setRoomPrice(Number(priceParam))
  }, [isAuthenticated, searchParams])

  const calculateNights = () => {
    if (!checkIn || !checkOut) return 0
    const start = new Date(checkIn)
    const end = new Date(checkOut)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const calculateTotal = () => {
    return roomPrice * calculateNights()
  }

  const handleContinueToPayment = () => {
    if (!checkIn || !checkOut) {
      showWarning('Please fill in all booking details')
      return
    }
    if (calculateNights() < 1) {
      showWarning('Check-out date must be after check-in date')
      return
    }
    setShowPayment(true)
  }

  const handleConfirmBooking = async () => {
    if (!paymentMethod) {
      showWarning('Please select a payment method')
      return
    }

    if (!hotelId) {
      showError('Hotel information not found')
      return
    }

    setProcessing(true)
    try {
      await bookRoomType(hotelId, roomType, {
        hotelName: `Hotel ${hotelId}`, // This should be passed from previous page
        hotelLocation: 'Location', // This should be passed from previous page
        roomImage: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800',
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
      showError('Booking failed. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  if (!hotelId || !roomType) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600">Loading booking information...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Book {roomType} Room</h1>
          <p className="text-gray-600">Complete your booking details</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {!showPayment ? (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Booking Details</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
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

                <button
                  onClick={handleContinueToPayment}
                  className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
                >
                  Continue to Payment
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
                        <p className="text-sm text-gray-600">BCA, Mandiri, BRI, BNI</p>
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
                        <p className="text-sm text-gray-600">GoPay, OVO, DANA, ShopeePay</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <button
                    onClick={() => setShowPayment(false)}
                    className="flex-1 border-2 border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
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
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Booking Summary</h3>
              
              <div className="space-y-3 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Room Type:</span>
                  <span className="font-semibold text-gray-900">{roomType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Price per night:</span>
                  <span className="font-semibold text-gray-900">Rp {roomPrice.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Guests:</span>
                  <span className="font-semibold text-gray-900">{guests}</span>
                </div>
                {checkIn && checkOut && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Nights:</span>
                      <span className="font-semibold text-gray-900">{calculateNights()}</span>
                    </div>
                  </>
                )}
              </div>

              {checkIn && checkOut && (
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900">Total:</span>
                    <span className="text-2xl font-bold text-primary-600">
                      Rp {calculateTotal().toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
