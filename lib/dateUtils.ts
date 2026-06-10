// Date utility functions for booking system

export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export const parseDate = (dateString: string): Date => {
  return new Date(dateString + 'T00:00:00')
}

export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0]
}

export const isDateInRange = (date: Date, startDate: Date, endDate: Date): boolean => {
  return date >= startDate && date <= endDate
}

// Check if two date ranges conflict with 1-day maintenance buffer
export const hasDateConflictWithBuffer = (
  newCheckIn: string,
  newCheckOut: string,
  existingCheckIn: string,
  existingCheckOut: string
): boolean => {
  const newStart = parseDate(newCheckIn)
  const newEnd = parseDate(newCheckOut)
  const existingStart = parseDate(existingCheckIn)
  const existingEnd = parseDate(existingCheckOut)
  
  // Add 1-day buffer before and after existing booking for maintenance
  const existingStartWithBuffer = addDays(existingStart, -1)
  const existingEndWithBuffer = addDays(existingEnd, 1)
  
  // Check if new booking overlaps with existing booking + buffer
  return !(newEnd < existingStartWithBuffer || newStart > existingEndWithBuffer)
}

// Get all dates in a range (inclusive)
export const getDatesInRange = (startDate: string, endDate: string): string[] => {
  const dates: string[] = []
  const start = parseDate(startDate)
  const end = parseDate(endDate)
  
  for (let date = new Date(start); date <= end; date = addDays(date, 1)) {
    dates.push(formatDate(date))
  }
  
  return dates
}

// Check if a room is available for specific dates
export const isRoomAvailableForDates = (
  roomId: number,
  checkIn: string,
  checkOut: string,
  existingBookings: Array<{
    roomId: number
    checkIn: string
    checkOut: string
    status: string
  }>
): boolean => {
  // Filter bookings for this room that are confirmed or rescheduled
  const roomBookings = existingBookings.filter(
    booking => 
      booking.roomId === roomId && 
      (booking.status === 'confirmed' || booking.status === 'rescheduled')
  )
  
  // Check if new dates conflict with any existing booking (with buffer)
  for (const booking of roomBookings) {
    if (hasDateConflictWithBuffer(checkIn, checkOut, booking.checkIn, booking.checkOut)) {
      return false
    }
  }
  return true
}
