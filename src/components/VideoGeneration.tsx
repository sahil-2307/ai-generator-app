'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { VideoGenerationRequest } from '@/types'
import { supabase, getCurrentUser, decrementUserCredits } from '@/lib/supabase'
import CreditConfirmationModal from './CreditConfirmationModal'
import {
  Video,
  Smartphone,
  ShoppingBag,
  Heart,
  PartyPopper,
  Music,
  GraduationCap,
  Sparkles,
  Monitor,
  Brain,
  Paintbrush2,
  Play,
  Download,
  Dice1,
  Target,
  Gem,
  Film,
  Rocket,
  Shirt,
  Camera,
  Mountain,
  Palette,
  Loader2,
  Copy,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  Settings,
  Clock,
  Eye,
  ExternalLink
} from 'lucide-react'

const storyTypes = [
  { id: 'cinematic', name: 'Cinematic', icon: Video },
  { id: 'vlog', name: 'Vlog Style', icon: Smartphone },
  { id: 'product', name: 'Product Showcase', icon: ShoppingBag },
  { id: 'emotional', name: 'Emotional', icon: Heart },
  { id: 'playful', name: 'Playful', icon: PartyPopper },
  { id: 'dance', name: 'Dance/Music', icon: Music },
  { id: 'tutorial', name: 'Tutorial', icon: GraduationCap },
  { id: 'lifestyle', name: 'Lifestyle', icon: Sparkles },
]

const aspectRatios = [
  { id: 'vertical', name: 'TikTok/Reels', value: '9:16', icon: Smartphone, desc: 'Vertical 9:16' },
  { id: 'horizontal', name: 'YouTube/Standard', value: '16:9', icon: Monitor, desc: 'Horizontal 16:9' },
]

const models = [
  { id: 'veo-3-ultra', name: 'Veo-3-Ultra', description: 'Best quality, slower generation', badge: 'PRO' },
  { id: 'veo-3-lite', name: 'Veo-3-Lite', description: 'Good quality, faster generation', badge: 'FAST' },
]

const featuredPrompts = [
  {
    title: "Fashion Runway",
    prompt: "A trendy fashion model walking confidently on a neon-lit runway, dramatic lighting, slow motion with ethereal atmosphere",
    category: "Fashion",
    icon: Shirt
  },
  {
    title: "Tech Product",
    prompt: "Sleek smartphone floating in space with holographic UI elements, futuristic product showcase with dynamic camera movements",
    category: "Product",
    icon: Smartphone
  },
  {
    title: "Nature Epic",
    prompt: "Majestic eagle soaring over misty mountain peaks at golden hour, cinematic drone shot with dramatic clouds",
    category: "Nature",
    icon: Mountain
  },
  {
    title: "Urban Vibe",
    prompt: "Young artist creating street art in colorful urban alley, trendy aesthetic with warm golden lighting",
    category: "Lifestyle",
    icon: Palette
  }
]

const showcaseVideos = [
  {
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    title: "Neon Dance Party",
    prompt: "Vibrant dance performance in neon-lit club with pulsing music and dynamic lighting effects",
    style: 'dance',
    duration: '8s',
    views: '2.3M'
  },
  {
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    title: "Future Tech Demo",
    prompt: "Revolutionary smartphone with AI features showcased in minimalist studio setting",
    style: 'product',
    duration: '8s',
    views: '1.8M'
  },
  {
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    title: "Epic Mountain Vista",
    prompt: "Breathtaking mountain landscape with rolling clouds and dramatic sunrise lighting",
    style: 'cinematic',
    duration: '8s',
    views: '3.1M'
  }
]

interface VideoGenerationProps {
  onGenerationComplete?: () => void
}

export default function VideoGeneration({ onGenerationComplete }: VideoGenerationProps) {
  const [prompt, setPrompt] = useState('')
  const [storyType, setStoryType] = useState('cinematic')
  const [aspectRatio, setAspectRatio] = useState('vertical')
  const [model, setModel] = useState('veo-3-lite')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ videoUrl?: string; downloadUrl?: string; operationId?: string; status?: string; message?: string; metadata?: any } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [polling, setPolling] = useState(false)
  const [useFreeMode, setUseFreeMode] = useState(false)
  const [usageInfo, setUsageInfo] = useState<{ remainingFreeVideos?: number; mode?: string } | null>(null)
  const [selectedExample, setSelectedExample] = useState<number | null>(null)
  const [showCreditConfirmation, setShowCreditConfirmation] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showQuickPrompts, setShowQuickPrompts] = useState(true)
  const [showExamples, setShowExamples] = useState(false)

  // Fetch usage info when component loads
  useEffect(() => {
    const fetchUsageInfo = async () => {
      try {
        const response = await fetch('/api/usage-info')
        if (response.ok) {
          const data = await response.json()
          setUsageInfo({
            remainingFreeVideos: data.remainingFreeVideos
          })
          if (data.isLimitReached) {
            setUseFreeMode(true)
          }
        }
      } catch (error) {
        console.error('Failed to fetch usage info:', error)
      }
    }
    fetchUsageInfo()
  }, [])

  const handleExampleClick = (example: any, index: number) => {
    setPrompt(example.prompt)
    setSelectedExample(index)
    setTimeout(() => setSelectedExample(null), 200)
  }

  const loadShowcaseExample = (example: any) => {
    setPrompt(example.prompt)
    setStoryType(example.style)
    setResult({
      videoUrl: example.videoUrl,
      downloadUrl: example.videoUrl,
      status: 'completed',
      metadata: {
        prompt: example.prompt,
        style: example.style,
        note: 'DEMO: Sample video showcase. In production, this would be AI-generated.',
        mode: 'sample_video'
      }
    })
    setError(null)
  }

  const pollVideoStatus = async (operationId: string) => {
    setPolling(true)
    let attempts = 0
    const maxAttempts = 60

    const poll = async () => {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 30000)

        const response = await fetch(`/api/check-video-status?operationId=${encodeURIComponent(operationId)}`, {
          signal: controller.signal,
          headers: { 'Content-Type': 'application/json' },
        })

        clearTimeout(timeoutId)
        const data = await response.json()

        if (!response.ok) {
          if (response.status === 408 || response.status === 503) {
            attempts++
            if (attempts < maxAttempts) {
              const backoffDelay = Math.min(15000 * Math.pow(1.2, attempts - 1), 45000)
              setTimeout(poll, backoffDelay)
            } else {
              setError('Video generation check timed out. Please try generating a new video.')
              setPolling(false)
            }
            return
          } else {
            throw new Error(`HTTP ${response.status}: ${data.error || response.statusText}`)
          }
        }

        if (data.status === 'completed' && data.videoUrl) {
          setResult({
            videoUrl: data.videoUrl,
            downloadUrl: data.downloadUrl || data.videoUrl,
            status: 'completed',
          })
          setPolling(false)
          return
        } else if (data.status === 'failed') {
          setError(data.error || 'Video generation failed')
          setPolling(false)
          return
        } else if (data.status === 'processing' || data.status === 'pending') {
          attempts++
          if (attempts < maxAttempts) {
            setTimeout(poll, 10000)
          } else {
            setError('Video generation timed out. Please try again.')
            setPolling(false)
          }
        }
      } catch (err) {
        attempts++
        if (attempts < maxAttempts) {
          const backoffDelay = Math.min(10000 * Math.pow(1.5, attempts - 1), 30000)
          setTimeout(poll, backoffDelay)
        } else {
          setError('Failed to check video status after multiple attempts. Please try generating a new video.')
          setPolling(false)
        }
      }
    }
    poll()
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt')
      return
    }

    const user = await getCurrentUser()
    if (!user) {
      setError('Please sign in to generate videos')
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

      const response = await fetch('/api/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          storyType,
          aspectRatio: aspectRatios.find(ar => ar.id === aspectRatio)?.value || '9:16',
          model,
          useFreeMode,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = 'Failed to generate video'
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

      if (data.metadata) {
        setUsageInfo({
          remainingFreeVideos: data.metadata.remainingFreeVideos,
          mode: data.metadata.mode
        })
      }

      if (onGenerationComplete) {
        onGenerationComplete()
      }

      if (data.operationId) {
        pollVideoStatus(data.operationId)
      } else if (data.videoUrl) {
        setPolling(false)
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Video generation request timed out. Please try again.')
      } else if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
        setError('Network error. Please check your connection and try again.')
      } else {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred')
      }
    } finally {
      setLoading(false)
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
                <h1 className="text-xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
                  <Film className="w-5 h-5 text-violet-600" />
                  🎬 AI Video Generation
                </h1>
                <p className="text-xs text-gray-600">
                  Create stunning videos with Google Veo AI
                </p>
              </div>

              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-2 text-gray-500 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-all"
                title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>

            <div className="hidden md:flex items-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-violet-500 rounded-full"></div>
                <span>Google Veo 3.1</span>
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
                  className="w-full p-2 text-gray-500 hover:text-violet-600 rounded-lg transition-all"
                >
                  <Settings className="w-5 h-5 mx-auto" />
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Example Videos */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="bg-white rounded-lg border border-gray-200 overflow-hidden"
                >
                  <button
                    onClick={() => setShowExamples(!showExamples)}
                    className="w-full p-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between text-sm font-semibold text-gray-900 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-violet-600" />
                      ✨ Example Creations
                    </div>
                    {showExamples ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {showExamples && (
                    <div className="p-3 grid gap-2">
                      {showcaseVideos.map((video, index) => (
                        <button
                          key={index}
                          className="group bg-gray-50 rounded-lg p-2 hover:bg-violet-50 border border-gray-200 hover:border-violet-300 transition-all text-left"
                          onClick={() => loadShowcaseExample(video)}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <Play className="w-3 h-3 text-violet-600" />
                            <h3 className="text-xs font-medium text-gray-900">{video.title}</h3>
                          </div>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              {video.views}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {video.duration}
                            </span>
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
                      🚀 Featured Prompts
                    </div>
                    {showQuickPrompts ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {showQuickPrompts && (
                    <div className="p-3 space-y-2">
                      {featuredPrompts.map((example, index) => (
                        <button
                          key={index}
                          onClick={() => handleExampleClick(example, index)}
                          className={`w-full p-2 text-left bg-gray-50 hover:bg-violet-50 border border-gray-200 hover:border-violet-300 rounded-lg transition-all text-xs ${
                            selectedExample === index ? 'bg-violet-100 border-violet-400' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-4 h-4 bg-violet-100 rounded flex items-center justify-center">
                              <example.icon className="w-3 h-3 text-violet-600" />
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
                      <label htmlFor="video-prompt" className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <Target className="w-4 h-4 text-violet-600" />
                        ✨ Describe Your Vision
                      </label>
                      <textarea
                        id="video-prompt"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="e.g., 'A futuristic city with flying cars at night, neon lights reflecting on wet streets, cinematic camera movement'"
                        className="w-full h-20 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 resize-none"
                      />
                      <div className="text-right mt-1">
                        <span className="text-xs text-gray-400">{prompt.length}/500</span>
                      </div>
                    </div>

                    {/* Settings Grid */}
                    <div className="space-y-3">
                      {/* Video Format */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                          <Monitor className="w-4 h-4 text-gray-600" />
                          📱 Video Format
                        </label>
                        <div className="space-y-2">
                          {aspectRatios.map((ratio) => (
                            <button
                              key={ratio.id}
                              onClick={() => setAspectRatio(ratio.id)}
                              className={`w-full p-2 border rounded-lg transition-all text-left ${
                                aspectRatio === ratio.id
                                  ? 'border-violet-500 bg-violet-50 text-violet-900'
                                  : 'border-gray-300 bg-gray-50 hover:border-gray-400 text-gray-700'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <ratio.icon className="w-4 h-4 text-gray-600" />
                                <div>
                                  <div className="font-medium text-xs">{ratio.name}</div>
                                  <div className="text-xs text-gray-600">{ratio.desc}</div>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* AI Model */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                          <Brain className="w-4 h-4 text-purple-600" />
                          🧠 AI Model
                        </label>
                        <div className="space-y-2">
                          {models.map((m) => (
                            <button
                              key={m.id}
                              onClick={() => setModel(m.id)}
                              className={`w-full p-2 border rounded-lg transition-all text-left ${
                                model === m.id
                                  ? 'border-violet-500 bg-violet-50 text-violet-900'
                                  : 'border-gray-300 bg-gray-50 hover:border-gray-400 text-gray-700'
                              }`}
                            >
                              <div className="flex justify-between items-center">
                                <div>
                                  <h4 className="font-medium text-xs">{m.name}</h4>
                                  <p className="text-xs text-gray-600">{m.description}</p>
                                </div>
                                <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                                  m.badge === 'PRO' ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-black' : 'bg-green-500 text-white'
                                }`}>
                                  {m.badge}
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Style Selection */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                          <Paintbrush2 className="w-4 h-4 text-gray-600" />
                          🎭 Style & Mood
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {storyTypes.map((type) => (
                            <button
                              key={type.id}
                              onClick={() => setStoryType(type.id)}
                              className={`p-2 border rounded-lg transition-all text-center ${
                                storyType === type.id
                                  ? 'border-violet-500 bg-violet-50 text-violet-900'
                                  : 'border-gray-300 bg-gray-50 hover:border-gray-400 text-gray-700'
                              }`}
                            >
                              <div className="mb-1">
                                <type.icon className="w-4 h-4 mx-auto text-gray-600" />
                              </div>
                              <div className="text-xs font-medium">{type.name}</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Free Mode Toggle */}
                      <div className="border-t border-gray-200 pt-3">
                        <div className="flex items-center gap-2 mb-3">
                          <Gem className="w-4 h-4 text-purple-600" />
                          <h4 className="text-sm font-semibold text-gray-900">💎 Generation Mode</h4>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <input
                            type="checkbox"
                            id="free-mode"
                            checked={useFreeMode}
                            onChange={(e) => setUseFreeMode(e.target.checked)}
                            className="w-4 h-4 text-violet-600 bg-white border-gray-300 rounded focus:ring-violet-500 focus:ring-2"
                          />
                          <label htmlFor="free-mode" className="text-gray-900 cursor-pointer flex-1">
                            <span className="font-medium text-sm">Sample Video Mode</span>
                            <br />
                            <span className="text-xs text-gray-600">
                              Get instant professional sample videos
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Generate Button */}
                    <div className="pt-2">
                      <button
                        onClick={handleGenerate}
                        disabled={loading || !prompt.trim() || polling}
                        className="w-full py-3 px-4 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        {loading ? (
                          <div className="flex items-center justify-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Initializing...
                          </div>
                        ) : polling ? (
                          <div className="flex items-center justify-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Creating Video...
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-2">
                            {useFreeMode ? <Film className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                            {useFreeMode ? 'Get Sample Video' : 'Generate AI Video'}
                          </div>
                        )}
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

          {/* Main Content Area - Video Player */}
          <div className={`${sidebarCollapsed ? 'col-span-11' : 'col-span-12 lg:col-span-8'} transition-all duration-300`}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="bg-white rounded-lg border border-gray-200 flex flex-col"
              style={{ minHeight: isFullscreen ? 'calc(100vh - 120px)' : '75vh' }}
            >
              {/* Video Header */}
              <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Video className="w-5 h-5 text-violet-600" />
                  🎥 Your Creation
                </h3>
                {result && result.videoUrl && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => window.open(result.downloadUrl, '_blank')}
                      className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                      title="Download video"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => window.open(result.videoUrl, '_blank')}
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      title="Open in new tab"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Video Content Area */}
              <div className="flex-1 flex items-center justify-center p-6">
                {(loading || polling) && (
                  <div className="flex flex-col items-center space-y-4">
                    <div className="w-16 h-16 border-4 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
                    <div className="text-center">
                      <p className="text-gray-900 font-medium">
                        {loading ? 'Initializing AI generation...' : 'Crafting your video...'}
                      </p>
                      <p className="text-gray-600 text-sm mt-2">
                        This may take 1-3 minutes for best quality
                      </p>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="p-6 bg-red-50 border border-red-200 rounded-lg max-w-md">
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                )}

                {result && !loading && !polling && (
                  <div className="w-full max-w-4xl">
                    {result.videoUrl ? (
                      <div className="space-y-4">
                        <div className="rounded-lg overflow-hidden bg-black shadow-lg">
                          <video
                            controls
                            className="w-full h-auto"
                            style={{ maxHeight: '60vh' }}
                            src={result.videoUrl}
                          >
                            Your browser does not support the video tag.
                          </video>
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

                {!loading && !polling && !error && !result && (
                  <div className="text-center space-y-4">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                      <Film className="w-10 h-10 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-gray-900 font-medium">Your video will appear here</p>
                      <p className="text-gray-600 text-sm mt-2">
                        Choose a prompt or try an example to get started
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
        contentType="video"
        prompt={prompt}
      />
    </div>
  )
}