'use client'

import { useState } from 'react'
import { X, MapPin } from 'lucide-react'

interface RoomSelectionModalProps {
  roomType: any
  onClose: () => void
  onSelectRoom: (roomId: number) => void
}

export default function RoomSelectionModal({ roomType, onClose, onSelectRoom }: RoomSelectionModalProps) {
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null)

  // Debug: Log room data
  console.log('RoomSelectionModal - roomType:', roomType)
  console.log('RoomSelectionModal - availableRoomData:', roomType.availableRoomData)

  const handleConfirm = () => {
    if (selectedRoomId) {
      onSelectRoom(selectedRoomId)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Select Room</h2>
            <p className="text-gray-600 mt-1">{roomType.name}</p>
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
            <div className="flex items-center text-gray-600 mb-2">
              <MapPin size={16} className="mr-1" />
              <span className="text-sm">{roomType.hotelName}</span>
            </div>
            <p className="text-lg font-semibold text-primary-600">
              Rp {roomType.price.toLocaleString('id-ID')} / night
            </p>
          </div>

          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3" style={{ color: '#111827 !important' }}>
              Available Rooms ({roomType.availableRooms || 0}):
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {roomType.availableRoomData && roomType.availableRoomData.length > 0 ? (
                roomType.availableRoomData.map((room: any) => (
                  <button
                    key={room.id}
                    onClick={() => setSelectedRoomId(room.id)}
                    className={`p-3 border-2 rounded-lg text-center font-semibold transition-colors ${
                      selectedRoomId === room.id
                        ? 'border-primary-600 bg-primary-50 text-primary-700'
                        : 'border-gray-300 hover:border-primary-300 text-gray-700'
                    }`}
                    style={{
                      color: selectedRoomId === room.id ? '#b91c1c !important' : '#374151 !important',
                      backgroundColor: selectedRoomId === room.id ? '#fef2f2 !important' : '#ffffff !important',
                      borderColor: selectedRoomId === room.id ? '#dc2626 !important' : '#d1d5db !important',
                      fontSize: '16px !important',
                      fontWeight: '600 !important',
                      minHeight: '48px !important',
                      display: 'flex !important',
                      alignItems: 'center !important',
                      justifyContent: 'center !important'
                    }}
                  >
                    <span style={{ 
                      color: 'inherit !important',
                      fontSize: '16px !important',
                      fontWeight: '600 !important',
                      textShadow: '0 0 1px rgba(0,0,0,0.1) !important'
                    }}>
                      {room.roomNumber || room.room_number || `Room ${room.id}`}
                    </span>
                  </button>
                ))
              ) : (
                <div className="col-span-3">
                  <p className="text-gray-500 text-center py-4" style={{ color: '#6b7280 !important' }}>
                    No rooms available
                  </p>
                </div>
              )}
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
              onClick={handleConfirm}
              disabled={!selectedRoomId}
              className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
