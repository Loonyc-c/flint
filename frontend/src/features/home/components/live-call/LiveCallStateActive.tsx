'use client'

import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { X, Heart, ThumbsDown, Timer } from 'lucide-react'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { cn } from '@/lib/utils'
import type { LiveCallMatchPayload } from '@/shared-types/types/live-call'

interface LiveCallStateActiveProps {
    matchData: LiveCallMatchPayload
    remainingTime: number
    hasLiked: boolean
    hasPassed: boolean
    performAction: (action: 'like' | 'pass') => void
    onClose: () => void
}

export const LiveCallStateActive = ({
    matchData,
    remainingTime,
    hasLiked,
    hasPassed,
    performAction,
    onClose
}: LiveCallStateActiveProps) => {
    const t = useTranslations('home.findMatch.liveCall')

    return (
        <div className="flex flex-col h-full max-h-[90vh]">
            <div className="bg-brand/5 pb-8 pt-12 text-center relative border-b border-border/50">
                {/* Timer */}
                <div className="absolute top-4 right-4 bg-background/80 backdrop-blur-md px-3 py-1.5 rounded-full text-sm font-mono border border-border flex items-center gap-2 shadow-sm">
                    <Timer
                        className={cn(
                            'w-4 h-4',
                            remainingTime < 15 ? 'text-destructive animate-pulse' : 'text-brand'
                        )}
                    />
                    <span
                        className={cn(
                            remainingTime < 15 ? 'text-destructive font-bold' : 'text-foreground'
                        )}
                    >
                        {Math.floor(remainingTime / 60)}:
                        {(remainingTime % 60).toString().padStart(2, '0')}
                    </span>
                </div>

                <div className="flex justify-center mb-6">
                    <div className="relative">
                        <UserAvatar
                            src={matchData.partner.photo}
                            name={matchData.partner.nickName}
                            size="2xl"
                            border
                            className="w-32 h-32 ring-4 ring-brand/10"
                        />
                        <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute -bottom-1 -right-1 bg-green-500 w-6 h-6 rounded-full border-4 border-card"
                        />
                    </div>
                </div>
                <h2 className="text-3xl font-bold text-foreground">
                    {matchData.partner.nickName}, {matchData.partner.age}
                </h2>
                <p className="text-brand font-bold mt-2 uppercase tracking-widest text-[10px]">
                    {t('connected')}
                </p>
            </div>

            <div className="flex-1 flex flex-col justify-center items-center py-12 px-8">
                <div className="flex items-center space-x-2 mb-6">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-1.5 h-1.5 rounded-full bg-brand animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-1.5 h-1.5 rounded-full bg-brand animate-bounce" />
                </div>
                <p className="text-muted-foreground text-center font-medium leading-relaxed">
                    {t('talkingTo', { name: matchData.partner.nickName })}
                </p>
            </div>

            <div className="p-10 flex justify-center gap-8 bg-muted/30 border-t border-border">
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => performAction('pass')}
                    disabled={hasPassed || hasLiked}
                    className={cn(
                        'w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-lg',
                        hasPassed
                            ? 'bg-neutral-200 text-neutral-400'
                            : 'bg-white dark:bg-neutral-800 text-neutral-500 hover:text-destructive hover:shadow-destructive/20 border border-border'
                    )}
                >
                    <ThumbsDown className="w-7 h-7" />
                </motion.button>

                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => performAction('like')}
                    disabled={hasPassed || hasLiked}
                    className={cn(
                        'w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-xl',
                        hasLiked
                            ? 'bg-brand/50 text-white scale-95'
                            : 'bg-brand text-white hover:bg-brand-300 shadow-brand/30'
                    )}
                >
                    <Heart className={cn('w-10 h-10', hasLiked && 'fill-current')} />
                </motion.button>

                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onClose}
                    className="w-16 h-16 rounded-full bg-white dark:bg-neutral-800 text-neutral-500 hover:text-foreground border border-border flex items-center justify-center shadow-lg transition-all"
                >
                    <X className="w-7 h-7" />
                </motion.button>
            </div>
        </div>
    )
}
