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
  Image as ImageIcon,
  ChevronRight,
  Play,
  ExternalLink,
  Sparkles,
  Check,
  Shield,
  Cpu,
  Wand2,
  Zap,
  Palette,
  Stars,
  ArrowRight,
  Eye,
  Clock,
  Users,
  Heart
} from 'lucide-react'

const aiTools = [
  {
    id: 'text',
    title: 'AI Text Generation',
    description: 'Create compelling content, stories, and copy with advanced AI writing models',
    icon: PenTool,
    gradient: 'from-blue-500 via-purple-500 to-cyan-500',
    bgGradient: 'from-blue-50 to-cyan-50',
    iconColor: 'text-blue-600',
    features: ['GPT-4o Integration', 'Creative Writing', 'Technical Content', 'Multiple Formats'],
    href: '/text',
    badge: 'Popular',
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
      }
    ]
  },
  {
    id: 'image',
    title: 'AI Image Generation',
    description: 'Generate stunning artwork, photos, and designs using DALL-E 3',
    icon: ImageIcon,
    gradient: 'from-pink-500 via-rose-500 to-orange-500',
    bgGradient: 'from-pink-50 to-orange-50',
    iconColor: 'text-pink-600',
    features: ['DALL-E 3 Integration', 'Multiple Styles', 'High Resolution', 'Custom Sizes'],
    href: '/image',
    badge: 'New',
    examples: [
      {
        title: 'Digital Art',
        description: 'Stunning artistic creations in any style',
        image: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=300&fit=crop&crop=center',
        type: 'Art'
      },
      {
        title: 'Product Design',
        description: 'Professional product mockups and concepts',
        image: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=300&fit=crop&crop=center',
        type: 'Design'
      }
    ]
  },
  {
    id: 'video',
    title: 'AI Video Generation',
    description: 'Create professional videos with Pika Labs, Haiper AI, and VEO 3.1',
    icon: Video,
    gradient: 'from-purple-500 via-violet-500 to-indigo-500',
    bgGradient: 'from-purple-50 to-indigo-50',
    iconColor: 'text-purple-600',
    features: ['Multi-Provider', 'HD Quality', 'Fast Generation', '300x Cost Savings'],
    href: '/video',
    badge: 'Pro',
    examples: [
      {
        title: 'Product Demo',
        description: 'Dynamic product showcases with smooth animations',
        image: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400&h=300&fit=crop&crop=center',
        type: 'Demo'
      },
      {
        title: 'Social Content',
        description: 'Engaging videos for social media platforms',
        image: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=400&h=300&fit=crop&crop=center',
        type: 'Social'
      }
    ]
  }
]

const showcaseItems = [
  {
    id: 1,
    title: 'Cyberpunk City Skyline',
    prompt: 'Neon-lit futuristic cityscape at night with flying cars',
    type: 'image',
    image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=500&h=600&fit=crop',
    likes: 234,
    views: 1520,
    author: 'AI Artist'
  },
  {
    id: 2,
    title: 'Fashion Model Runway',
    prompt: 'Elegant fashion model walking on LED-lit runway',
    type: 'video',
    image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=500&h=600&fit=crop',
    likes: 189,
    views: 987,
    author: 'StyleGen'
  },
  {
    id: 3,
    title: 'Tech Startup Story',
    prompt: 'Compelling narrative about AI revolutionizing business',
    type: 'text',
    image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=500&h=600&fit=crop',
    likes: 156,
    views: 2340,
    author: 'ContentCrafter'
  },
  {
    id: 4,
    title: 'Mystical Forest Scene',
    prompt: 'Enchanted forest with magical creatures and glowing lights',
    type: 'image',
    image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=500&h=600&fit=crop',
    likes: 312,
    views: 1876,
    author: 'FantasyArt'
  }
]

export default function HomePage() {
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
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50">
      {/* Modern Header */}
      <header className="border-b border-white/20 bg-white/80 backdrop-blur-xl sticky top-0 z-50 shadow-lg shadow-purple-500/5">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Wand2 className="w-5 h-5 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-orange-400 to-pink-400 rounded-full flex items-center justify-center">
                  <Stars className="w-2 h-2 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  TheAIVault
                </h1>
                <p className="text-xs text-slate-500 font-medium">Create • Generate • Inspire</p>
              </div>
            </div>
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="/gallery" className="text-slate-600 hover:text-purple-600 font-medium transition-colors">
                Gallery
              </Link>
              <Link href="/text" className="text-slate-600 hover:text-purple-600 font-medium transition-colors">
                Text
              </Link>
              <Link href="/image" className="text-slate-600 hover:text-purple-600 font-medium transition-colors">
                Images
              </Link>
              <Link href="/video" className="text-slate-600 hover:text-purple-600 font-medium transition-colors">
                Videos
              </Link>
            </nav>
            <div className="flex items-center gap-4">
              {user ? (
                <UserDropdown onPurchase={handlePurchase} onShowPricing={() => setShowPricing(true)} />
              ) : (
                <button
                  onClick={() => setShowAuth(true)}
                  className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Get Started
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section - Imagine.art Inspired */}
      <section className="relative py-20 px-6 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 to-pink-600/5"></div>
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-300/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-pink-300/20 rounded-full blur-3xl"></div>

        <div className="relative max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full mb-8 border border-purple-200/50">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                AI-Powered Content Creation
              </span>
              <Zap className="w-4 h-4 text-pink-600" />
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 bg-clip-text text-transparent">
                Create Amazing
              </span>
              <br />
              <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">
                AI Content
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-slate-600 mb-12 max-w-4xl mx-auto leading-relaxed font-light">
              Transform your ideas into stunning visuals, engaging videos, and compelling text with our advanced AI tools.
              <span className="block mt-2 text-lg text-slate-500">Start creating in seconds, no expertise required.</span>
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <button
                onClick={() => setShowAuth(true)}
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold text-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2"
              >
                Start Creating Free
                <ArrowRight className="w-5 h-5" />
              </button>
              <Link
                href="/gallery"
                className="px-8 py-4 bg-white border border-gray-200 text-slate-700 rounded-xl font-semibold text-lg hover:bg-slate-50 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
              >
                <Eye className="w-5 h-5" />
                Browse Gallery
              </Link>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-1">10K+</div>
                <div className="text-sm text-slate-500">Creations Made</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-pink-600 mb-1">300x</div>
                <div className="text-sm text-slate-500">Cost Savings</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600 mb-1">2.5K+</div>
                <div className="text-sm text-slate-500">Happy Users</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* AI Tools Section - Card Grid */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-slate-900 to-purple-900 bg-clip-text text-transparent">
              Powerful AI Tools
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Choose from our suite of advanced AI models to bring your creative vision to life
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {aiTools.map((tool, index) => (
              <motion.div
                key={tool.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="group"
              >
                <Link href={tool.href}>
                  <div className={`relative bg-gradient-to-br ${tool.bgGradient} p-8 rounded-2xl border border-white/20 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 cursor-pointer overflow-hidden`}>
                    {/* Background Pattern */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent"></div>

                    {/* Badge */}
                    {tool.badge && (
                      <div className="absolute top-4 right-4 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-bold text-slate-700 border border-white/20">
                        {tool.badge}
                      </div>
                    )}

                    {/* Icon */}
                    <div className={`relative w-16 h-16 rounded-2xl bg-gradient-to-br ${tool.gradient} flex items-center justify-center mb-6 shadow-lg`}>
                      <tool.icon className="w-8 h-8 text-white" />
                    </div>

                    {/* Content */}
                    <div className="relative">
                      <h3 className="text-2xl font-bold text-slate-900 mb-3 group-hover:text-purple-700 transition-colors">
                        {tool.title}
                      </h3>
                      <p className="text-slate-600 mb-6 leading-relaxed">
                        {tool.description}
                      </p>

                      {/* Features */}
                      <ul className="space-y-2 mb-6">
                        {tool.features.slice(0, 3).map((feature, idx) => (
                          <li key={idx} className="flex items-center gap-3 text-sm text-slate-600">
                            <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>

                      {/* CTA */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-500">
                          Try it now →
                        </span>
                        <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Community Showcase */}
      <section className="py-20 px-6 bg-gradient-to-br from-slate-50 to-purple-50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-slate-900 to-purple-900 bg-clip-text text-transparent">
              Community Creations
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              See what amazing content our community has created with AI
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {showcaseItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group cursor-pointer"
              >
                <div className="relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                  {/* Image */}
                  <div className="relative aspect-[4/5] overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    {/* Type Badge */}
                    <div className="absolute top-3 left-3 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-lg text-xs font-medium text-white capitalize">
                      {item.type}
                    </div>
                    {/* Play button for videos */}
                    {item.type === 'video' && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg">
                          <Play className="w-6 h-6 text-slate-700 ml-1" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-semibold text-slate-900 mb-1 line-clamp-1">{item.title}</h3>
                    <p className="text-xs text-slate-500 mb-3 line-clamp-2">{item.prompt}</p>

                    {/* Stats */}
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Heart className="w-3 h-3" />
                          {item.likes}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {item.views}
                        </span>
                      </div>
                      <span className="text-slate-400">by {item.author}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/gallery"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Palette className="w-5 h-5" />
              Explore Full Gallery
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Auth & Pricing Modals */}
      <AuthModal
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
        onSuccess={() => setShowAuth(false)}
      />

      <PricingModal
        isOpen={showPricing}
        onClose={() => setShowPricing(false)}
        onPurchase={handlePurchase}
      />
    </main>
  )
}