'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

interface SignedImageProps {
  s3Key: string
  alt: string
  className?: string
  fill?: boolean
}

export default function SignedImage({ s3Key, alt, className, fill }: SignedImageProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetchSignedUrl = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/get-signed-url?key=${encodeURIComponent(s3Key)}`)
        const result = await response.json()

        if (result.success) {
          setSignedUrl(result.signedUrl)
        } else {
          setError(true)
        }
      } catch (err) {
        console.error('Error fetching signed URL:', err)
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    if (s3Key) {
      fetchSignedUrl()
    }
  }, [s3Key])

  if (loading) {
    return (
      <div className={`bg-gray-200 animate-pulse flex items-center justify-center ${className}`}>
        <div className="text-gray-400">Loading...</div>
      </div>
    )
  }

  if (error || !signedUrl) {
    return (
      <div className={`bg-gray-200 flex items-center justify-center ${className}`}>
        <div className="text-gray-400 text-center p-4">
          <svg className="w-8 h-8 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd"/>
          </svg>
          <span className="text-sm">Image unavailable</span>
        </div>
      </div>
    )
  }

  return (
    <Image
      src={signedUrl}
      alt={alt}
      fill={fill}
      className={className}
    />
  )
}