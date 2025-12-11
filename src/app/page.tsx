'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase, getCurrentUser } from '@/lib/supabase'
import { handlePaymentFlow } from '@/lib/payments'
import UserDropdown from '@/components/UserDropdown'
import AuthModal from '@/components/AuthModal'
import PricingModal from '@/components/PricingModal'
import Link from 'next/link'
import {
  PenTool,
  Video,
  Palette,
  ChevronLeft,
  ChevronRight,
  Play,
  ExternalLink,
  Lock,
  Sparkles,
  Check,
  Shield,
  Cpu
} from 'lucide-react'

const aiTools = [
  {
    id: 'text',
    title: 'Text Generation',
    description: 'Create compelling content, stories, and copy with advanced AI writing models',
    icon: PenTool,
    gradient: 'from-blue-500 to-cyan-500',
    features: ['GPT-4o Integration', 'Creative Writing', 'Technical Content', 'Multiple Formats'],
    href: '/text',
    examples: [
      {
        title: 'Blog Article',
        description: 'Professional content creation with SEO optimization',
        image: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=400&h=300&fit=crop&crop=center',
        type: 'Article'
      },
      {
        title: 'Creative Story',
        description: 'Engaging narrative with compelling characters',
        image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop&crop=center',
        type: 'Fiction'
      },
      {
        title: 'Business Copy',
        description: 'Persuasive marketing content for conversions',
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop&crop=center',
        type: 'Marketing'
      }
    ]
  },
  {
    id: 'video',
    title: 'Video Generation',
    description: 'Generate stunning videos from text prompts using Google Veo 3.1 AI technology',
    icon: Video,
    gradient: 'from-violet-500 to-purple-500',
    features: ['Google Veo 3.1', 'TikTok/Instagram Ready', 'Multiple Styles', 'HD Quality'],
    href: '/video',
    examples: [
      {
        title: 'Product Demo',
        description: 'Professional product showcase video',
        image: 'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=400&h=300&fit=crop&crop=center',
        type: 'Commercial'
      },
      {
        title: 'Social Content',
        description: 'Engaging content for Instagram and TikTok',
        image: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&h=300&fit=crop&crop=center',
        type: 'Social'
      },
      {
        title: 'Explainer Video',
        description: 'Clear educational content with animations',
        image: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop&crop=center',
        type: 'Educational'
      }
    ]
  },
  {
    id: 'image',
    title: 'Image Generation',
    description: 'Create breathtaking images and artwork with DALL-E 3 and advanced AI models',
    icon: Palette,
    gradient: 'from-pink-500 to-rose-500',
    features: ['DALL-E 3 & 2', 'Multiple Styles', 'High Resolution', 'Commercial License'],
    href: '/image',
    examples: [
      {
        title: 'Digital Artwork',
        description: 'Stunning digital art for creative projects',
        image: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=300&fit=crop&crop=center',
        type: 'Art'
      },
      {
        title: 'Product Mockup',
        description: 'Professional product visualization',
        image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop&crop=center',
        type: 'Commercial'
      },
      {
        title: 'Portrait Photo',
        description: 'Photorealistic portrait generation',
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop&crop=center',
        type: 'Portrait'
      }
    ]
  }
]

// Carousel Component
function WorkCarousel({ examples }: { examples: any[] }) {
  const [currentIndex, setCurrentIndex] = useState(0)

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % examples.length)
  }

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + examples.length) % examples.length)
  }

  useEffect(() => {
    const interval = setInterval(nextSlide, 4000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl overflow-hidden h-64">
      {/* Carousel Content */}
      <div className="relative h-full">
        <div className="absolute inset-0 transition-opacity duration-500">
          <div className="h-full flex items-center">
            <div className="w-1/2 h-full">
              <img
                src={examples[currentIndex]?.image}
                alt={examples[currentIndex]?.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="w-1/2 p-6 flex flex-col justify-center">
              <div className="inline-flex items-center gap-2 mb-2">
                <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                  {examples[currentIndex]?.type}
                </span>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                {examples[currentIndex]?.title}
              </h4>
              <p className="text-sm text-gray-600 mb-4">
                {examples[currentIndex]?.description}
              </p>
              <button className="inline-flex items-center gap-2 text-blue-600 text-sm font-medium hover:text-blue-700 transition-colors">
                <Play className="w-4 h-4" />
                View Example
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-3 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-600 hover:bg-white hover:text-gray-900 transition-all shadow-sm"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-3 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-600 hover:bg-white hover:text-gray-900 transition-all shadow-sm"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* Indicators */}
      <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex gap-2">
        {examples.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-colors ${
              index === currentIndex ? 'bg-blue-600' : 'bg-white/60'
            }`}
          />
        ))}
      </div>
    </div>
  )
}

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [showAuth, setShowAuth] = useState(false)
  const [showPricing, setShowPricing] = useState(false)

  useEffect(() => {
    getCurrentUser().then(setUser)

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null)
        if (event === 'SIGNED_IN' && session?.user) {
          setShowAuth(false)
          // Ensure user profile exists in database
          createUserProfile(session.user)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const createUserProfile = async (user: any) => {
    try {
      const response = await fetch('/api/create-user-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          email: user.email,
        }),
      })

      const result = await response.json()
      console.log('User profile creation result:', result)
    } catch (error) {
      console.error('Failed to create user profile:', error)
    }
  }

  const handlePurchase = async (planType: string) => {
    if (!user) {
      setShowAuth(true)
      return
    }

    try {
      await handlePaymentFlow(planType, user, createUserProfile)
    } catch (error: any) {
      alert(error.message || 'Payment failed. Please try again.')
    }
  }

  return (
    <main className="min-h-screen bg-white">
      {/* Header - NotebookLM style */}
      <header className="border-b border-gray-200 bg-white/95 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-medium text-gray-900">
                  TheAIVault
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {user ? (
                <UserDropdown onPurchase={handlePurchase} onShowPricing={() => setShowPricing(true)} />
              ) : (
                <button
                  onClick={() => setShowAuth(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Sign in
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Hero Section */}
      <section className="py-12 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-3xl sm:text-4xl font-normal text-gray-900 mb-4 leading-tight">
              AI Content Creation
              <br />
              <span className="text-blue-600 font-medium">Made Simple</span>
            </h1>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto font-normal leading-relaxed">
              Create professional-quality text, videos, and images with state-of-the-art AI models.
              Start with one free creation, no credit card required.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => setShowAuth(true)}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors shadow-sm"
              >
                Get Started Free
              </button>
              <button
                onClick={() => setShowPricing(true)}
                className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-md font-medium hover:bg-gray-50 transition-colors"
              >
                View Pricing
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* AI Tools - NotebookLM style cards */}
      <section className="py-8 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center mb-10"
          >
            <h2 className="text-2xl font-normal text-gray-900 mb-3">
              Choose Your AI Tool
            </h2>
            <p className="text-base text-gray-600 max-w-2xl mx-auto font-normal">
              Professional AI models for every creative need. Each tool is designed for quality and ease of use.
            </p>
          </motion.div>

          <div className="space-y-6">
            {aiTools.map((tool, index) => (
              <motion.div
                key={tool.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 * index }}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-all duration-200"
              >
                <div className="space-y-6">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 bg-gradient-to-r ${tool.gradient} rounded-lg flex items-center justify-center text-white`}>
                        <tool.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-xl font-medium text-gray-900">
                          {tool.title}
                        </h3>
                        <p className="text-sm text-gray-500">Professional AI tool</p>
                      </div>
                    </div>
                    {user ? (
                      <Link href={tool.href}>
                        <div className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors text-sm">
                          Start Creating
                        </div>
                      </Link>
                    ) : (
                      <div className="inline-flex items-center gap-2 bg-gray-100 text-gray-400 px-4 py-2 rounded-md font-medium cursor-not-allowed text-sm">
                        <Lock className="w-4 h-4" />
                        Sign in Required
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-gray-700 text-base leading-relaxed">
                    {tool.description}
                  </p>

                  {/* Features */}
                  <div className="flex flex-wrap gap-x-6 gap-y-2">
                    {tool.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                        <span className="text-sm text-gray-600">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Work Examples Carousel */}
                  <div className="relative">
                    {user ? (
                      <WorkCarousel examples={tool.examples} />
                    ) : (
                      <div className="relative rounded-xl overflow-hidden h-64">
                        <WorkCarousel examples={tool.examples} />
                        {/* Blur overlay */}
                        <div className="absolute inset-0 bg-gray-900/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                          <div className="text-center bg-white/95 backdrop-blur-sm rounded-lg p-6 shadow-lg">
                            <Lock className="w-8 h-8 text-gray-600 mx-auto mb-3" />
                            <p className="text-sm font-medium text-gray-900 mb-1">
                              Sign in to explore examples
                            </p>
                            <p className="text-xs text-gray-600">
                              View professional work samples and get started
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {!user && (
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <h4 className="font-medium text-blue-900 text-sm">Join TheAIVault</h4>
                            <p className="text-blue-700 text-xs">Get 1 free creation, no credit card required</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setShowAuth(true)}
                          className="px-3 py-1.5 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors text-sm"
                        >
                          Sign Up
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-12 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <h3 className="text-base font-medium text-gray-900 mb-6">
              Powered by Industry-Leading AI Models
            </h3>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-green-600" />
                <span className="text-sm text-gray-600">OpenAI GPT-4o & DALL-E 3</span>
              </div>
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-gray-600">Google Veo 3.1</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-gray-600" />
                <span className="text-sm text-gray-600">Enterprise Security</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-6 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <span className="text-base font-medium text-gray-900">TheAIVault</span>
          </div>
          <p className="text-gray-500 text-sm">
            Professional AI content creation • Secure payments via Cashfree • Powered by Supabase
          </p>
        </div>
      </footer>

      {/* Modals */}
      <AuthModal
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
        onSuccess={() => {
          setShowAuth(false)
        }}
      />

      <PricingModal
        isOpen={showPricing}
        onClose={() => setShowPricing(false)}
        onPurchase={handlePurchase}
      />
    </main>
  )
}