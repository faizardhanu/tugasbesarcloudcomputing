'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { MapPin, Star, Wifi, Coffee, Tv, Wind, Users, Bed } from 'lucide-react'
import { getHotelById, getRoomsByHotelId } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { useNavigationHistory } from '@/hooks/useNavigationHistory'
import LoginModal from '@/components/LoginModal'
import ImageSlider from '@/components/ImageSlider'
import BackButton from '@/components/BackButton'
import RoomSelectionModal from '@/components/RoomSelectionModal'
import ConfirmModal from '@/components/ConfirmModal'

interface Hotel {
  id: number
  name: string
  location: string
  rating: number
  image: string
  images: string[]
  description: string
  amenities: string[]
  startingPrice?: number
}

interface RoomType {
  type: string
  name: string
  price: number
  capacity: number
  beds: number
  image: string
  description: string
  amenities: string[]
  hotelId: number
  hotelName: string
  totalRooms: number
  availableRooms: number
  roomIds: number[]
  availableRoomData: any[]
}

export default function HotelDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const [hotel, setHotel] = useState<Hotel | null>(null)
  const [rooms, setRooms] = useState<RoomType[]>([])
  const [loading, setLoading] = useState(true)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showRoomSelection, setShowRoomSelection] = useState(false)
  const [selectedRoomType, setSelectedRoomType] = useState<RoomType | null>(null)

  useEffect(() => {
    loadHotelData()
    
    // Restore scroll position after page load
    const savedScrollPos = sessionStorage.getItem(`hotelScroll_${params.id}`)
    if (savedScrollPos) {
      setTimeout(() => {
        window.scrollTo(0, parseInt(savedScrollPos))
      }, 100)
    }
  }, [params.id])

  // Save scroll position before leaving page
  useEffect(() => {
    const handleScroll = () => {
      sessionStorage.setItem(`hotelScroll_${params.id}`, window.scrollY.toString())
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [params.id])

  // Refresh room data when user comes back to page (after booking)
  useEffect(() => {
    const handleFocus = () => {
      if (hotel) {
        loadRoomData()
      }
    }
    
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [hotel])

  const loadRoomData = async () => {
    try {
      const roomsData = await getRoomsByHotelId(Number(params.id))
      setRooms(roomsData)
    } catch (error) {
      console.error('Failed to load rooms:', error)
    }
  }

  const loadHotelData = async () => {
    try {
      const hotelData = await getHotelById(Number(params.id))
      const roomsData = await getRoomsByHotelId(Number(params.id))
      setHotel(hotelData)
      setRooms(roomsData)
    } catch (error) {
      console.error('Failed to load hotel data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBookRoom = (roomType: RoomType) => {
    if (!isAuthenticated) {
      setShowLoginModal(true)
      return
    }
    setSelectedRoomType(roomType)
    setShowRoomSelection(true)
  }

  const handleSelectRoom = (roomId: number) => {
    setShowRoomSelection(false)
    setSelectedRoomType(null)
    router.push(`/booking/${roomId}`)
  }


  const getAmenityIcon = (amenity: string) => {
    const icons: { [key: string]: any } = {
      'WiFi': Wifi,
      'Coffee': Coffee,
      'TV': Tv,
      'AC': Wind,
    }
    const Icon = icons[amenity] || Wifi
    return <Icon size={20} />
  }

  const getRoomNumbersPreview = (roomType: RoomType) => {
    if (!roomType.availableRoomData || roomType.availableRoomData.length === 0) {
      return ''
    }

    const numbers = roomType.availableRoomData
      .map((room: any) => room.roomNumber || room.room_number)
      .filter((n: string | undefined) => !!n)

    const uniqueNumbers = Array.from(new Set(numbers))
    const preview = uniqueNumbers.slice(0, 5)
    let text = preview.join(', ')

    if (uniqueNumbers.length > 5) {
      text += `, +${uniqueNumbers.length - 5} more`
    }

    return text
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading hotel details...</p>
        </div>
      </div>
    )
  }

  if (!hotel) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600">Hotel not found</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Hotel Header with Image Slider */}
        <div className="relative">
          <ImageSlider images={hotel.images} alt={hotel.name} />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/50 to-transparent p-8">
            <div className="max-w-7xl mx-auto">
              <h1 className="text-5xl font-bold mb-2 text-white drop-shadow-lg">{hotel.name}</h1>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center text-white drop-shadow-md">
                    <MapPin size={20} className="mr-1 text-white" />
                    <span className="text-lg text-white">{hotel.location}</span>
                  </div>
                  <div className="flex items-center text-white drop-shadow-md">
                    <Star size={20} className="text-yellow-400 fill-current mr-1" />
                    <span className="text-lg font-semibold text-white">{hotel.rating}</span>
                  </div>
                </div>
                {hotel.startingPrice && (
                  <div className="text-right text-white drop-shadow-md">
                    <div className="text-sm text-white/90">Starting from</div>
                    <div className="text-2xl font-bold text-white">
                      Rp {hotel.startingPrice.toLocaleString('id-ID')}
                    </div>
                    <div className="text-sm text-white/90">per night</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Hotel Info */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-6">
            <BackButton fallbackPath="/">
              Back to Hotels
            </BackButton>
          </div>
          <div className="bg-white rounded-lg shadow-md p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">About This Hotel</h2>
            <p className="text-gray-700 mb-6">{hotel.description}</p>
            
            <h3 className="text-xl font-bold text-gray-900 mb-3">Amenities</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {hotel.amenities.map((amenity, index) => (
                <div key={index} className="flex items-center space-x-2 text-gray-700">
                  {getAmenityIcon(amenity)}
                  <span>{amenity}</span>
                </div>
              ))}
            </div>
          </div>


          {/* Available Rooms */}
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Available Rooms</h2>
            <div className="space-y-6">
              {rooms.map((roomType, index) => (
                <div key={`${roomType.type}-${index}`} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="flex flex-col md:flex-row">
                    <div className="relative w-full md:w-80 h-64">
                      <Image
                        src={roomType.image}
                        alt={roomType.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900 mb-2">{roomType.name}</h3>
                          <p className="text-gray-600 mb-3">{roomType.description}</p>
                          <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold inline-block">
                            {roomType.availableRooms} room{roomType.availableRooms > 1 ? 's' : ''} left
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-bold text-primary-600">
                            Rp {roomType.price.toLocaleString('id-ID')}
                          </div>
                          <div className="text-gray-500 text-sm">per night</div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-6 mb-4 text-gray-700">
                        <div className="flex items-center space-x-2">
                          <Users size={20} />
                          <span>{roomType.capacity} Guests</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Bed size={20} />
                          <span>{roomType.beds} Bed{roomType.beds > 1 ? 's' : ''}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {roomType.amenities.map((amenity: string, amenityIndex: number) => (
                          <span
                            key={amenityIndex}
                            className="inline-flex items-center space-x-1 bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                          >
                            {getAmenityIcon(amenity)}
                            <span>{amenity}</span>
                          </span>
                        ))}
                      </div>

                      {getRoomNumbersPreview(roomType) && (
                        <div className="mb-4 text-sm text-gray-600">
                          <span className="font-semibold">Room numbers: </span>
                          {getRoomNumbersPreview(roomType)}
                        </div>
                      )}

                      <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-600">
                          <span className="text-blue-600 font-semibold">
                            {roomType.type} • {roomType.totalRooms} total rooms
                          </span>
                        </div>
                        <button
                          onClick={() => handleBookRoom(roomType)}
                          className="bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
                        >
                          Book Now
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} />}
      
      {showRoomSelection && selectedRoomType && (
        <RoomSelectionModal
          roomType={selectedRoomType}
          onClose={() => {
            setShowRoomSelection(false)
            setSelectedRoomType(null)
          }}
          onSelectRoom={handleSelectRoom}
        />
      )}

    </>
  )
}
