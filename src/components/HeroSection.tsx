'use client'

import { motion } from 'framer-motion'

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 -z-10 flex items-center justify-center">
        <motion.div
          animate={{
            rotate: [0, 360],
            scale: [1, 1.1, 1]
          }}
          transition={{
            rotate: { duration: 20, repeat: Infinity, ease: "linear" },
            scale: { duration: 4, repeat: Infinity, ease: "easeInOut" }
          }}
          className="text-9xl font-bold text-primary/10 select-none"
        >
          AI
        </motion.div>
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="relative">
            <h1 className="text-4xl md:text-6xl lg:text-8xl font-bold mb-6">
              <span className="gradient-text">TheAI</span>
              <span className="text-accent">Vault</span>
              <div className="absolute -top-4 -right-8 text-sm bg-gradient-to-r from-violet-600 to-purple-600 text-white px-3 py-1 rounded-full transform rotate-12 animate-pulse">
                PREMIUM
              </div>
            </h1>
          </div>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-4xl mx-auto leading-relaxed">
            Unleash the power of AI creativity. Generate breathtaking{' '}
            <span className="text-accent font-semibold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">videos</span>,{' '}
            <span className="text-accent font-semibold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">images</span>, and{' '}
            <span className="text-accent font-semibold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">content</span>{' '}
            that dominates social media. Where creativity meets cutting-edge technology.
          </p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-wrap gap-4 justify-center mb-12"
          >
            <div className="glass px-6 py-3 rounded-full border border-violet-500/20">
              <span className="text-sm font-medium">🎯 1 Free Creation</span>
            </div>
            <div className="glass px-6 py-3 rounded-full border border-purple-500/20">
              <span className="text-sm font-medium">⚡ Enterprise Quality</span>
            </div>
            <div className="glass px-6 py-3 rounded-full border border-pink-500/20">
              <span className="text-sm font-medium">🔥 Viral Content</span>
            </div>
            <div className="glass px-6 py-3 rounded-full border border-blue-500/20">
              <span className="text-sm font-medium">💎 Premium Experience</span>
            </div>
          </motion.div>

          {/* Feature Cards */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto"
          >
            <div className="glass p-8 rounded-3xl hover:glow transition-all duration-500 border border-violet-500/20 group">
              <div className="text-4xl mb-6 group-hover:scale-110 transition-transform duration-300">🎬</div>
              <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">Cinematic Videos</h3>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Generate Hollywood-grade videos that go viral. Perfect for TikTok, Instagram Reels, and YouTube with Google's cutting-edge Veo 3.1 AI.
              </p>
              <div className="mt-6 flex items-center gap-2 text-sm text-violet-400">
                <span className="w-2 h-2 bg-violet-400 rounded-full animate-pulse"></span>
                <span>8K Quality • Instant Generation</span>
              </div>
            </div>

            <div className="glass p-8 rounded-3xl hover:glow transition-all duration-500 border border-pink-500/20 group">
              <div className="text-4xl mb-6 group-hover:scale-110 transition-transform duration-300">🎨</div>
              <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">Masterpiece Images</h3>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Create stunning artwork, photorealistic images, and designs that captivate audiences. Powered by OpenAI's revolutionary DALL-E 3.
              </p>
              <div className="mt-6 flex items-center gap-2 text-sm text-pink-400">
                <span className="w-2 h-2 bg-pink-400 rounded-full animate-pulse"></span>
                <span>Ultra HD • Artistic Excellence</span>
              </div>
            </div>

            <div className="glass p-8 rounded-3xl hover:glow transition-all duration-500 border border-blue-500/20 group">
              <div className="text-4xl mb-6 group-hover:scale-110 transition-transform duration-300">✍️</div>
              <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">Viral Content</h3>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Craft compelling captions, scripts, and social media content that drives engagement. Enhanced by OpenAI's GPT-4 intelligence.
              </p>
              <div className="mt-6 flex items-center gap-2 text-sm text-blue-400">
                <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
                <span>AI-Powered • Engagement Boost</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
      >
        <div className="w-6 h-10 border-2 border-primary/50 rounded-full flex justify-center">
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-1 h-3 bg-primary rounded-full mt-2"
          />
        </div>
      </motion.div>
    </section>
  )
}