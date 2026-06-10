'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bed, Plus, Edit, Trash2, Search, Filter, MapPin, Users } from 'lucide-react'
import { getAllRooms, getHotels, createRoom, updateRoom, deleteRoom, createRoomType } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import BackButton from '@/components/BackButton'

interface Room {
  id: number
  hotelId: number
  roomNumber: string
  name: string
  type: string
  price: number
  capacity: number
  beds: number
  image: string
  description: string
  amenities: string[]
  available: boolean
}

interface Hotel {
  id: number
  name: string
  location: string
}

interface RoomTypeItem {
  id: number
  hotelId: number
  name: string
  base_type: string
  price: number
  capacity: number
  beds: number
  image: string
  description: string
  amenities: string[]
}

export default function RoomManagement() {
  const router = useRouter()
  const { isAuthenticated, isStaff, loading: authLoading } = useAuth()
  const { showSuccess, showError } = useToast()
  
  const [rooms, setRooms] = useState<Room[]>([])
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [showRoomTypeModal, setShowRoomTypeModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLocation, setSelectedLocation] = useState<string>('')
  const [selectedHotel, setSelectedHotel] = useState<string>('')
  const [selectedType, setSelectedType] = useState<string>('')
  const [viewMode, setViewMode] = useState<'hierarchy' | 'table'>('hierarchy')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingRoom, setEditingRoom] = useState<Room | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null)

  const [roomTypeFormData, setRoomTypeFormData] = useState({
    hotelId: '',
    name: '',
    baseType: '',
    price: '',
    capacity: '',
    beds: '',
    image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800',
    description: '',
    amenities: [] as string[],
  })

  const [formData, setFormData] = useState({
    hotelId: '',
    roomNumber: '',
    name: '',
    type: '',
    price: '',
    capacity: '',
    beds: '',
    image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800',
    description: '',
    amenities: [] as string[],
    available: true
  })

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
      const [roomsData, hotelsData] = await Promise.all([
        getAllRooms(),
        getHotels()
      ])
      
      setRooms(roomsData || [])
      setHotels(hotelsData || [])
    } catch (error) {
      console.error('Failed to load data:', error)
      showError('Failed to load room data')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      hotelId: '',
      roomNumber: '',
      name: '',
      type: '',
      price: '',
      capacity: '',
      beds: '',
      image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800',
      description: '',
      amenities: [],
      available: true
    })
    setEditingRoom(null)
    setShowAddModal(false)
  }

  const handleAddRoom = () => {
    setRoomTypeFormData({
      hotelId: '',
      name: '',
      baseType: '',
      price: '',
      capacity: '',
      beds: '',
      image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800',
      description: '',
      amenities: [],
    })
    setShowRoomTypeModal(true)
  }

  const handleEditRoom = (room: Room) => {
    setFormData({
      hotelId: room.hotelId.toString(),
      roomNumber: room.roomNumber,
      name: room.name,
      type: room.type,
      price: room.price.toString(),
      capacity: room.capacity.toString(),
      beds: room.beds.toString(),
      image: room.image,
      description: room.description,
      amenities: [...room.amenities],
      available: room.available
    })
    setEditingRoom(room)
    setShowAddModal(true)
  }

  const handleDeleteRoom = (room: Room) => {
    setRoomToDelete(room)
    setShowDeleteModal(true)
  }

  const handleSubmitRoomType = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const missingFields = []
      if (!roomTypeFormData.hotelId || roomTypeFormData.hotelId.trim() === '') missingFields.push('Hotel')
      if (!roomTypeFormData.name || roomTypeFormData.name.trim() === '') missingFields.push('Room Type Name')
      if (!roomTypeFormData.baseType || roomTypeFormData.baseType.trim() === '') missingFields.push('Base Type')
      if (!roomTypeFormData.price || roomTypeFormData.price.trim() === '') missingFields.push('Price')
      if (!roomTypeFormData.capacity || roomTypeFormData.capacity.trim() === '') missingFields.push('Capacity')
      if (!roomTypeFormData.beds || roomTypeFormData.beds.trim() === '') missingFields.push('Beds')

      if (missingFields.length > 0) {
        showError(`Please fill in these required fields: ${missingFields.join(', ')}`)
        return
      }

      const hotelIdNum = parseInt(roomTypeFormData.hotelId)
      const priceNum = parseFloat(roomTypeFormData.price)
      const capacityNum = parseInt(roomTypeFormData.capacity)
      const bedsNum = parseInt(roomTypeFormData.beds)

      if (isNaN(hotelIdNum) || hotelIdNum <= 0) {
        showError('Please select a valid hotel')
        return
      }
      if (isNaN(priceNum) || priceNum <= 0) {
        showError('Please enter a valid price')
        return
      }
      if (isNaN(capacityNum) || capacityNum <= 0) {
        showError('Please enter a valid capacity')
        return
      }
      if (isNaN(bedsNum) || bedsNum <= 0) {
        showError('Please enter a valid number of beds')
        return
      }

      const roomTypeData = {
        hotel_id: hotelIdNum,
        name: roomTypeFormData.name,
        base_type: roomTypeFormData.baseType,
        price: priceNum,
        capacity: capacityNum,
        beds: bedsNum,
        image: roomTypeFormData.image || 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800',
        description: roomTypeFormData.description || '',
        amenities: roomTypeFormData.amenities || [],
      }

      await createRoomType(roomTypeData)
      showSuccess('Room type created successfully')

      setShowRoomTypeModal(false)
    } catch (error: any) {
      console.error('Failed to save room type:', error)
      showError(error.message || 'Failed to save room type')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      // Validate required fields with detailed logging
      console.log('Form data validation:', {
        hotelId: formData.hotelId,
        roomNumber: formData.roomNumber,
        name: formData.name,
        type: formData.type,
        price: formData.price,
        capacity: formData.capacity,
        beds: formData.beds
      })

      const missingFields = []
      if (!formData.hotelId || formData.hotelId.trim() === '') missingFields.push('Hotel')
      if (!formData.roomNumber || formData.roomNumber.trim() === '') missingFields.push('Room Number')
      if (!formData.name || formData.name.trim() === '') missingFields.push('Name')
      if (!formData.type || formData.type.trim() === '') missingFields.push('Type')
      if (!formData.price || formData.price.trim() === '') missingFields.push('Price')
      if (!formData.capacity || formData.capacity.trim() === '') missingFields.push('Capacity')
      if (!formData.beds || formData.beds.trim() === '') missingFields.push('Beds')

      if (missingFields.length > 0) {
        console.log('Missing fields:', missingFields)
        showError(`Please fill in these required fields: ${missingFields.join(', ')}`)
        return
      }

      // Validate numeric fields
      const hotelIdNum = parseInt(formData.hotelId)
      const priceNum = parseFloat(formData.price)
      const capacityNum = parseInt(formData.capacity)
      const bedsNum = parseInt(formData.beds)

      if (isNaN(hotelIdNum) || hotelIdNum <= 0) {
        showError('Please select a valid hotel')
        return
      }
      if (isNaN(priceNum) || priceNum <= 0) {
        showError('Please enter a valid price')
        return
      }
      if (isNaN(capacityNum) || capacityNum <= 0) {
        showError('Please enter a valid capacity')
        return
      }
      if (isNaN(bedsNum) || bedsNum <= 0) {
        showError('Please enter a valid number of beds')
        return
      }

      const roomData = {
        hotel_id: parseInt(formData.hotelId),
        room_number: formData.roomNumber,
        name: formData.name,
        type: formData.type,
        price: parseFloat(formData.price),
        capacity: parseInt(formData.capacity),
        beds: parseInt(formData.beds),
        image: formData.image || 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800',
        description: formData.description || '',
        amenities: formData.amenities || [],
        available: formData.available
      }

      console.log('Sending room data:', roomData)

      if (editingRoom) {
        const result = await updateRoom(editingRoom.id, roomData)
        console.log('Update result:', result)
        showSuccess('Room updated successfully')
      } else {
        const result = await createRoom(roomData)
        console.log('Create result:', result)
        showSuccess('Room created successfully')
      }

      setShowAddModal(false)
      loadData()
    } catch (error: any) {
      console.error('Failed to save room:', error)
      console.error('Error details:', error.response?.data)
      showError(error.message || 'Failed to save room')
    }
  }

  const confirmDelete = async () => {
    if (!roomToDelete) return

    try {
      await deleteRoom(roomToDelete.id)
      showSuccess('Room deleted successfully')
      setShowDeleteModal(false)
      setRoomToDelete(null)
      loadData()
    } catch (error) {
      console.error('Failed to delete room:', error)
      showError('Failed to delete room')
    }
  }

  const filteredRooms = rooms.filter(room => {
    const hotel = hotels.find(h => h.id === room.hotelId)
    const matchesSearch = room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         room.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         room.roomNumber.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesLocation = !selectedLocation || hotel?.location.toLowerCase().includes(selectedLocation.toLowerCase())
    const matchesHotel = !selectedHotel || room.hotelId.toString() === selectedHotel
    const matchesType = !selectedType || room.type === selectedType
    
    return matchesSearch && matchesLocation && matchesHotel && matchesType
  })

  const roomTypes = Array.from(new Set(rooms.map(room => room.type)))
  const locations = Array.from(new Set(hotels.map(hotel => hotel.location)))

  // Group rooms hierarchically
  const groupedRooms = () => {
    const grouped: { [location: string]: { [hotelName: string]: { [roomType: string]: Room[] } } } = {}
    
    filteredRooms.forEach(room => {
      const hotel = hotels.find(h => h.id === room.hotelId)
      if (!hotel) return
      
      const location = hotel.location
      const hotelName = hotel.name
      const roomType = room.type
      
      if (!grouped[location]) grouped[location] = {}
      if (!grouped[location][hotelName]) grouped[location][hotelName] = {}
      if (!grouped[location][hotelName][roomType]) grouped[location][hotelName][roomType] = []
      
      grouped[location][hotelName][roomType].push(room)
    })
    
    return grouped
  }

  const handleAddRoomForType = (hotelId: number, roomType: string, templateRoom?: Room) => {
    setFormData({
      hotelId: hotelId.toString(),
      roomNumber: '',
      name: templateRoom ? templateRoom.name : `${roomType} Room`,
      type: roomType,
      price: templateRoom ? templateRoom.price.toString() : '',
      capacity: templateRoom ? templateRoom.capacity.toString() : '',
      beds: templateRoom ? templateRoom.beds.toString() : '',
      image: templateRoom
        ? templateRoom.image
        : 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800',
      description: templateRoom ? templateRoom.description : '',
      amenities: templateRoom ? [...templateRoom.amenities] : [],
      available: true
    })
    setEditingRoom(null)
    setShowAddModal(true)
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading room management...</p>
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
            <h1 className="text-4xl font-bold text-gray-900">Room Management</h1>
            <p className="text-gray-600 mt-2">Manage hotel rooms and availability</p>
          </div>
          <button
            onClick={handleAddRoom}
            className="bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors flex items-center space-x-2"
            style={{ backgroundColor: '#dc2626', color: 'white' }}
          >
            <Plus size={20} className="text-white" />
            <span className="staff-text-white">Add Room Type</span>
          </button>
        </div>

        {/* View Mode Toggle */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">View Options</h3>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('hierarchy')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'hierarchy'
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                style={viewMode === 'hierarchy' ? { backgroundColor: '#dc2626', color: 'white' } : {}}
              >
                <span className={viewMode === 'hierarchy' ? 'staff-text-white' : ''}>Hierarchy View</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'table'
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                style={viewMode === 'table' ? { backgroundColor: '#dc2626', color: 'white' } : {}}
              >
                <span className={viewMode === 'table' ? 'staff-text-white' : ''}>Table View</span>
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search rooms..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Locations</option>
              {locations.map(location => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
            
            <select
              value={selectedHotel}
              onChange={(e) => setSelectedHotel(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Hotels</option>
              {hotels.map(hotel => (
                <option key={hotel.id} value={hotel.id.toString()}>
                  {hotel.name}
                </option>
              ))}
            </select>

            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Room Types</option>
              {roomTypes.map(type => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Room Display */}
        {viewMode === 'hierarchy' ? (
          /* Hierarchical View */
          <div className="space-y-6">
            {Object.entries(groupedRooms()).map(([location, hotels]) => (
              <div key={location} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                  <h2 className="text-xl font-bold text-white flex items-center">
                    <MapPin className="mr-2 text-white" size={24} />
                    {location}
                  </h2>
                </div>
                
                <div className="p-6 space-y-6">
                  {Object.entries(hotels).map(([hotelName, roomTypes]) => (
                    <div key={hotelName} className="border border-gray-200 rounded-lg">
                      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                          <Bed className="mr-2 text-gray-600" size={20} />
                          {hotelName}
                        </h3>
                      </div>
                      
                      <div className="p-4 space-y-4">
                        {Object.entries(roomTypes).map(([roomType, rooms]) => (
                          <div key={roomType} className="border-l-4 border-primary-500 pl-4">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-md font-medium text-gray-800 flex items-center">
                                <Users className="mr-2 text-primary-600" size={16} />
                                {roomType} ({rooms.length} rooms)
                              </h4>
                              {rooms.length > 0 && (
                                <button
                                  onClick={() => handleAddRoomForType(rooms[0].hotelId, roomType, rooms[0])}
                                  className="text-xs font-medium text-primary-600 hover:text-primary-800"
                                >
                                  + Add Room
                                </button>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {rooms.map((room) => (
                                <div key={room.id} className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                                  <div className="flex justify-between items-start mb-2">
                                    <div>
                                      <div className="font-medium text-gray-900">Room {room.roomNumber}</div>
                                      <div className="text-sm text-gray-600">{room.name}</div>
                                    </div>
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                      room.available 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-red-100 text-red-800'
                                    }`}>
                                      {room.available ? 'Available' : 'Occupied'}
                                    </span>
                                  </div>
                                  
                                  <div className="text-sm text-gray-600 mb-2">
                                    <div>Rp {room.price.toLocaleString('id-ID')}/night</div>
                                    <div>{room.capacity} guests • {room.beds} beds</div>
                                  </div>
                                  
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() => handleEditRoom(room)}
                                      className="flex-1 bg-primary-600 text-white px-2 py-1 rounded text-xs hover:bg-primary-700 transition-colors flex items-center justify-center staff-bg-primary"
                                    >
                                      <Edit size={12} className="mr-1 text-white" />
                                      <span className="staff-text-white">Edit</span>
                                    </button>
                                    <button
                                      onClick={() => handleDeleteRoom(room)}
                                      className="flex-1 bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700 transition-colors flex items-center justify-center"
                                      style={{ backgroundColor: '#dc2626', color: 'white' }}
                                    >
                                      <Trash2 size={12} className="mr-1 text-white" />
                                      <span className="staff-text-white">Delete</span>
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            
            {Object.keys(groupedRooms()).length === 0 && (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <Bed className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No rooms found</h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm || selectedLocation || selectedHotel || selectedType 
                    ? 'Try adjusting your search filters.' 
                    : 'Get started by adding a new room type.'}
                </p>
                <button
                  onClick={handleAddRoom}
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Add First Room Type
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Table View */
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Rooms ({filteredRooms.length})
              </h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Room
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hotel & Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRooms.map((room) => {
                    const hotel = hotels.find(h => h.id === room.hotelId)
                    return (
                      <tr key={room.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{room.name}</div>
                            <div className="text-sm text-gray-500">Room {room.roomNumber}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{hotel?.name}</div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <MapPin size={12} className="mr-1" />
                            {hotel?.location}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{room.type}</div>
                          <div className="text-sm text-gray-500">{room.capacity} guests • {room.beds} beds</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            Rp {room.price.toLocaleString('id-ID')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            room.available 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {room.available ? 'Available' : 'Occupied'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditRoom(room)}
                              className="text-primary-600 hover:text-primary-900"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteRoom(room)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              
              {filteredRooms.length === 0 && (
                <div className="text-center py-12">
                  <Bed className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No rooms found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchTerm || selectedLocation || selectedHotel || selectedType 
                      ? 'Try adjusting your search filters.' 
                      : 'Get started by adding a new room type.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {showRoomTypeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Add New Room Type
              </h3>

              <form onSubmit={handleSubmitRoomType} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hotel
                    </label>
                    <select
                      value={roomTypeFormData.hotelId}
                      onChange={(e) => setRoomTypeFormData({ ...roomTypeFormData, hotelId: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Select Hotel</option>
                      {hotels.map((hotel) => (
                        <option key={hotel.id} value={hotel.id.toString()}>
                          {hotel.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Base Type
                    </label>
                    <select
                      value={roomTypeFormData.baseType}
                      onChange={(e) => setRoomTypeFormData({ ...roomTypeFormData, baseType: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Select Type</option>
                      <option value="Standard">Standard</option>
                      <option value="Deluxe">Deluxe</option>
                      <option value="Suite">Suite</option>
                      <option value="Villa">Villa</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Room Type Name
                  </label>
                  <input
                    type="text"
                    value={roomTypeFormData.name}
                    onChange={(e) => setRoomTypeFormData({ ...roomTypeFormData, name: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price (Rp)
                    </label>
                    <input
                      type="number"
                      value={roomTypeFormData.price}
                      onChange={(e) => setRoomTypeFormData({ ...roomTypeFormData, price: e.target.value })}
                      required
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Capacity (Guests)
                    </label>
                    <input
                      type="number"
                      value={roomTypeFormData.capacity}
                      onChange={(e) => setRoomTypeFormData({ ...roomTypeFormData, capacity: e.target.value })}
                      required
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Number of Beds
                    </label>
                    <input
                      type="number"
                      value={roomTypeFormData.beds}
                      onChange={(e) => setRoomTypeFormData({ ...roomTypeFormData, beds: e.target.value })}
                      required
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Image URL
                    </label>
                    <input
                      type="url"
                      value={roomTypeFormData.image}
                      onChange={(e) => setRoomTypeFormData({ ...roomTypeFormData, image: e.target.value })}
                      placeholder="https://example.com/room-type-image.jpg"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={roomTypeFormData.description}
                    onChange={(e) => setRoomTypeFormData({ ...roomTypeFormData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amenities
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      'WiFi',
                      'Air Conditioning',
                      'TV',
                      'Mini Bar',
                      'Room Service',
                      'Balcony',
                      'Bathtub',
                      'Safe',
                      'Coffee Maker',
                      'Telephone',
                      'Hair Dryer',
                      'Iron',
                    ].map((amenity) => (
                      <label key={amenity} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={roomTypeFormData.amenities.includes(amenity)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setRoomTypeFormData({
                                ...roomTypeFormData,
                                amenities: [...roomTypeFormData.amenities, amenity],
                              })
                            } else {
                              setRoomTypeFormData({
                                ...roomTypeFormData,
                                amenities: roomTypeFormData.amenities.filter((item) => item !== amenity),
                              })
                            }
                          }}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">{amenity}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowRoomTypeModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                  >
                    Create Room Type
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add/Edit Room Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {editingRoom ? 'Edit Room' : 'Add New Room'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hotel
                    </label>
                    <select
                      value={formData.hotelId}
                      onChange={(e) => setFormData({...formData, hotelId: e.target.value})}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Select Hotel</option>
                      {hotels.map(hotel => (
                        <option key={hotel.id} value={hotel.id.toString()}>
                          {hotel.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Room Number
                    </label>
                    <input
                      type="text"
                      value={formData.roomNumber}
                      onChange={(e) => setFormData({...formData, roomNumber: e.target.value})}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Room Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Select Type</option>
                      <option value="Standard">Standard</option>
                      <option value="Deluxe">Deluxe</option>
                      <option value="Suite">Suite</option>
                      <option value="Villa">Villa</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price (Rp)
                    </label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                      required
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Capacity (Guests)
                    </label>
                    <input
                      type="number"
                      value={formData.capacity}
                      onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                      required
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Number of Beds
                    </label>
                    <input
                      type="number"
                      value={formData.beds}
                      onChange={(e) => setFormData({...formData, beds: e.target.value})}
                      required
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Image URL
                  </label>
                  <input
                    type="url"
                    value={formData.image}
                    onChange={(e) => setFormData({...formData, image: e.target.value})}
                    placeholder="https://example.com/room-image.jpg"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amenities
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      'WiFi',
                      'Air Conditioning',
                      'TV',
                      'Mini Bar',
                      'Room Service',
                      'Balcony',
                      'Bathtub',
                      'Safe',
                      'Coffee Maker',
                      'Telephone',
                      'Hair Dryer',
                      'Iron'
                    ].map((amenity) => (
                      <label key={amenity} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={formData.amenities.includes(amenity)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                amenities: [...formData.amenities, amenity]
                              })
                            } else {
                              setFormData({
                                ...formData,
                                amenities: formData.amenities.filter(item => item !== amenity)
                              })
                            }
                          }}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">{amenity}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="available"
                    checked={formData.available}
                    onChange={(e) => setFormData({...formData, available: e.target.checked})}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="available" className="ml-2 block text-sm text-gray-900">
                    Available for booking
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                  >
                    {editingRoom ? 'Update Room' : 'Create Room'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && roomToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Delete Room</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete "{roomToDelete.name}"? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
