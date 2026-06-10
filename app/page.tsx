'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Star, MapPin, Search } from 'lucide-react'
import { getHotels } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { useNavigationHistory } from '@/hooks/useNavigationHistory'

interface Hotel {
  id: number
  name: string
  location: string
  rating: number
  image: string
  pricePerNight: number
  description: string
  startingPrice?: number
}

export default function HomePage() {
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('homeSearchTerm') || ''
    }
    return ''
  })
  const router = useRouter()
  const { isStaff } = useAuth()

  useEffect(() => {
    // Redirect staff to room management
    if (isStaff) {
      router.push('/staff')
      return
    }
    loadHotels()
    
    // Restore scroll position
    const savedScrollPos = sessionStorage.getItem('homeScroll')
    if (savedScrollPos) {
      setTimeout(() => {
        window.scrollTo(0, parseInt(savedScrollPos))
      }, 100)
    }
  }, [isStaff])

  // Save search term and scroll position
  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('homeSearchTerm', searchTerm)
    }
  }, [searchTerm])

  useEffect(() => {
    const handleScroll = () => {
      sessionStorage.setItem('homeScroll', window.scrollY.toString())
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const loadHotels = async () => {
    try {
      const data = await getHotels()
      setHotels(data)
    } catch (error) {
      console.error('Failed to load hotels:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredHotels = hotels.filter(hotel =>
    hotel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hotel.location.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <h1 className="text-5xl font-bold mb-4">Welcome to HoTel-U</h1>
          <p className="text-xl mb-8">Find your perfect stay at the best prices</p>
          
          {/* Search Bar */}
          <div className="bg-white rounded-lg shadow-lg p-4 flex items-center max-w-2xl">
            <Search className="text-gray-400 mr-3" size={24} />
            <input
              type="text"
              placeholder="Search hotels by name or location..."
              className="flex-1 outline-none text-gray-800 text-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Hotels Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Available Hotels</h2>
        
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
                <div className="h-48 bg-gray-300"></div>
                <div className="p-6">
                  <div className="h-6 bg-gray-300 rounded mb-4"></div>
                  <div className="h-4 bg-gray-300 rounded mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredHotels.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No hotels found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredHotels.map((hotel) => (
              <Link href={`/hotels/${hotel.id}`} key={hotel.id}>
                <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer">
                  <div className="relative h-48">
                    <Image
                      src={hotel.image}
                      alt={hotel.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{hotel.name}</h3>
                    <div className="flex items-center text-gray-600 mb-2">
                      <MapPin size={16} className="mr-1" />
                      <span className="text-sm">{hotel.location}</span>
                    </div>
                    <div className="flex items-center mb-3">
                      <Star size={16} className="text-yellow-400 fill-current mr-1" />
                      <span className="text-sm font-semibold">{hotel.rating}</span>
                    </div>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{hotel.description}</p>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm text-gray-500 block">Starting from</span>
                        <span className="text-2xl font-bold text-primary-600">
                          Rp {hotel.startingPrice?.toLocaleString('id-ID') || hotel.pricePerNight.toLocaleString('id-ID')}
                        </span>
                        <span className="text-gray-500 text-sm ml-1">/night</span>
                      </div>
                      <button className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors">
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
