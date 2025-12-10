'use client'

import { useEffect, useRef } from 'react'

export default function Background3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // Create stars
    const stars = Array.from({ length: 200 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      z: Math.random() * 1000,
      speed: Math.random() * 0.5 + 0.1,
    }))

    // Animation loop
    const animate = () => {
      ctx.fillStyle = 'rgba(15, 15, 23, 0.1)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      stars.forEach(star => {
        // Move star
        star.z -= star.speed
        if (star.z <= 0) {
          star.z = 1000
          star.x = Math.random() * canvas.width
          star.y = Math.random() * canvas.height
        }

        // Calculate position and size based on z
        const x = (star.x - canvas.width / 2) * (1000 / star.z) + canvas.width / 2
        const y = (star.y - canvas.height / 2) * (1000 / star.z) + canvas.height / 2
        const size = (1000 - star.z) / 1000 * 3

        // Draw star
        ctx.beginPath()
        ctx.arc(x, y, size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(139, 92, 246, ${(1000 - star.z) / 1000 * 0.8})`
        ctx.fill()
      })

      requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <div className="fixed inset-0 -z-10">
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{ background: 'linear-gradient(135deg, #0f0f17 0%, #1a1a2e 50%, #16213e 100%)' }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-violet-900/20 via-purple-900/10 to-fuchsia-900/20" />
    </div>
  )
}