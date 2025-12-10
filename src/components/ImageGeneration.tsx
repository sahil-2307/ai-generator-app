'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { ImageGenerationRequest } from '@/types'
import { supabase, getCurrentUser, decrementUserCredits } from '@/lib/supabase'
import CreditConfirmationModal from './CreditConfirmationModal'
import {
  Camera,
  Palette,
  Brush,
  Gamepad2,
  Droplets,
  PenTool,
  Zap,
  Sparkles,
  Square,
  Smartphone,
  Monitor,
  Castle,
  User,
  Mountain,
  Rocket,
  Target,
  Maximize,
  Paintbrush,
  Settings,
  Download,
  Dice1,
  ImageIcon,
  Play,
  Loader2,
  Copy,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  ExternalLink,
  Eye,
  Heart,
  Lightbulb,
  Wand2
} from 'lucide-react'

const imageStyles = [
  { id: 'photorealistic', name: 'Photorealistic', icon: Camera },
  { id: 'digital-art', name: 'Digital Art', icon: Palette },
  { id: 'oil-painting', name: 'Oil Painting', icon: Brush },
  { id: 'anime', name: 'Anime Style', icon: Gamepad2 },
  { id: 'watercolor', name: 'Watercolor', icon: Droplets },
  { id: 'sketch', name: 'Sketch', icon: PenTool },
  { id: 'cyberpunk', name: 'Cyberpunk', icon: Zap },
  { id: 'fantasy', name: 'Fantasy', icon: Sparkles },
]

const imageSizes = [
  { id: 'square', name: 'Square (1024x1024)', value: '1024x1024', icon: Square },
  { id: 'portrait', name: 'Portrait (1024x1792)', value: '1024x1792', icon: Smartphone },
  { id: 'landscape', name: 'Landscape (1792x1024)', value: '1792x1024', icon: Monitor },
]

const models = [
  { id: 'dalle-3', name: 'DALL-E 3 (High Quality)', description: 'Best quality, most creative' },
  { id: 'dalle-2', name: 'DALL-E 2 (Fast)', description: 'Good quality, faster generation' },
]

const examplePrompts = [
  {
    title: "Fantasy Landscape",
    prompt: "A mystical floating island with ancient ruins, waterfalls cascading into clouds, and glowing crystals, digital art style",
    category: "Fantasy",
    icon: Castle
  },
  {
    title: "Portrait Art",
    prompt: "Professional headshot of a confident business woman in modern office setting, natural lighting, photorealistic",
    category: "Portrait",
    icon: User
  },
  {
    title: "Nature Scene",
    prompt: "Serene mountain lake at sunrise with mist, autumn colors, pine trees reflected in calm water, oil painting style",
    category: "Nature",
    icon: Mountain
  },
  {
    title: "Sci-Fi Concept",
    prompt: "Futuristic city with flying cars, neon lights, holographic billboards, cyberpunk aesthetic, digital art",
    category: "Sci-Fi",
    icon: Rocket
  }
]

const dummyGeneratedImages = [
  {
    url: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=400&h=400&fit=crop&crop=center',
    prompt: "Cute golden retriever puppy in a flower field",
    style: 'photorealistic',
    category: 'Animals',
    likes: '2.3K'
  },
  {
    url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop&crop=center',
    prompt: "Epic mountain landscape at dramatic sunset",
    style: 'digital-art',
    category: 'Nature',
    likes: '1.8K'
  },
  {
    url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=400&fit=crop&crop=center',
    prompt: "Mystical forest path with magical lighting",
    style: 'fantasy',
    category: 'Fantasy',
    likes: '3.1K'
  },
  {
    url: 'https://images.unsplash.com/photo-1535025639604-9a804c092faa?w=400&h=400&fit=crop&crop=center',
    prompt: "Modern minimalist architecture with clean lines",
    style: 'photorealistic',
    category: 'Architecture',
    likes: '1.5K'
  }
]

interface ImageGenerationProps {
  onGenerationComplete?: () => void
}

export default function ImageGeneration({ onGenerationComplete }: ImageGenerationProps) {
  const [prompt, setPrompt] = useState('')
  const [style, setStyle] = useState('photorealistic')
  const [size, setSize] = useState('square')
  const [model, setModel] = useState('dalle-3')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ imageUrl?: string; downloadUrl?: string; metadata?: any } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedExample, setSelectedExample] = useState<number | null>(null)
  const [showCreditConfirmation, setShowCreditConfirmation] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showQuickPrompts, setShowQuickPrompts] = useState(true)
  const [showGallery, setShowGallery] = useState(false)

  useEffect(() => {
    getCurrentUser().then(setUser)
  }, [])

  const handleExampleClick = (example: any, index: number) => {
    setPrompt(example.prompt)
    setSelectedExample(index)
    setTimeout(() => setSelectedExample(null), 200)
  }

  const loadDummyExample = (example: any) => {
    setPrompt(example.prompt)
    setStyle(example.style)
    setResult({
      imageUrl: example.url,
      downloadUrl: example.url,
      metadata: {
        prompt: example.prompt,
        style: example.style,
        note: 'DEMO: Sample image from Unsplash. In production, this would be AI-generated.'
      }
    })
    setError(null)
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt')
      return
    }

    if (!user) {
      setError('Please sign in to generate images')
      return
    }

    setShowCreditConfirmation(true)
  }

  const handleConfirmGeneration = async () => {
    setShowCreditConfirmation(false)
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 60000)

      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          style,
          size: imageSizes.find(s => s.id === size)?.value || '1024x1024',
          model,
          userId: user.id,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = 'Failed to generate image'
        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.error || errorMessage
        } catch {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()
      setResult(data)

      if (onGenerationComplete) {
        onGenerationComplete()
      }

    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Image generation request timed out. Please try again.')
      } else if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
        setError('Network error. Please check your connection and try again.')
      } else {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred')
      }
    } finally {
      setLoading(false)
    }
  }

  const loadRandomDummy = () => {
    const randomImage = dummyGeneratedImages[Math.floor(Math.random() * dummyGeneratedImages.length)]
    loadDummyExample(randomImage)
  }

  const copyToClipboard = async () => {
    if (result?.imageUrl) {
      // Copy image URL to clipboard
      await navigator.clipboard.writeText(result.imageUrl)
    }
  }

  const regenerate = () => {
    if (prompt.trim()) {
      handleGenerate()
    }
  }

  return (
    <div className={`min-h-screen bg-gray-50 ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Compact Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent flex items-center gap-2">
                  <Wand2 className="w-5 h-5 text-pink-600" />
                  🎨 AI Image Generator
                </h1>
                <p className="text-xs text-gray-600">
                  Create stunning images with DALL-E 3
                </p>
              </div>

              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-2 text-gray-500 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-all"
                title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>

            <div className="hidden md:flex items-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                <span>DALL-E 3</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>HD Quality</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-12 gap-4">
          {/* Sidebar - Input Controls */}
          <div className={`${sidebarCollapsed ? 'col-span-1' : 'col-span-12 lg:col-span-4'} transition-all duration-300`}>
            {sidebarCollapsed ? (
              <div className="bg-white rounded-lg border border-gray-200 p-2">
                <button
                  onClick={() => setSidebarCollapsed(false)}
                  className="w-full p-2 text-gray-500 hover:text-pink-600 rounded-lg transition-all"
                >
                  <Settings className="w-5 h-5 mx-auto" />
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Gallery */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="bg-white rounded-lg border border-gray-200 overflow-hidden"
                >
                  <button
                    onClick={() => setShowGallery(!showGallery)}
                    className="w-full p-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between text-sm font-semibold text-gray-900 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Palette className="w-4 h-4 text-pink-600" />
                      🎨 Gallery of AI Creations
                    </div>
                    {showGallery ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {showGallery && (
                    <div className="p-3 grid grid-cols-2 gap-2">
                      {dummyGeneratedImages.map((example, index) => (
                        <button
                          key={index}
                          className="group bg-gray-50 rounded-lg overflow-hidden hover:bg-pink-50 border border-gray-200 hover:border-pink-300 transition-all"
                          onClick={() => loadDummyExample(example)}
                        >
                          <div className="aspect-square overflow-hidden">
                            <img
                              src={example.url}
                              alt={example.prompt}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                            />
                          </div>
                          <div className="p-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                example.category === 'Animals' ? 'bg-green-100 text-green-800' :
                                example.category === 'Nature' ? 'bg-blue-100 text-blue-800' :
                                example.category === 'Fantasy' ? 'bg-purple-100 text-purple-800' :
                                example.category === 'Architecture' ? 'bg-gray-100 text-gray-800' :
                                'bg-pink-100 text-pink-800'
                              }`}>
                                {example.category}
                              </span>
                              <div className="flex items-center gap-1 text-gray-500">
                                <Heart className="w-3 h-3" />
                                <span>{example.likes}</span>
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </motion.div>

                {/* Quick Prompts */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="bg-white rounded-lg border border-gray-200 overflow-hidden"
                >
                  <button
                    onClick={() => setShowQuickPrompts(!showQuickPrompts)}
                    className="w-full p-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between text-sm font-semibold text-gray-900 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Rocket className="w-4 h-4 text-blue-600" />
                      🚀 Quick Start Prompts
                    </div>
                    {showQuickPrompts ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {showQuickPrompts && (
                    <div className="p-3 space-y-2">
                      {examplePrompts.map((example, index) => (
                        <button
                          key={index}
                          onClick={() => handleExampleClick(example, index)}
                          className={`w-full p-2 text-left bg-gray-50 hover:bg-pink-50 border border-gray-200 hover:border-pink-300 rounded-lg transition-all text-xs ${
                            selectedExample === index ? 'bg-pink-100 border-pink-400' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-4 h-4 bg-pink-100 rounded flex items-center justify-center">
                              <example.icon className="w-3 h-3 text-pink-600" />
                            </div>
                            <span className="font-medium text-gray-900 text-xs">{example.title}</span>
                          </div>
                          <p className="text-xs text-gray-600 line-clamp-2 pl-6">{example.prompt.slice(0, 60)}...</p>
                        </button>
                      ))}
                    </div>
                  )}
                </motion.div>

                {/* Main Input Form */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="bg-white rounded-lg border border-gray-200 p-3"
                >
                  <div className="space-y-3">
                    {/* Prompt Input */}
                    <div>
                      <label htmlFor="image-prompt" className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <Target className="w-4 h-4 text-pink-600" />
                        🎯 Describe Your Image
                      </label>
                      <textarea
                        id="image-prompt"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="e.g., 'A majestic dragon flying over a crystal mountain, fantasy art style, highly detailed'"
                        className="w-full h-20 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 resize-none"
                      />
                      <div className="text-right mt-1">
                        <span className="text-xs text-gray-400">{prompt.length} characters</span>
                      </div>
                    </div>

                    {/* Image Size */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <Maximize className="w-4 h-4 text-gray-600" />
                        📐 Image Size
                      </label>
                      <div className="space-y-2">
                        {imageSizes.map((sizeOption) => (
                          <button
                            key={sizeOption.id}
                            onClick={() => setSize(sizeOption.id)}
                            className={`w-full p-2 border rounded-lg transition-all text-left ${
                              size === sizeOption.id
                                ? 'border-pink-500 bg-pink-50 text-pink-900'
                                : 'border-gray-300 bg-gray-50 hover:border-gray-400 text-gray-700'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <sizeOption.icon className="w-4 h-4 text-gray-600" />
                              <div className="text-xs font-medium">{sizeOption.name}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Art Style */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <Paintbrush className="w-4 h-4 text-gray-600" />
                        🎭 Art Style
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {imageStyles.map((styleOption) => (
                          <button
                            key={styleOption.id}
                            onClick={() => setStyle(styleOption.id)}
                            className={`p-2 border rounded-lg transition-all text-center ${
                              style === styleOption.id
                                ? 'border-pink-500 bg-pink-50 text-pink-900'
                                : 'border-gray-300 bg-gray-50 hover:border-gray-400 text-gray-700'
                            }`}
                          >
                            <div className="mb-1">
                              <styleOption.icon className="w-4 h-4 mx-auto text-gray-600" />
                            </div>
                            <div className="text-xs font-medium">{styleOption.name}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* AI Model */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <Settings className="w-4 h-4 text-gray-600" />
                        ⚙️ AI Model
                      </label>
                      <div className="space-y-2">
                        {models.map((m) => (
                          <button
                            key={m.id}
                            onClick={() => setModel(m.id)}
                            className={`w-full p-2 border rounded-lg transition-all text-left ${
                              model === m.id
                                ? 'border-pink-500 bg-pink-50 text-pink-900'
                                : 'border-gray-300 bg-gray-50 hover:border-gray-400 text-gray-700'
                            }`}
                          >
                            <div className="font-medium text-xs">{m.name}</div>
                            <div className="text-xs text-gray-600">{m.description}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Generate Buttons */}
                    <div className="space-y-2 pt-2">
                      <button
                        onClick={handleGenerate}
                        disabled={loading || !prompt.trim()}
                        className="w-full py-3 px-4 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white font-medium rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        {loading ? (
                          <div className="flex items-center justify-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Generating...
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-2">
                            <Sparkles className="w-4 h-4" />
                            Generate Image
                          </div>
                        )}
                      </button>

                      <button
                        onClick={loadRandomDummy}
                        disabled={loading}
                        className="w-full py-2 px-3 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg font-medium hover:bg-gray-200 transition-all text-sm"
                      >
                        <div className="flex items-center justify-center gap-2">
                          <Dice1 className="w-4 h-4" />
                          Try Random Example
                        </div>
                      </button>
                    </div>

                    {/* Collapse Button */}
                    <button
                      onClick={() => setSidebarCollapsed(true)}
                      className="w-full py-2 px-3 bg-gray-100 text-gray-600 border border-gray-300 rounded-lg font-medium hover:bg-gray-200 transition-all text-xs"
                    >
                      Collapse Sidebar
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </div>

          {/* Main Content Area - Image Display */}
          <div className={`${sidebarCollapsed ? 'col-span-11' : 'col-span-12 lg:col-span-8'} transition-all duration-300`}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="bg-white rounded-lg border border-gray-200 flex flex-col"
              style={{ minHeight: isFullscreen ? 'calc(100vh - 120px)' : '75vh' }}
            >
              {/* Image Header */}
              <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-pink-600" />
                  🖼️ Your Image
                </h3>
                {result && result.imageUrl && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={copyToClipboard}
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      title="Copy image URL"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => window.open(result.downloadUrl, '_blank')}
                      className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                      title="Download image"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => window.open(result.imageUrl, '_blank')}
                      className="p-2 text-gray-500 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-all"
                      title="Open in new tab"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                    <button
                      onClick={regenerate}
                      className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all"
                      title="Regenerate"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Image Content Area */}
              <div className="flex-1 flex items-center justify-center p-6">
                {loading && (
                  <div className="flex flex-col items-center space-y-4">
                    <div className="w-16 h-16 border-4 border-pink-600 border-t-transparent rounded-full animate-spin"></div>
                    <div className="text-center">
                      <p className="text-gray-900 font-medium">Creating your image...</p>
                      <p className="text-gray-600 text-sm mt-2">This may take 30-60 seconds</p>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="p-6 bg-red-50 border border-red-200 rounded-lg max-w-md">
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                )}

                {result && !loading && (
                  <div className="w-full max-w-4xl">
                    {result.imageUrl ? (
                      <div className="space-y-4">
                        <div className="rounded-lg overflow-hidden shadow-lg">
                          <img
                            src={result.imageUrl}
                            alt="Generated image"
                            className="w-full h-auto bg-gray-100 object-contain rounded-lg"
                            style={{ maxHeight: '65vh' }}
                          />
                        </div>
                        {result.metadata?.note && (
                          <div className="text-xs text-gray-600 p-3 bg-gray-50 rounded-lg">
                            {result.metadata.note}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 py-8">
                        <p>Processing your request...</p>
                      </div>
                    )}
                  </div>
                )}

                {!loading && !error && !result && (
                  <div className="text-center space-y-4">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                      <Palette className="w-10 h-10 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-gray-900 font-medium">Generated image will appear here</p>
                      <p className="text-gray-600 text-sm mt-2">
                        Enter your prompt and let AI create amazing visuals
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Credit Confirmation Modal */}
      <CreditConfirmationModal
        isOpen={showCreditConfirmation}
        onClose={() => setShowCreditConfirmation(false)}
        onConfirm={handleConfirmGeneration}
        contentType="image"
        prompt={prompt}
      />
    </div>
  )
}