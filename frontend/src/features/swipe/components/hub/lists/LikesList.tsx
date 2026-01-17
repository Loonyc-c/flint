'use client'

import { motion } from 'framer-motion'
import { Heart, Sparkles, Eye, Lock } from 'lucide-react'
import { type LikePreview } from '@shared/types'
import Image from 'next/image'
import { useTranslations } from 'next-intl'

interface LikesListProps {
  likes: LikePreview[]
  onSelect: (userId: string) => void
}

// Card component for each like
const LikeCard = ({
  like,
  onSelect,
  index
}: {
  like: LikePreview
  onSelect: () => void
  index: number
}) => {
  const t = useTranslations('swipe.hub')
  const fullName = like.user.nickName || 'User' // nickName is now public name

  // Check if this is a "blurred" preview (premium feature)
  const isBlurred = true // Can be controlled by subscription status

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{
        delay: index * 0.05,
        type: 'spring',
        stiffness: 300,
        damping: 25
      }}
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-neutral-200 dark:bg-neutral-800 group cursor-pointer shadow-lg hover:shadow-xl transition-shadow"
    >
      {/* Photo - blurred for non-premium */}
      {like.user.avatar ? (
        <Image
          src={like.user.avatar}
          alt={fullName}
          fill
          className={`object-cover transition-all duration-500 ${isBlurred ? 'blur-lg scale-110' : 'group-hover:scale-105'}`}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-100 to-orange-200 dark:from-amber-900/50 dark:to-orange-900/50">
          <span className={`text-5xl font-bold text-amber-500/50 ${isBlurred ? 'blur-sm' : ''}`}>
            {(like.user.nickName || 'U').charAt(0)}
          </span>
        </div>
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />

      {/* "New" badge */}
      <motion.div
        initial={{ scale: 0, rotate: -12 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: index * 0.05 + 0.2, type: 'spring' }}
        className="absolute top-3 right-3 z-10"
      >
        <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 px-2.5 py-1 rounded-full shadow-lg shadow-amber-500/30">
          <Sparkles className="w-3 h-3 text-white" />
          <span className="text-[10px] font-bold text-white uppercase tracking-wider">{t('new')}</span>
        </div>
      </motion.div>

      {/* Heart decoration */}
      <motion.div
        className="absolute top-3 left-3"
        animate={{ scale: [1, 1.3, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <Heart className="w-5 h-5 text-brand fill-brand drop-shadow-lg" />
      </motion.div>

      {/* Blur overlay with reveal button (for premium feature) */}
      {isBlurred && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="flex flex-col items-center gap-2">
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
            >
              <Eye className="w-7 h-7 text-white" />
            </motion.div>
            <span className="text-xs font-semibold text-white/90 text-center px-2">
              {t('tapToReveal')}
            </span>
          </div>
        </motion.div>
      )}

      {/* Info overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <h3 className={`text-white font-bold text-lg truncate drop-shadow-lg ${isBlurred ? 'blur-sm' : ''}`}>
          {fullName}
        </h3>
        <div className="flex items-center gap-2 mt-1">
          <div className="flex items-center gap-1 text-white/70">
            <Heart className="w-3.5 h-3.5 fill-current" />
            <span className="text-xs">{t('likesYou')}</span>
          </div>
        </div>
      </div>

      {/* Hover effect overlay */}
      <div className="absolute inset-0 bg-amber-500/0 group-hover:bg-amber-500/10 transition-colors duration-300" />
    </motion.button>
  )
}

// Empty state
const EmptyState = () => {
  const t = useTranslations('swipe.hub')
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="col-span-full flex flex-col items-center justify-center py-20 px-4"
    >
      <motion.div
        animate={{ y: [0, -8, 0], rotate: [0, 5, -5, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center mb-6"
      >
        <Sparkles className="w-10 h-10 text-amber-500" />
      </motion.div>
      <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">
        {t('noLikes')}
      </h3>
      <p className="text-neutral-500 dark:text-neutral-400 text-center max-w-xs">
        {t('noLikesDesc')}
      </p>
    </motion.div>
  )
}

export const LikesList = ({ likes, onSelect }: LikesListProps) => {
  const t = useTranslations('swipe.hub')
  if (likes.length === 0) {
    return <EmptyState />
  }

  return (
    <div className="p-4 sm:p-5">
      {/* Premium upsell banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4 p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 dark:from-amber-500/20 dark:via-orange-500/20 dark:to-amber-500/20"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shrink-0">
            <Lock className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-neutral-900 dark:text-white">
              {t('seeWhoLikes')}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {t('seeWhoLikesDesc')}
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold shadow-lg shadow-amber-500/30 shrink-0"
          >
            {t('upgrade')}
          </motion.button>
        </div>
      </motion.div>

      {/* Likes grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-4">
        {likes.map((like, index) => (
          <LikeCard
            key={like.id}
            like={like}
            onSelect={() => onSelect(like.user.id)}
            index={index}
          />
        ))}
      </div>
    </div>
  )
}
