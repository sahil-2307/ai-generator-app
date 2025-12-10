'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { TextGenerationRequest } from '@/types'
import { supabase, getCurrentUser, decrementUserCredits } from '@/lib/supabase'
import CreditConfirmationModal from './CreditConfirmationModal'
import {
  TrendingUp,
  PenTool,
  Microscope,
  Sprout,
  Upload,
  Loader2,
  Sparkles,
  Copy,
  Download,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  Settings,
  Wand2
} from 'lucide-react'

const models = [
  { id: 'gpt-4o', name: 'GPT-4o', description: 'Most capable model', premium: true },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: 'Fast and efficient', premium: false },
  { id: 'o1-mini', name: 'o1-mini', description: 'Reasoning model', premium: true },
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', description: 'Advanced capabilities', premium: true },
]

const examplePrompts = [
  {
    title: "Business Strategy",
    prompt: "Create a comprehensive marketing strategy for a sustainable fashion brand targeting Gen Z consumers",
    category: "Business",
    icon: TrendingUp
  },
  {
    title: "Creative Writing",
    prompt: "Write a compelling short story about a time traveler who can only visit moments of great historical change",
    category: "Creative",
    icon: PenTool
  },
  {
    title: "Technical Analysis",
    prompt: "Explain the concept of machine learning to a 10-year-old using simple analogies and examples",
    category: "Technical",
    icon: Microscope
  },
  {
    title: "Personal Development",
    prompt: "Create a personalized 30-day habit-building plan for improving focus and productivity",
    category: "Growth",
    icon: Sprout
  }
]

interface TextGenerationProps {
  onGenerationComplete?: () => void
}

export default function TextGeneration({ onGenerationComplete }: TextGenerationProps) {
  const [prompt, setPrompt] = useState('')
  const [model, setModel] = useState('gpt-4o-mini')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ text?: string; metadata?: any } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [selectedExample, setSelectedExample] = useState<number | null>(null)
  const [showCreditConfirmation, setShowCreditConfirmation] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showQuickPrompts, setShowQuickPrompts] = useState(true)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const outputRef = useRef<HTMLDivElement>(null)

  const handleExampleClick = (example: any, index: number) => {
    setPrompt(example.prompt)
    setSelectedExample(index)
    setTimeout(() => setSelectedExample(null), 200)
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt')
      return
    }

    const user = await getCurrentUser()
    if (!user) {
      setError('Please sign in to generate text')
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
      const formData = new FormData()
      formData.append('prompt', prompt)
      formData.append('model', model)
      formData.append('userId', (await getCurrentUser())?.id || '')

      if (imageFile) {
        formData.append('image', imageFile)
      }

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 60000)

      const response = await fetch('/api/generate-text', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate text')
      }

      const data = await response.json()
      setResult(data)

      if (onGenerationComplete) {
        onGenerationComplete()
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async () => {
    if (result?.text) {
      await navigator.clipboard.writeText(result.text)
    }
  }

  const downloadAsText = () => {
    if (result?.text) {
      const blob = new Blob([result.text], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'generated-text.txt'
      a.click()
      URL.revokeObjectURL(url)
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
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
                  <Wand2 className="w-5 h-5 text-purple-600" />
                  ✨ AI Text Generation
                </h1>
                <p className="text-xs text-gray-600">
                  Create compelling content with advanced AI
                </p>
              </div>

              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>

            <div className="hidden md:flex items-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>GPT-4o Ready</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Multi-modal</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-12 gap-4 h-full">
          {/* Sidebar - Input Controls */}
          <div className={`${sidebarCollapsed ? 'col-span-1' : 'col-span-12 lg:col-span-3'} transition-all duration-300`}>
            {sidebarCollapsed ? (
              <div className="bg-white rounded-lg border border-gray-200 p-2">
                <button
                  onClick={() => setSidebarCollapsed(false)}
                  className="w-full p-2 text-gray-500 hover:text-blue-600 rounded-lg transition-all"
                >
                  <Settings className="w-5 h-5 mx-auto" />
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Quick Prompts */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="bg-white rounded-lg border border-gray-200 overflow-hidden"
                >
                  <button
                    onClick={() => setShowQuickPrompts(!showQuickPrompts)}
                    className="w-full p-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between text-sm font-semibold text-gray-900 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-blue-600" />
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
                          className={`w-full p-2 text-left bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-lg transition-all text-xs ${
                            selectedExample === index ? 'bg-blue-100 border-blue-400' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-4 h-4 bg-blue-100 rounded flex items-center justify-center">
                              <example.icon className="w-3 h-3 text-blue-600" />
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
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="bg-white rounded-lg border border-gray-200 p-3"
                >
                  <div className="space-y-3">
                    {/* Prompt Input */}
                    <div>
                      <label htmlFor="text-prompt" className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <PenTool className="w-4 h-4 text-purple-600" />
                        ✨ Your Creative Prompt
                      </label>
                      <textarea
                        ref={textareaRef}
                        id="text-prompt"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="e.g., 'Write a compelling product description for eco-friendly water bottles targeting health-conscious millennials'"
                        className="w-full h-20 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                      />
                      <div className="text-right mt-1">
                        <span className="text-xs text-gray-400">{prompt.length} characters</span>
                      </div>
                    </div>

                    {/* Image Upload */}
                    <div>
                      <label htmlFor="image-upload" className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <Upload className="w-4 h-4 text-green-600" />
                        🖼️ Optional Image Context
                      </label>
                      <input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      {imagePreview && (
                        <div className="mt-2 relative">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-full max-h-16 object-cover rounded-lg"
                          />
                          <button
                            onClick={() => {
                              setImageFile(null)
                              setImagePreview(null)
                            }}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                          >
                            ×
                          </button>
                        </div>
                      )}
                    </div>

                    {/* AI Model Selection */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <Microscope className="w-4 h-4 text-indigo-600" />
                        🧠 AI Model
                      </label>
                      <div className="space-y-2">
                        {models.map((m) => (
                          <button
                            key={m.id}
                            onClick={() => setModel(m.id)}
                            className={`w-full p-2 border rounded-lg transition-all text-left ${
                              model === m.id
                                ? 'border-blue-500 bg-blue-50 text-blue-900'
                                : 'border-gray-300 bg-gray-50 hover:border-gray-400 text-gray-700'
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <h4 className="font-medium text-xs">{m.name}</h4>
                                <p className="text-xs text-gray-600">{m.description}</p>
                              </div>
                              {m.premium && (
                                <span className="px-2 py-1 text-xs bg-gradient-to-r from-yellow-400 to-orange-500 text-black rounded-full font-medium">
                                  PRO
                                </span>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Generate Button */}
                    <div className="pt-2">
                      <button
                        onClick={handleGenerate}
                        disabled={loading || !prompt.trim()}
                        className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        {loading ? (
                          <div className="flex items-center justify-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Generating...
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-2">
                            <Sparkles className="w-4 h-4" />
                            Generate Text
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

          {/* Main Content Area */}
          <div className={`${sidebarCollapsed ? 'col-span-11' : 'col-span-12 lg:col-span-9'} transition-all duration-300`}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-white rounded-lg border border-gray-200 flex flex-col h-full"
              style={{ minHeight: isFullscreen ? 'calc(100vh - 120px)' : '70vh' }}
            >
              {/* Content Header */}
              <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  ✨ Your Creation
                </h3>
                {result && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={copyToClipboard}
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      title="Copy to clipboard"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={downloadAsText}
                      className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                      title="Download as text file"
                    >
                      <Download className="w-4 h-4" />
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

              {/* Content Display Area */}
              <div className="flex-1 overflow-y-auto" ref={outputRef}>
                <div className="p-6">
                  {loading && (
                    <div className="flex items-center justify-center h-full min-h-[400px]">
                      <div className="flex flex-col items-center space-y-4">
                        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <div className="text-center">
                          <p className="text-gray-900 font-medium">Creating your content...</p>
                          <p className="text-gray-600 text-sm mt-2">This may take 10-30 seconds</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-700 text-sm">{error}</p>
                    </div>
                  )}

                  {result && !loading && (
                    <div className="space-y-4">
                      {result.text ? (
                        <div className="prose prose-sm max-w-none">
                          <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                            <pre className="whitespace-pre-wrap text-gray-900 text-sm leading-relaxed font-sans">
                              {result.text}
                            </pre>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center text-gray-500 py-8">
                          <p>Processing your request...</p>
                        </div>
                      )}
                    </div>
                  )}

                  {!loading && !error && !result && (
                    <div className="flex items-center justify-center h-full min-h-[400px]">
                      <div className="text-center space-y-4">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                          <PenTool className="w-8 h-8 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-gray-900 font-medium">Ready to create amazing content</p>
                          <p className="text-gray-600 text-sm mt-2">
                            Enter your prompt and let AI help you create compelling text
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
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
        contentType="text"
        prompt={prompt}
      />
    </div>
  )
}