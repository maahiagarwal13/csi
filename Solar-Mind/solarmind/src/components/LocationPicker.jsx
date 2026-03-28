import { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { FiMapPin, FiNavigation, FiSearch } from 'react-icons/fi'
import { motion } from 'framer-motion'

// Fix default marker icon path issue in Vite
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng)
    },
  })
  return null
}

export default function LocationPicker({ formData, updateFormData }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [detecting, setDetecting] = useState(false)
  const mapRef = useRef(null)

  const defaultCenter = [30.3165, 78.0322] // Dehradun
  const position = formData.location
    ? [formData.location.lat, formData.location.lng]
    : null

  const reverseGeocode = async (lat, lng) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
      )
      const data = await res.json()
      return data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`
    } catch {
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`
    }
  }

  const handleMapClick = async (latlng) => {
    const name = await reverseGeocode(latlng.lat, latlng.lng)
    updateFormData({
      location: { lat: latlng.lat, lng: latlng.lng },
      locationName: name,
    })
  }

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.')
      return
    }
    setDetecting(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        const name = await reverseGeocode(lat, lng)
        updateFormData({
          location: { lat, lng },
          locationName: name,
        })
        if (mapRef.current) {
          mapRef.current.flyTo([lat, lng], 15)
        }
        setDetecting(false)
      },
      () => {
        alert('Unable to detect location. Please click the map to place a pin.')
        setDetecting(false)
      }
    )
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          searchQuery
        )}&format=json&limit=1`
      )
      const results = await res.json()
      if (results.length > 0) {
        const { lat, lon, display_name } = results[0]
        const parsedLat = parseFloat(lat)
        const parsedLng = parseFloat(lon)
        updateFormData({
          location: { lat: parsedLat, lng: parsedLng },
          locationName: display_name,
        })
        if (mapRef.current) {
          mapRef.current.flyTo([parsedLat, parsedLng], 15)
        }
      } else {
        alert('Location not found. Try a different search term.')
      }
    } catch {
      alert('Search failed. Please try again.')
    }
  }

  return (
    <div className="animate-fadeInUp space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <FiMapPin className="text-primary text-2xl" />
        <h2 className="text-on-surface-variant tracking-wide uppercase text-sm font-bold">Building Location</h2>
      </div>
      
      <p className="text-on-surface-variant/70 text-sm leading-relaxed mb-6">
        We use your building's location to retrieve highly accurate solar irradiance data from NASA's POWER archives.
      </p>

      {/* Search + Detect Bar */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-grow group">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50 group-focus-within:text-primary transition-colors" />
          <input
            className="w-full bg-surface-container-highest border-none rounded-xl py-3.5 pl-12 pr-4 text-on-surface placeholder:text-outline-variant focus:ring-2 focus:ring-primary transition-all outline-none"
            placeholder="Search city, district, or PIN code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <div className="flex gap-2">
          <button 
            className="flex-grow md:flex-none px-6 py-3.5 bg-surface-container-high hover:bg-surface-variant text-on-surface font-bold rounded-xl border border-outline-variant/20 transition-all active:scale-95"
            onClick={handleSearch}
          >
            Search
          </button>
          <button 
            className={`flex items-center justify-center gap-2 px-6 py-3.5 bg-primary/10 hover:bg-primary/20 text-primary font-bold rounded-xl border border-primary/20 transition-all active:scale-95 whitespace-nowrap ${detecting ? 'opacity-50 cursor-wait' : ''}`}
            onClick={handleDetectLocation}
            disabled={detecting}
          >
            <FiNavigation className={detecting ? 'animate-pulse' : ''} />
            {detecting ? 'Detecting...' : 'Current Location'}
          </button>
        </div>
      </div>

      {/* Map Section */}
      <div className="relative h-[300px] md:h-[400px] w-full rounded-2xl overflow-hidden border border-outline-variant/10 shadow-inner group">
        <MapContainer
          center={position || defaultCenter}
          zoom={position ? 15 : 10}
          className="h-full w-full z-0"
          ref={mapRef}
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler handleMapClick={handleMapClick} />
          <MapClickHandler onMapClick={handleMapClick} />
          {position && <Marker position={position} />}
        </MapContainer>
        
        {/* Map Instructions Overlay */}
        {!position && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="bg-surface-container-lowest/80 backdrop-blur-md px-6 py-3 rounded-full border border-outline-variant/20 text-on-surface-variant text-sm font-medium shadow-xl">
              Click on the map to mark your building
            </div>
          </div>
        )}
      </div>

      {/* Selected Location Info */}
      <motion.div 
        initial={false}
        animate={formData.location ? { opacity: 1, height: 'auto' } : { opacity: 0, height: 0 }}
        className="overflow-hidden"
      >
        {formData.location && (
          <div className="flex gap-4 p-5 bg-tertiary-container/10 border border-tertiary-container/30 rounded-2xl">
            <div className="w-10 h-10 bg-tertiary-container/20 text-tertiary rounded-full flex items-center justify-center shrink-0">
              <FiMapPin className="text-xl" />
            </div>
            <div>
              <div className="text-on-surface-variant text-[10px] font-bold uppercase tracking-widest mb-1">Building Location Identified</div>
              <div className="text-on-surface font-semibold text-sm line-clamp-2 mb-1">{formData.locationName}</div>
              <div className="text-tertiary text-xs font-mono">
                {formData.location.lat.toFixed(6)}°N, {formData.location.lng.toFixed(6)}°E
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}
