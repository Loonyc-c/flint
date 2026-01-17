'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, ChevronRight, ChevronLeft, X, Brain } from 'lucide-react'
import { cn } from '@/lib/utils'

interface IcebreakerOverlayProps {
  questions: string[]
  onClose?: () => void
}

export const IcebreakerOverlay = ({ questions, onClose }: IcebreakerOverlayProps) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(true)

  const nextQuestion = () => {
    setCurrentIndex((prev) => (prev + 1) % questions.length)
  }

  const prevQuestion = () => {
    setCurrentIndex((prev) => (prev - 1 + questions.length) % questions.length)
  }

  const handleClose = () => {
    setIsVisible(false)
    onClose?.()
  }

  if (!isVisible || questions.length === 0) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.9 }}
        className="absolute bottom-24 left-1/2 -translate-x-1/2 w-full max-w-sm z-50 px-4"
      >
        <div className="bg-gradient-to-br from-brand/90 to-brand-600/90 backdrop-blur-md rounded-2xl p-5 shadow-2xl border border-white/20 relative overflow-hidden group">
          {/* Decorative Sparkles */}
          <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:opacity-40 transition-opacity">
            <Sparkles className="w-12 h-12 text-white animate-pulse" />
          </div>

          {/* Header */}
          <div className="flex items-center gap-2 mb-3">
            <div className="bg-white/20 p-1.5 rounded-lg">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-white/80">
              AI Wingman Suggestion
            </span>
            <button
              onClick={handleClose}
              className="ml-auto p-1 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-white/60" />
            </button>
          </div>

          {/* Question Text */}
          <div className="min-h-16 flex items-center justify-center text-center px-2">
            <motion.p
              key={currentIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-white font-bold text-lg leading-snug drop-shadow-sm"
            >
              &ldquo;{questions[currentIndex]}&rdquo;
            </motion.p>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex gap-1">
              {questions.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1 rounded-full transition-all duration-300",
                    i === currentIndex ? "w-4 bg-white" : "w-1 bg-white/30"
                  )}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={prevQuestion}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={nextQuestion}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
