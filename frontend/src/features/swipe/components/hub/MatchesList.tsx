'use client'

import { motion } from 'framer-motion'
import { Heart, MessageCircle } from 'lucide-react'
import { type ChatConversation } from '@shared/types'
import Image from 'next/image'

interface MatchesListProps {
  matches: ChatConversation[]
  onSelect: (id: string) => void
}

// Card component for each match
const MatchCard = ({ 
  match, 
  onSelect,
  index
}: { 
  match: ChatConversation
  onSelect: () => void
  index: number
}) => {
  const hasUnread = match.unreadCount > 0

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
      {/* Photo */}
      {match.otherUser.avatar ? (
        <Image
          src={match.otherUser.avatar}
          alt={match.otherUser.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-300 to-neutral-400 dark:from-neutral-700 dark:to-neutral-600">
          <span className="text-5xl font-bold text-white/50">
            {match.otherUser.name.charAt(0)}
          </span>
        </div>
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      {/* Unread badge */}
      {hasUnread && (
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-3 right-3 z-10"
        >
          <div className="flex items-center gap-1.5 bg-brand/90 backdrop-blur-sm px-2.5 py-1 rounded-full shadow-lg shadow-brand/30">
            <MessageCircle className="w-3.5 h-3.5 text-white fill-white" />
            <span className="text-xs font-bold text-white">{match.unreadCount}</span>
          </div>
        </motion.div>
      )}

      {/* Heart decoration */}
      <motion.div
        className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <Heart className="w-5 h-5 text-brand fill-brand drop-shadow-lg" />
      </motion.div>

      {/* Info overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <h3 className="text-white font-bold text-lg truncate drop-shadow-lg">
          {match.otherUser.name}
        </h3>
        <p className="text-white/70 text-sm truncate mt-0.5">
          {match.lastMessage?.text || "New Match! Say hi 👋"}
        </p>
      </div>

      {/* Hover effect overlay */}
      <div className="absolute inset-0 bg-brand/0 group-hover:bg-brand/10 transition-colors duration-300" />
    </motion.button>
  )
}

// Empty state
const EmptyState = () => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="col-span-full flex flex-col items-center justify-center py-20 px-4"
  >
    <motion.div
      animate={{ y: [0, -8, 0] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      className="w-20 h-20 rounded-full bg-gradient-to-br from-brand/20 to-brand-300/20 flex items-center justify-center mb-6"
    >
      <Heart className="w-10 h-10 text-brand" />
    </motion.div>
    <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">
      No matches yet
    </h3>
    <p className="text-neutral-500 dark:text-neutral-400 text-center max-w-xs">
      Keep swiping to find your perfect match! When you both like each other, they&apos;ll appear here.
    </p>
  </motion.div>
)

export const MatchesList = ({ matches, onSelect }: MatchesListProps) => {
  if (matches.length === 0) {
    return <EmptyState />
  }

  return (
    <div className="p-4 sm:p-5">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-4">
        {matches.map((match, index) => (
          <MatchCard
            key={match.id}
            match={match}
            onSelect={() => onSelect(match.id)}
            index={index}
          />
        ))}
      </div>
    </div>
  )
}
