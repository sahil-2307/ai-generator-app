'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Download, Eye, Calendar } from 'lucide-react'

interface MediaFile {
  filename: string
  url: string
  type: 'video' | 'image'
  size: number
  modified: string
  extension: string
}

interface MediaResponse {
  files: MediaFile[]
  total: number
  videos: number
  images: number
}

export default function ShowcasePage() {
  const [media, setMedia] = useState<MediaFile[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'videos' | 'images'>('all')
  const [selectedMedia, setSelectedMedia] = useState<MediaFile | null>(null)

  useEffect(() => {
    fetchMedia()
  }, [])

  const fetchMedia = async () => {
    try {
      const response = await fetch('/api/media')
      if (response.ok) {
        const data: MediaResponse = await response.json()
        setMedia(data.files)
      } else {
        console.error('Failed to fetch media')
      }
    } catch (error) {
      console.error('Error fetching media:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredMedia = media.filter(item => {
    if (filter === 'all') return true
    if (filter === 'videos') return item.type === 'video'
    if (filter === 'images') return item.type === 'image'
    return true
  })

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024)
    return mb > 1 ? `${mb.toFixed(1)}MB` : `${(bytes / 1024).toFixed(1)}KB`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading showcase...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50">
      {/* Modern Header */}
      <header className="border-b border-white/20 bg-white/80 backdrop-blur-xl sticky top-0 z-50 shadow-lg shadow-purple-500/5">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Media Showcase
              </h1>
              <p className="text-gray-600 mt-1">
                {media.length} items • {media.filter(m => m.type === 'video').length} videos • {media.filter(m => m.type === 'image').length} images
                <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                  ☁️ S3 Powered
                </span>
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Filter Tabs */}
        <div className="mb-8">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/20 shadow-lg p-2 inline-flex">
            <nav className="flex space-x-2">
              {[
                { id: 'all', label: 'All Content', count: filteredMedia.length, icon: '🎨' },
                { id: 'videos', label: 'Videos', count: media.filter(m => m.type === 'video').length, icon: '🎬' },
                { id: 'images', label: 'Images', count: media.filter(m => m.type === 'image').length, icon: '🖼️' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id as any)}
                  className={`
                    relative px-6 py-3 rounded-xl font-medium transition-all duration-300
                    ${filter === tab.id
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25'
                      : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
                    }
                  `}
                >
                  <span className="flex items-center space-x-2">
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                    <span className={`
                      px-2 py-1 rounded-full text-xs
                      ${filter === tab.id ? 'bg-white/20' : 'bg-gray-100 text-gray-600'}
                    `}>
                      {tab.count}
                    </span>
                  </span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Media Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          <AnimatePresence mode="wait">
            {filteredMedia.map((item, index) => (
              <MediaCard
                key={item.filename}
                item={item}
                index={index}
                onClick={() => setSelectedMedia(item)}
                formatFileSize={formatFileSize}
                formatDate={formatDate}
              />
            ))}
          </AnimatePresence>
        </div>

        {filteredMedia.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No {filter === 'all' ? 'media' : filter} found</p>
          </div>
        )}
      </div>

      {/* Media Modal */}
      <AnimatePresence>
        {selectedMedia && (
          <MediaModal
            media={selectedMedia}
            onClose={() => setSelectedMedia(null)}
            formatFileSize={formatFileSize}
            formatDate={formatDate}
          />
        )}
      </AnimatePresence>
    </main>
  )
}

// Separate MediaCard component
function MediaCard({ item, index, onClick, formatFileSize, formatDate }: {
  item: MediaFile
  index: number
  onClick: () => void
  formatFileSize: (bytes: number) => string
  formatDate: (dateString: string) => string
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isHovered, setIsHovered] = useState(false)

  const handleMouseEnter = () => {
    setIsHovered(true)
    if (item.type === 'video' && videoRef.current) {
      videoRef.current.currentTime = 0
      videoRef.current.play().catch(console.error)
    }
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    if (item.type === 'video' && videoRef.current) {
      videoRef.current.pause()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="group relative bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer border border-gray-100"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
    >
      {/* Media Container */}
      <div className="relative aspect-square overflow-hidden">
        {item.type === 'video' ? (
          <>
            <video
              ref={videoRef}
              src={item.url}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              muted
              loop
              playsInline
              crossOrigin="anonymous"
              preload="metadata"
            />
            {!isHovered && (
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                <div className="bg-white/90 backdrop-blur-sm rounded-full p-3">
                  <Play className="w-6 h-6 text-purple-600" fill="currentColor" />
                </div>
              </div>
            )}
          </>
        ) : (
          <img
            src={item.url}
            alt={item.filename}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        )}

        {/* Hover Overlay */}
        <div className={`
          absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent
          transition-opacity duration-300
          ${isHovered ? 'opacity-100' : 'opacity-0'}
        `}>
          <div className="absolute bottom-3 left-3 right-3">
            <div className="flex items-center justify-between text-white text-xs">
              <span className="bg-black/30 backdrop-blur-sm rounded-full px-2 py-1">
                {formatFileSize(item.size)}
              </span>
              <span className="bg-black/30 backdrop-blur-sm rounded-full px-2 py-1 flex items-center space-x-1">
                <Calendar className="w-3 h-3" />
                <span>{formatDate(item.modified)}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Type Badge */}
      <div className="absolute top-2 right-2">
        <span className={`
          px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm
          ${item.type === 'video'
            ? 'bg-purple-500/80 text-white'
            : 'bg-blue-500/80 text-white'
          }
        `}>
          {item.type === 'video' ? '🎬' : '🖼️'}
        </span>
      </div>
    </motion.div>
  )
}

// Separate MediaModal component
function MediaModal({ media, onClose, formatFileSize, formatDate }: {
  media: MediaFile
  onClose: () => void
  formatFileSize: (bytes: number) => string
  formatDate: (dateString: string) => string
}) {
  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = media.url
    link.download = media.filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 truncate">{media.filename}</h3>
              <p className="text-sm text-gray-500 mt-1">
                {media.type} • {formatFileSize(media.size)} • {formatDate(media.modified)}
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>

        {/* Media Content */}
        <div className="p-6">
          <div className="flex justify-center">
            {media.type === 'video' ? (
              <video
                src={media.url}
                controls
                className="max-w-full max-h-[60vh] rounded-lg"
                autoPlay
                crossOrigin="anonymous"
                preload="metadata"
              >
                Your browser does not support the video tag.
              </video>
            ) : (
              <img
                src={media.url}
                alt={media.filename}
                className="max-w-full max-h-[60vh] object-contain rounded-lg"
              />
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}