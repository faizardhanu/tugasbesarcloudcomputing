'use client'

import { useState, useEffect } from 'react'
import { X, Calendar } from 'lucide-react'
import { useToast } from '@/context/ToastContext'

interface RescheduleModalProps {
  booking: any
  onClose: () => void
  onConfirm: (newCheckIn: string, newCheckOut: string, reason: string) => void
}

export default function RescheduleModal({ booking, onClose, onConfirm }: RescheduleModalProps) {
  const [newCheckIn, setNewCheckIn] = useState(booking.checkIn)
  const [newCheckOut, setNewCheckOut] = useState(booking.checkOut)
  const [reason, setReason] = useState('')
  const [processing, setProcessing] = useState(false)
  const { showWarning } = useToast()

  // Hitung durasi menginap original
  const calculateStayDuration = (checkIn: string, checkOut: string) => {
    const checkInDate = new Date(checkIn)
    const checkOutDate = new Date(checkOut)
    const diffTime = checkOutDate.getTime() - checkInDate.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const originalDuration = calculateStayDuration(booking.checkIn, booking.checkOut)

  // Auto-update check-out date ketika check-in berubah
  useEffect(() => {
    if (newCheckIn) {
      const checkInDate = new Date(newCheckIn)
      const checkOutDate = new Date(checkInDate)
      checkOutDate.setDate(checkInDate.getDate() + originalDuration)
      setNewCheckOut(checkOutDate.toISOString().split('T')[0])
    }
  }, [newCheckIn, originalDuration])

  const handleSubmit = async () => {
    const newDuration = calculateStayDuration(newCheckIn, newCheckOut)
    
    if (newDuration !== originalDuration) {
      showWarning(`Duration must remain ${originalDuration} day(s). Please select a different check-in date.`)
      return
    }

    if (!reason.trim()) {
      showWarning('Please provide a reason for rescheduling')
      return
    }

    setProcessing(true)
    try {
      await onConfirm(newCheckIn, newCheckOut, reason)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="bg-primary-100 p-2 rounded-full">
              <Calendar className="text-primary-600" size={24} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Reschedule Booking</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-4">
            <h3 className="font-semibold text-gray-900 mb-2">{booking.roomName}</h3>
            <p className="text-gray-600">{booking.hotelName}</p>
            <div className="mt-2 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Original Duration:</strong> {originalDuration} day(s)
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Reschedule will maintain the same duration
              </p>
            </div>
          </div>

          <div className="space-y-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Check-in Date
              </label>
              <input
                type="date"
                value={newCheckIn}
                onChange={(e) => setNewCheckIn(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Check-out Date (Auto-calculated)
              </label>
              <input
                type="date"
                value={newCheckOut}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">
                Check-out date is automatically set to maintain {originalDuration} day(s) duration
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Rescheduling *
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Please provide a reason for your reschedule request..."
                rows={4}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none text-gray-900 bg-white"
              />
              <p className="text-xs text-gray-500 mt-1">
                Your request will be reviewed by hotel management
              </p>
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={processing}
              className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {processing ? 'Processing...' : 'Reschedule'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
