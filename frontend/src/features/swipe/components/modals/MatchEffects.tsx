'use client'

import { motion } from 'framer-motion'
import { Heart } from 'lucide-react'

const CONFETTI_COLORS = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#FF8B94', '#A8E6CF']

// Confetti particle component
export const Confetti = ({ delay }: { delay: number }) => {
  const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)]
  const size = Math.random() * 8 + 4
  const startX = Math.random() * 100

  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{
        left: `${startX}%`,
        top: '-10%',
        width: size,
        height: size,
        backgroundColor: color,
        borderRadius: Math.random() > 0.5 ? '50%' : '2px',
      }}
      initial={{ y: 0, x: 0, opacity: 1, rotate: 0 }}
      animate={{
        y: '120vh',
        x: (Math.random() - 0.5) * 200,
        opacity: [1, 1, 0],
        rotate: Math.random() * 720 - 360,
      }}
      transition={{
        duration: 3 + Math.random() * 2,
        delay,
        ease: 'linear',
      }}
    />
  )
}

// Floating hearts background
export const FloatingHeart = ({ delay, x }: { delay: number; x: number }) => (
  <motion.div
    className="absolute pointer-events-none"
    style={{ left: `${x}%`, bottom: '0%' }}
    initial={{ y: 0, opacity: 0, scale: 0 }}
    animate={{
      y: '-100vh',
      opacity: [0, 0.8, 0],
      scale: [0.5, 1, 0.5],
    }}
    transition={{
      duration: 4 + Math.random() * 2,
      delay,
      ease: 'easeOut',
    }}
  >
    <Heart className="w-6 h-6 text-brand/60 fill-brand/40" />
  </motion.div>
)

export const MatchEffects = ({ count = 30 }: { count?: number }) => (
  <>
    {[...Array(count)].map((_, i) => (
      <Confetti key={`confetti-${i}`} delay={i * 0.05} />
    ))}
    {[...Array(Math.floor(count / 3))].map((_, i) => (
      <FloatingHeart key={`heart-${i}`} delay={i * 0.3} x={10 + i * 8} />
    ))}
  </>
)
