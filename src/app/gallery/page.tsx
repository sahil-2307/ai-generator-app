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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header Navigation */}
      <header className="border-b border-white/20 bg-white/95 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/')}
                className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
                </svg>
                <span className="font-medium">Back to Home</span>
              </button>
              <span className="text-gray-400">|</span>
              <h1 className="text-xl font-bold text-gray-900">Gallery</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/text')}
                className="px-3 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                Generate Text
              </button>
              <button
                onClick={() => router.push('/image')}
                className="px-3 py-2 text-sm text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
              >
                Generate Images
              </button>
              <button
                onClick={() => router.push('/video')}
                className="px-3 py-2 text-sm text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              >
                Generate Videos
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Your Creative Gallery</h1>
          <p className="text-gray-600">Explore all your AI-generated content</p>
        </div>

        {/* Filter Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'all', label: 'All', count: creations.length },
                { id: 'image', label: 'Images', count: creations.filter(c => c.type === 'image').length },
                { id: 'video', label: 'Videos', count: creations.filter(c => c.type === 'video').length },
                { id: 'text', label: 'Text', count: creations.filter(c => c.type === 'text').length }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedType(tab.id as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    selectedType === tab.id
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Gallery Grid */}
        {filteredCreations.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🎨</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No creations yet</h3>
            <p className="text-gray-600 mb-4">
              {selectedType === 'all'
                ? "Start creating your first AI-generated content!"
                : `You haven't created any ${selectedType} content yet.`
              }
            </p>
            <button
              onClick={() => router.push('/')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700"
            >
              Start Creating
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCreations.map((creation) => (
              <div
                key={creation.id}
                className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
                onClick={() => setSelectedCreation(creation)}
              >
                <div className="aspect-square relative">
                  {creation.type === 'image' ? (
                    creation.metadata?.s3Key ? (
                      <SignedImage
                        s3Key={creation.metadata.s3Key}
                        alt={creation.prompt}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <Image
                        src={getImageUrl(creation) || '/placeholder-image.jpg'}
                        alt={creation.prompt}
                        fill
                        className="object-cover"
                      />
                    )
                  ) : creation.type === 'video' ? (
                    <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                      <video
                        src={getImageUrl(creation)}
                        className="w-full h-full object-cover"
                        muted
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-white bg-opacity-80 flex items-center justify-center">
                          <svg className="w-6 h-6 text-gray-800" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/>
                          </svg>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <div className="text-white text-center p-4">
                        <svg className="w-12 h-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"/>
                        </svg>
                        <p className="text-sm font-medium">Text Content</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <p className="text-sm text-gray-600 line-clamp-2 mb-2">{creation.prompt}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="capitalize">{creation.type}</span>
                    <span>{formatDate(creation.created_at)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal for viewing creation details */}
      {selectedCreation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900 capitalize">{selectedCreation.type} Content</h2>
                <button
                  onClick={() => setSelectedCreation(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>

              <div className="mb-4">
                {selectedCreation.type === 'image' ? (
                  selectedCreation.metadata?.s3Key ? (
                    <SignedImage
                      s3Key={selectedCreation.metadata.s3Key}
                      alt={selectedCreation.prompt}
                      className="w-full max-w-2xl mx-auto rounded-lg"
                    />
                  ) : (
                    <img
                      src={getImageUrl(selectedCreation)}
                      alt={selectedCreation.prompt}
                      className="w-full max-w-2xl mx-auto rounded-lg"
                    />
                  )
                ) : selectedCreation.type === 'video' ? (
                  <video
                    src={getImageUrl(selectedCreation)}
                    controls
                    className="w-full max-w-2xl mx-auto rounded-lg"
                  />
                ) : (
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <p className="text-gray-800 whitespace-pre-wrap">
                      {selectedCreation.metadata?.text || 'Text content not available'}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-1">Prompt</h3>
                  <p className="text-gray-600">{selectedCreation.prompt}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <h3 className="font-medium text-gray-700">Created</h3>
                    <p className="text-gray-600">{formatDate(selectedCreation.created_at)}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-700">Type</h3>
                    <p className="text-gray-600 capitalize">{selectedCreation.type}</p>
                  </div>
                </div>

                {selectedCreation.metadata && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">Additional Info</h3>
                    <div className="text-xs text-gray-600">
                      {selectedCreation.metadata.generatedBy && (
                        <p>Generated by: {selectedCreation.metadata.generatedBy}</p>
                      )}
                      {selectedCreation.metadata.model && (
                        <p>Model: {selectedCreation.metadata.model}</p>
                      )}
                      {selectedCreation.metadata.size && (
                        <p>Size: {selectedCreation.metadata.size}</p>
                      )}
                      {selectedCreation.metadata.style && (
                        <p>Style: {selectedCreation.metadata.style}</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex space-x-2">
                  {getDownloadUrl(selectedCreation) && (
                    <a
                      href={getDownloadUrl(selectedCreation)}
                      download
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                    >
                      Download
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}