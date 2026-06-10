import axios from 'axios'

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
})

// Add request interceptor to include auth token
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const getHotels = async () => {
  try {
    const response = await api.get('/hotels')
    return response.data
  } catch (error) {
    console.error('Error fetching hotels:', error)
    throw new Error('Failed to fetch hotels')
  }
}

// Room Types Management API Functions (staff)

export const getAllRoomTypes = async () => {
  try {
    const response = await api.get('/room-types')
    return response.data
  } catch (error) {
    console.error('Error fetching room types:', error)
    throw new Error('Failed to fetch room types')
  }
}

export const getRoomTypesByHotel = async (hotelId: number) => {
  try {
    const response = await api.get(`/room-types/hotel/${hotelId}`)
    return response.data
  } catch (error) {
    console.error('Error fetching room types by hotel:', error)
    throw new Error('Failed to fetch room types')
  }
}

export const createRoomType = async (roomTypeData: any) => {
  try {
    const response = await api.post('/room-types', roomTypeData)
    return response.data
  } catch (error: any) {
    console.error('Error creating room type:', error)
    throw new Error(error.response?.data?.error || 'Failed to create room type')
  }
}

export const updateRoomType = async (roomTypeId: number, roomTypeData: any) => {
  try {
    const response = await api.put(`/room-types/${roomTypeId}`, roomTypeData)
    return response.data
  } catch (error: any) {
    console.error('Error updating room type:', error)
    throw new Error(error.response?.data?.error || 'Failed to update room type')
  }
}

export const deleteRoomType = async (roomTypeId: number) => {
  try {
    const response = await api.delete(`/room-types/${roomTypeId}`)
    return response.data
  } catch (error: any) {
    console.error('Error deleting room type:', error)
    throw new Error(error.response?.data?.error || 'Failed to delete room type')
  }
}

export const getHotelById = async (id: number) => {
  try {
    const response = await api.get(`/hotels/${id}`)
    return response.data
  } catch (error) {
    console.error('Error fetching hotel:', error)
    throw new Error('Failed to fetch hotel')
  }
}

export const getRoomsByHotelId = async (hotelId: number, checkIn?: string, checkOut?: string) => {
  try {
    const params = new URLSearchParams()
    if (checkIn) params.append('checkIn', checkIn)
    if (checkOut) params.append('checkOut', checkOut)
    
    const response = await api.get(`/rooms/hotel/${hotelId}?${params.toString()}`)
    return response.data
  } catch (error) {
    console.error('Error fetching rooms:', error)
    throw new Error('Failed to fetch rooms')
  }
}

export const getRoomById = async (id: number, checkIn?: string, checkOut?: string) => {
  try {
    const params = new URLSearchParams()
    if (checkIn) params.append('checkIn', checkIn)
    if (checkOut) params.append('checkOut', checkOut)
    
    const response = await api.get(`/rooms/${id}?${params.toString()}`)
    return response.data
  } catch (error) {
    console.error('Error fetching room:', error)
    throw new Error('Failed to fetch room')
  }
}

export const login = async (email: string, password: string) => {
  try {
    const response = await api.post('/auth/login', { email, password })
    const { token, ...user } = response.data
    
    // Store token in localStorage
    sessionStorage.setItem('token', token)
    sessionStorage.setItem('user', JSON.stringify(user))
    
    return response.data
  } catch (error: any) {
    console.error('Login error:', error)
    throw new Error(error.response?.data?.error || 'Login failed')
  }
}

export const register = async (name: string, email: string, password: string) => {
  try {
    const response = await api.post('/auth/register', { name, email, password })
    const { token, ...user } = response.data
    
    // Store token in localStorage
    sessionStorage.setItem('token', token)
    sessionStorage.setItem('user', JSON.stringify(user))
    
    return response.data
  } catch (error: any) {
    console.error('Registration error:', error)
    throw new Error(error.response?.data?.error || 'Registration failed')
  }
}

export const createBooking = async (bookingData: {
  roomId: number
  roomName: string
  hotelName: string
  hotelLocation: string
  roomImage: string
  checkIn: string
  checkOut: string
  guests: number
  paymentMethod: string
  totalPrice: number
  guestName?: string
  guestEmail?: string
  guestPhone?: string
}) => {
  try {
    // Get user data from localStorage if not provided
    let guestName = bookingData.guestName;
    let guestEmail = bookingData.guestEmail;
    
    if (!guestName || !guestEmail) {
      const userData = sessionStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        guestName = guestName || user.name || 'Guest User';
        guestEmail = guestEmail || user.email || 'guest@hotel.com';
      } else {
        guestName = guestName || 'Guest User';
        guestEmail = guestEmail || 'guest@hotel.com';
      }
    }

    const response = await api.post('/bookings/book-room', {
      room_id: bookingData.roomId,
      guest_name: guestName,
      guest_email: guestEmail,
      guest_phone: bookingData.guestPhone || '08123456789',
      check_in: bookingData.checkIn,
      check_out: bookingData.checkOut,
      guests: bookingData.guests,
      total_price: bookingData.totalPrice,
      special_requests: `Payment method: ${bookingData.paymentMethod}`
    })
    return response.data
  } catch (error: any) {
    console.error('Booking error:', error)
    throw new Error(error.response?.data?.error || 'Failed to create booking')
  }
}

export const bookRoomType = async (hotelId: number, roomType: string, bookingData: any) => {
  try {
    const response = await api.post('/bookings/book-room-type', {
      hotelId,
      roomType,
      bookingData
    })
    return response.data
  } catch (error: any) {
    console.error('Booking error:', error)
    throw new Error(error.response?.data?.error || 'Failed to create booking')
  }
}

export const getUserBookings = async () => {
  try {
    const response = await api.get('/bookings/user')
    return response.data
  } catch (error) {
    console.error('Error fetching user bookings:', error)
    throw new Error('Failed to fetch bookings')
  }
}

export const getAllBookings = async () => {
  try {
    const response = await api.get('/bookings/all')
    return response.data
  } catch (error) {
    console.error('Error fetching all bookings:', error)
    throw new Error('Failed to fetch all bookings')
  }
}

export const cancelBooking = async (bookingId: number) => {
  try {
    const response = await api.patch(`/bookings/${bookingId}/cancel`)
    return response.data
  } catch (error: any) {
    console.error('Error cancelling booking:', error)
    throw new Error(error.response?.data?.error || 'Failed to cancel booking')
  }
}

export const createRescheduleRequest = async (bookingId: number, newCheckIn: string, newCheckOut: string, reason: string) => {
  try {
    const response = await api.post('/reschedule', {
      bookingId,
      newCheckIn,
      newCheckOut,
      reason
    })
    return response.data
  } catch (error: any) {
    console.error('Error creating reschedule request:', error)
    throw new Error(error.response?.data?.error || 'Failed to create reschedule request')
  }
}

export const getRescheduleRequests = async () => {
  try {
    const response = await api.get('/reschedule')
    return response.data
  } catch (error) {
    console.error('Error fetching reschedule requests:', error)
    throw new Error('Failed to fetch reschedule requests')
  }
}

export const approveRescheduleRequest = async (requestId: number, reviewNotes?: string) => {
  try {
    const response = await api.patch(`/reschedule/${requestId}/approve`, { reviewNotes })
    return response.data
  } catch (error: any) {
    console.error('Error approving reschedule request:', error)
    throw new Error(error.response?.data?.error || 'Failed to approve reschedule request')
  }
}

export const rejectRescheduleRequest = async (requestId: number, reviewNotes: string) => {
  try {
    const response = await api.patch(`/reschedule/${requestId}/reject`, { reviewNotes })
    return response.data
  } catch (error: any) {
    console.error('Error rejecting reschedule request:', error)
    throw new Error(error.response?.data?.error || 'Failed to reject reschedule request')
  }
}

export const getUserRescheduleRequests = async () => {
  try {
    const response = await api.get('/reschedule/user')
    return response.data
  } catch (error) {
    console.error('Error fetching user reschedule requests:', error)
    throw new Error('Failed to fetch reschedule requests')
  }
}

// Staff Management API Functions

export const getAllRooms = async () => {
  try {
    const response = await api.get('/rooms')
    return response.data
  } catch (error) {
    console.error('Error fetching all rooms:', error)
    throw new Error('Failed to fetch rooms')
  }
}

export const createRoom = async (roomData: any) => {
  try {
    console.log('API: Creating room with data:', roomData)
    const response = await api.post('/rooms', roomData)
    console.log('API: Room created successfully:', response.data)
    return response.data
  } catch (error: any) {
    console.error('API Error creating room:', error)
    console.error('API Error response:', error.response)
    console.error('API Error status:', error.response?.status)
    console.error('API Error data:', error.response?.data)
    
    if (error.response?.status === 401) {
      throw new Error('Authentication required. Please login again.')
    }
    
    throw new Error(error.response?.data?.error || error.message || 'Failed to create room')
  }
}

export const updateRoom = async (roomId: number, roomData: any) => {
  try {
    const response = await api.put(`/rooms/${roomId}`, roomData)
    return response.data
  } catch (error: any) {
    console.error('Error updating room:', error)
    throw new Error(error.response?.data?.error || 'Failed to update room')
  }
}

export const updateRoomAvailability = async (roomId: number, available: boolean) => {
  try {
    const response = await api.patch(`/rooms/${roomId}/availability`, { available })
    return response.data
  } catch (error: any) {
    console.error('Error updating room availability:', error)
    throw new Error(error.response?.data?.error || 'Failed to update room availability')
  }
}

export const deleteRoom = async (roomId: number) => {
  try {
    const response = await api.delete(`/rooms/${roomId}`)
    return response.data
  } catch (error: any) {
    console.error('Error deleting room:', error)
    throw new Error(error.response?.data?.error || 'Failed to delete room')
  }
}

// Staff Booking Management API Functions
// getAllBookings function is already defined above

// Logout function
export const logout = () => {
  sessionStorage.removeItem('token')
  sessionStorage.removeItem('user')
}

// Get current user from localStorage
export const getCurrentUser = () => {
  const userStr = sessionStorage.getItem('user')
  return userStr ? JSON.parse(userStr) : null
}

