'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, type Creation } from '@/lib/supabase'
import Image from 'next/image'
import SignedImage from '@/components/SignedImage'

export default function GalleryPage() {
  const [creations, setCreations] = useState<Creation[]>([])
  const [filteredCreations, setFilteredCreations] = useState<Creation[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [selectedType, setSelectedType] = useState<'all' | 'image' | 'video' | 'text'>('all')
  const [selectedCreation, setSelectedCreation] = useState<Creation | null>(null)
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    filterCreations()
  }, [creations, selectedType])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth')
      return
    }
    setUser(user)
    await fetchUserCreations(user.id)
  }

  const fetchUserCreations = async (userId: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/user-creations?userId=${encodeURIComponent(userId)}`)
      const result = await response.json()

      if (result.success) {
        setCreations(result.data)
      } else {
        console.error('Failed to fetch creations:', result.error)
      }
    } catch (error) {
      console.error('Error fetching creations:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterCreations = () => {
    if (selectedType === 'all') {
      setFilteredCreations(creations)
    } else {
      setFilteredCreations(creations.filter(creation => creation.type === selectedType))
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getImageUrl = (creation: Creation) => {
    // For S3 stored images, use the S3 key to get signed URL
    if (creation.metadata?.s3Key) {
      return null // Will be handled by SignedImage component
    }
    // For OpenAI images or other external URLs, use the original URL
    return creation.result_url
  }

  const getDownloadUrl = (creation: Creation) => {
    // Check if there's a downloadUrl in metadata
    if (creation.metadata?.downloadUrl) {
      return creation.metadata.downloadUrl
    }
    return creation.result_url
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your gallery...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50">
      {/* Modern Header */}
      <header className="border-b border-white/20 bg-white/80 backdrop-blur-xl sticky top-0 z-50 shadow-lg shadow-purple-500/5">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/')}
                className="flex items-center space-x-3 text-slate-600 hover:text-purple-600 transition-all duration-200 group"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 group-hover:from-purple-100 group-hover:to-pink-100 flex items-center justify-center transition-all">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
                  </svg>
                </div>
                <span className="font-semibold">Home</span>
              </button>
              <div className="w-px h-6 bg-slate-300"></div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center shadow-lg">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Gallery</h1>
                  <p className="text-xs text-slate-500 font-medium">Your AI Creations</p>
                </div>
              </div>
            </div>
            <nav className="hidden md:flex items-center space-x-6">
              <button
                onClick={() => router.push('/text')}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
                </svg>
                Text AI
              </button>
              <button
                onClick={() => router.push('/image')}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-pink-600 hover:bg-pink-50 rounded-xl transition-all duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
                Image AI
              </button>
              <button
                onClick={() => router.push('/video')}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                </svg>
                Video AI
              </button>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 bg-clip-text text-transparent">
            Your Creative Gallery
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Discover and explore all your AI-generated masterpieces in one beautiful collection
          </p>
        </div>

        {/* Modern Filter Tabs */}
        <div className="mb-12">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/20 shadow-lg p-2">
            <nav className="flex space-x-2">
              {[
                { id: 'all', label: 'All Creations', count: creations.length, icon: '🎨', color: 'purple' },
                { id: 'image', label: 'Images', count: creations.filter(c => c.type === 'image').length, icon: '🖼️', color: 'pink' },
                { id: 'video', label: 'Videos', count: creations.filter(c => c.type === 'video').length, icon: '🎬', color: 'blue' },
                { id: 'text', label: 'Text', count: creations.filter(c => c.type === 'text').length, icon: '📝', color: 'green' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedType(tab.id as any)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-medium text-sm transition-all duration-200 ${
                    selectedType === tab.id
                      ? `bg-gradient-to-r ${
                          tab.color === 'purple' ? 'from-purple-600 to-pink-600' :
                          tab.color === 'pink' ? 'from-pink-600 to-rose-600' :
                          tab.color === 'blue' ? 'from-blue-600 to-cyan-600' :
                          'from-green-600 to-emerald-600'
                        } text-white shadow-lg`
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-700'
                  }`}
                >
                  <span className="text-lg">{tab.icon}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    selectedType === tab.id
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Gallery Grid */}
        {filteredCreations.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
              <span className="text-4xl">🎨</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">No creations yet</h3>
            <p className="text-lg text-slate-600 mb-8 max-w-md mx-auto">
              {selectedType === 'all'
                ? "Start your creative journey with AI-generated content!"
                : `You haven't created any ${selectedType} content yet. Time to get started!`
              }
            </p>
            <button
              onClick={() => router.push('/')}
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <span>✨</span>
              Start Creating
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6"/>
              </svg>
            </button>
          </div>
        ) : (
          <>
            {/* Stats Bar */}
            <div className="mb-8 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border border-purple-100/50 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    {filteredCreations.length} {selectedType === 'all' ? 'Creations' : selectedType.charAt(0).toUpperCase() + selectedType.slice(1) + 's'} Found
                  </h3>
                  <p className="text-sm text-slate-600">
                    Your creative collection keeps growing! 🚀
                  </p>
                </div>
                <div className="text-3xl opacity-60">
                  {selectedType === 'all' ? '🎨' :
                   selectedType === 'image' ? '🖼️' :
                   selectedType === 'video' ? '🎬' : '📝'}
                </div>
              </div>
            </div>

            {/* Masonry Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {filteredCreations.map((creation, index) => (
                <div
                  key={creation.id}
                  className="group cursor-pointer"
                  onClick={() => setSelectedCreation(creation)}
                >
                  <div className="relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
                    {/* Image Container */}
                    <div className={`relative overflow-hidden ${
                      creation.type === 'text' ? 'aspect-square' :
                      index % 5 === 0 ? 'aspect-[4/5]' :
                      index % 3 === 0 ? 'aspect-square' : 'aspect-[4/5]'
                    }`}>
                      {creation.type === 'image' ? (
                        creation.metadata?.s3Key ? (
                          <SignedImage
                            s3Key={creation.metadata.s3Key}
                            alt={creation.prompt}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        ) : (
                          <Image
                            src={getImageUrl(creation) || '/placeholder-image.jpg'}
                            alt={creation.prompt}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        )
                      ) : creation.type === 'video' ? (
                        <div className="w-full h-full bg-gradient-to-br from-slate-900 to-purple-900 flex items-center justify-center">
                          <video
                            src={getImageUrl(creation) || ''}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            muted
                          />
                          {/* Play Button Overlay */}
                          <div className="absolute inset-0 bg-black/20 flex items-center justify-center group-hover:bg-black/40 transition-colors">
                            <div className="w-14 h-14 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                              <svg className="w-7 h-7 text-slate-700 ml-1" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/>
                              </svg>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-500 via-purple-600 to-pink-600 flex items-center justify-center p-6">
                          <div className="text-white text-center">
                            <div className="w-12 h-12 mx-auto mb-3 bg-white/20 rounded-full flex items-center justify-center">
                              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"/>
                              </svg>
                            </div>
                            <p className="text-sm font-medium opacity-90">Text Content</p>
                            <p className="text-xs opacity-70 mt-1 line-clamp-3">
                              {creation.prompt.slice(0, 60)}...
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Type Badge */}
                      <div className="absolute top-3 left-3 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-lg text-xs font-medium text-white capitalize border border-white/10">
                        {creation.type === 'image' ? '🖼️' : creation.type === 'video' ? '🎬' : '📝'} {creation.type}
                      </div>

                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="absolute bottom-3 left-3 right-3">
                          <p className="text-white text-sm font-medium line-clamp-2 mb-1">
                            {creation.prompt}
                          </p>
                          <p className="text-white/80 text-xs">
                            {formatDate(creation.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-4">
                      <p className="text-sm text-slate-600 line-clamp-2 mb-2 group-hover:text-slate-900 transition-colors">
                        {creation.prompt}
                      </p>
                      <div className="flex items-center justify-between text-xs">
                        <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-full font-medium capitalize">
                          {creation.type}
                        </span>
                        <span className="text-slate-500">{formatDate(creation.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modern Modal */}
      {selectedCreation && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl max-w-5xl w-full max-h-[90vh] overflow-y-auto border border-white/20 shadow-2xl">
            <div className="p-8">
              {/* Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-purple-900 bg-clip-text text-transparent capitalize mb-2">
                    {selectedCreation.type === 'image' ? '🖼️' : selectedCreation.type === 'video' ? '🎬' : '📝'} {selectedCreation.type} Creation
                  </h2>
                  <p className="text-slate-600">Created {formatDate(selectedCreation.created_at)}</p>
                </div>
                <button
                  onClick={() => setSelectedCreation(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all duration-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="mb-8">
                {selectedCreation.type === 'image' ? (
                  <div className="relative rounded-2xl overflow-hidden shadow-lg bg-gradient-to-br from-slate-100 to-slate-200">
                    {selectedCreation.metadata?.s3Key ? (
                      <SignedImage
                        s3Key={selectedCreation.metadata.s3Key}
                        alt={selectedCreation.prompt}
                        className="w-full max-w-3xl mx-auto rounded-2xl shadow-xl"
                      />
                    ) : (
                      <img
                        src={getImageUrl(selectedCreation)}
                        alt={selectedCreation.prompt}
                        className="w-full max-w-3xl mx-auto rounded-2xl shadow-xl"
                      />
                    )}
                  </div>
                ) : selectedCreation.type === 'video' ? (
                  <div className="relative rounded-2xl overflow-hidden shadow-lg">
                    <video
                      src={getImageUrl(selectedCreation)}
                      controls
                      className="w-full max-w-3xl mx-auto rounded-2xl shadow-xl"
                    />
                  </div>
                ) : (
                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-8 rounded-2xl border border-blue-100/50 shadow-lg">
                    <div className="prose prose-lg max-w-none">
                      <p className="text-slate-800 whitespace-pre-wrap leading-relaxed">
                        {selectedCreation.metadata?.text || selectedCreation.prompt || 'Text content not available'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Prompt Section */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-2xl border border-purple-100/50">
                  <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <span className="text-xl">💭</span>
                    Original Prompt
                  </h3>
                  <p className="text-slate-700 leading-relaxed">{selectedCreation.prompt}</p>
                </div>

                {/* Metadata Section */}
                <div className="space-y-4">
                  {/* Basic Info */}
                  <div className="bg-gradient-to-br from-slate-50 to-gray-50 p-6 rounded-2xl border border-slate-100/50">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                      <span className="text-xl">ℹ️</span>
                      Details
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600 font-medium">Type</span>
                        <span className="px-3 py-1 bg-white rounded-full text-sm font-semibold text-slate-700 capitalize border border-slate-200">
                          {selectedCreation.type}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600 font-medium">Created</span>
                        <span className="text-slate-700 text-sm font-medium">{formatDate(selectedCreation.created_at)}</span>
                      </div>
                      {selectedCreation.metadata?.model && (
                        <div className="flex justify-between items-center">
                          <span className="text-slate-600 font-medium">Model</span>
                          <span className="text-slate-700 text-sm font-medium">{selectedCreation.metadata.model}</span>
                        </div>
                      )}
                      {selectedCreation.metadata?.provider && (
                        <div className="flex justify-between items-center">
                          <span className="text-slate-600 font-medium">Provider</span>
                          <span className="text-slate-700 text-sm font-medium capitalize">{selectedCreation.metadata.provider}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-2xl border border-green-100/50">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                      <span className="text-xl">⚡</span>
                      Actions
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {getDownloadUrl(selectedCreation) && (
                        <a
                          href={getDownloadUrl(selectedCreation)}
                          download
                          className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors shadow-lg hover:shadow-xl"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                          </svg>
                          Download
                        </a>
                      )}
                      <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"/>
                        </svg>
                        Share
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}