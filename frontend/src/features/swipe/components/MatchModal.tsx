'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, MessageCircle, Sparkles, PartyPopper } from 'lucide-react'
import { type User } from '@shared/types'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface MatchModalProps {
  isOpen: boolean
  matchedUser: User | null
  onClose: () => void
}

// Confetti particle component
const Confetti = ({ delay }: { delay: number }) => {
  const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#FF8B94', '#A8E6CF']
  const color = colors[Math.floor(Math.random() * colors.length)]
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
const FloatingHeart = ({ delay, x }: { delay: number; x: number }) => (
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

export const MatchModal = ({ isOpen, matchedUser, onClose }: MatchModalProps) => {
  const router = useRouter()
  const [showContent, setShowContent] = useState(false)

  // #region agent log
  if (isOpen && matchedUser) {
    fetch('http://127.0.0.1:7242/ingest/b19804b6-4386-4870-8813-100e008e11a3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MatchModal.tsx:76',message:'MatchModal opened',data:{matchedUserId:matchedUser.id,matchedUserName:matchedUser.firstName},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1'})}).catch(()=>{});
  }
  // #endregion

  useEffect(() => {
    if (isOpen) {
      // Delay content reveal for dramatic effect
      const timer = setTimeout(() => setShowContent(true), 300)
      return () => clearTimeout(timer)
    } else {
      setShowContent(false)
    }
  }, [isOpen])

  if (!matchedUser) return null

  const userPhoto = matchedUser.profile?.photo
  const userName = matchedUser.profile?.nickName || matchedUser.firstName

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden"
        >
          {/* Animated gradient background */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gradient-to-br from-brand/90 via-brand-300/90 to-pink-500/90 backdrop-blur-xl"
          />
          
          {/* Confetti */}
          {isOpen && [...Array(30)].map((_, i) => (
            <Confetti key={`confetti-${i}`} delay={i * 0.05} />
          ))}
          
          {/* Floating hearts */}
          {isOpen && [...Array(10)].map((_, i) => (
            <FloatingHeart key={`heart-${i}`} delay={i * 0.3} x={10 + i * 8} />
          ))}

          {/* Content card */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ 
              type: 'spring', 
              stiffness: 300, 
              damping: 25,
              delay: 0.1 
            }}
            className="relative bg-white dark:bg-neutral-900 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Decorative sparkles */}
            <motion.div
              className="absolute top-4 left-4"
              animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Sparkles className="w-6 h-6 text-yellow-400" />
            </motion.div>
            <motion.div
              className="absolute top-4 right-4"
              animate={{ rotate: [0, -15, 15, 0], scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
            >
              <PartyPopper className="w-6 h-6 text-brand" />
            </motion.div>

            <AnimatePresence>
              {showContent && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="space-y-6"
                >
                  {/* Profile photo with animated border */}
                  <div className="relative mx-auto w-28 h-28">
                    {/* Animated ring */}
                    <motion.div
                      className="absolute inset-0 rounded-full border-4 border-brand"
                      animate={{ scale: [1, 1.15, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <motion.div
                      className="absolute inset-0 rounded-full border-4 border-brand/50"
                      animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    
                    {/* Photo */}
                    <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-white dark:border-neutral-800 shadow-xl">
                      {userPhoto ? (
                        <Image
                          src={userPhoto}
                          alt={userName || 'Match'}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-brand to-brand-300 flex items-center justify-center">
                          <span className="text-4xl">💕</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Heart badge */}
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', delay: 0.5 }}
                      className="absolute -bottom-2 -right-2 w-10 h-10 bg-gradient-to-br from-brand to-brand-300 rounded-full flex items-center justify-center shadow-lg"
                    >
                      <Heart className="w-5 h-5 text-white fill-white" />
                    </motion.div>
                  </div>
                  
                  {/* Match text */}
                  <div className="space-y-2">
                    <motion.h2 
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: 'spring', delay: 0.3 }}
                      className="text-4xl sm:text-5xl font-black italic bg-gradient-to-r from-brand to-brand-300 bg-clip-text text-transparent uppercase tracking-tight"
                    >
                      It&apos;s a Match!
                    </motion.h2>
                    <motion.p 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      className="text-neutral-600 dark:text-neutral-300 text-lg"
                    >
                      You and <span className="font-bold text-neutral-900 dark:text-white">{userName}</span> like each other!
                    </motion.p>
                  </div>

                  {/* Action buttons */}
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="space-y-3 pt-4"
                  >
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        // #region agent log
                        fetch('http://127.0.0.1:7242/ingest/b19804b6-4386-4870-8813-100e008e11a3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MatchModal.tsx:227',message:'Start Chatting clicked - navigating to /matches',data:{matchedUserId:matchedUser?.id,currentPath:typeof window !== 'undefined' ? window.location.pathname : 'unknown'},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1'})}).catch(()=>{});
                        // #endregion
                        router.push('/matches')
                      }}
                      className="w-full py-4 bg-gradient-to-r from-brand to-brand-300 text-white rounded-2xl font-bold text-lg tracking-wide shadow-xl shadow-brand/30 hover:shadow-2xl hover:shadow-brand/40 transition-shadow cursor-pointer flex items-center justify-center gap-3"
                    >
                      <MessageCircle className="w-5 h-5" />
                      Start Chatting
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={onClose}
                      className="w-full py-4 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 rounded-2xl font-bold tracking-wide hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
                    >
                      Keep Swiping
                    </motion.button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
