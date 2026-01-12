'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Heart, Crown, Eye, Sparkles, Target } from 'lucide-react'
import { useRouter } from '@/i18n/routing'

interface LikeLimitModalProps {
  isOpen: boolean
  onClose: () => void
  limit?: number
  used?: number
}

export const LikeLimitModal = ({ isOpen, onClose, limit = 5, used = 5 }: LikeLimitModalProps) => {
  const router = useRouter()

  const handleUpgrade = () => {
    onClose()
    router.push('/subscription')
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white dark:bg-neutral-800 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
              {/* Header */}
              <div className="relative bg-gradient-to-br from-brand via-brand-300 to-brand-400 p-6 sm:p-8 text-white">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex flex-col items-center text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring' }}
                    className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 rounded-full flex items-center justify-center mb-4"
                  >
                    <Heart className="w-8 h-8 sm:w-10 sm:h-10 fill-white" />
                  </motion.div>
                  <h2 className="text-xl sm:text-2xl font-bold mb-2">
                    Daily Like Limit Reached!
                  </h2>
                  <p className="text-white/90 text-sm">
                    You&apos;ve used {used} out of {limit} free likes today
                  </p>
                </div>
              </div>

              {/* Content */}
              <div className="p-5 sm:p-6">
                <p className="text-neutral-600 dark:text-neutral-400 text-center mb-5 sm:mb-6 text-sm sm:text-base">
                  Upgrade to Premium to unlock unlimited likes and more amazing features!
                </p>

                {/* Premium Features */}
                <div className="space-y-3 mb-5 sm:mb-6">
                  <FeatureItem
                    icon={Heart}
                    title="Unlimited Likes"
                    description="Like as many profiles as you want, every day"
                  />
                  <FeatureItem
                    icon={Eye}
                    title="See Who Likes You"
                    description="Know who's interested before you swipe"
                  />
                  <FeatureItem
                    icon={Sparkles}
                    title="AI Wingmen"
                    description="Get personalized conversation starters and tips"
                  />
                  <FeatureItem
                    icon={Target}
                    title="Priority Matching"
                    description="Get shown to more people and match faster"
                  />
                </div>

                {/* CTA Buttons */}
                <div className="space-y-3">
                  <button
                    onClick={handleUpgrade}
                    className="w-full bg-gradient-to-r from-brand to-brand-300 text-white font-semibold py-3 sm:py-3.5 px-6 rounded-xl hover:from-brand-400 hover:to-brand transition-all shadow-lg shadow-brand/30 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Crown className="w-5 h-5" />
                    Upgrade to Premium
                  </button>

                  <button
                    onClick={onClose}
                    className="w-full bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-medium py-3 px-6 rounded-xl hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors cursor-pointer"
                  >
                    Maybe Later
                  </button>
                </div>

                {/* Reset Info */}
                <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center mt-4">
                  Your free likes will reset in 24 hours
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// Feature Item Component
interface FeatureItemProps {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
}

const FeatureItem = ({ icon: Icon, title, description }: FeatureItemProps) => (
  <div className="flex items-start gap-3">
    <div className="w-6 h-6 bg-brand/10 dark:bg-brand/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
      <Icon className="w-3.5 h-3.5 text-brand dark:text-brand-300" />
    </div>
    <div>
      <p className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm">
        {title}
      </p>
      <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
        {description}
      </p>
    </div>
  </div>
)
