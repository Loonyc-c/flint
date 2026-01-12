'use client'

import { motion } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'

interface WaveformVisualizerProps {
  isActive: boolean
  color?: string
  height?: string
  barCount?: number
}

export const WaveformVisualizer = ({ 
  isActive, 
  color = 'bg-red-500', 
  height = 'h-16',
  barCount = 10
}: WaveformVisualizerProps) => {
  const [bars, setBars] = useState(Array(barCount).fill(40))
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        setBars(prev => prev.map(() => Math.random() * 100 + 20))
      }, 150)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
      setBars(Array(barCount).fill(40)) // Reset to baseline
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isActive, barCount])

  return (
    <div className={`flex items-center justify-center gap-1 ${height} w-full`}>
      {bars.map((h, i) => (
        <motion.div
          key={i}
          className={`w-1.5 rounded-full ${color}`}
          animate={{ height: `${h}%` }}
          transition={{ duration: 0.15, ease: 'easeInOut' }}
        />
      ))}
    </div>
  )
}
