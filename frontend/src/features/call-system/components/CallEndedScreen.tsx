'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Heart, MessageCircle, Home } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/routing'
import type { CallContext } from '../types/call-fsm'

// =============================================================================
// Types
// =============================================================================

interface CallEndedScreenProps {
    context: CallContext
    wasSuccessful?: boolean
    autoCloseMs?: number
    onClose: () => void
}

// =============================================================================
// Helper
// =============================================================================

const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

// =============================================================================
// Component
// =============================================================================

export const CallEndedScreen = ({
    context,
    wasSuccessful = false,
    autoCloseMs,
    onClose
}: CallEndedScreenProps) => {
    const t = useTranslations('call.ended')
    const router = useRouter()

    // Auto-close timer
    useEffect(() => {
        if (autoCloseMs) {
            const timer = setTimeout(onClose, autoCloseMs)
            return () => clearTimeout(timer)
        }
    }, [autoCloseMs, onClose])

    const duration = context.duration ? formatDuration(context.duration) : '0:00'

    return (
        <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center p-4">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="max-w-md w-full bg-card rounded-3xl p-8 text-center"
            >
                {/* Icon */}
                <div className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center ${wasSuccessful ? 'bg-green-500/20' : 'bg-muted'
                    }`}>
                    <Heart className={`w-10 h-10 ${wasSuccessful ? 'text-green-500' : 'text-muted-foreground'}`} />
                </div>

                {/* Title */}
                <h3 className="text-2xl font-bold text-foreground mb-2">
                    {wasSuccessful ? t('successTitle') : t('endedTitle')}
                </h3>
                <p className="text-muted-foreground mb-2">
                    {t('duration', { duration })}
                </p>
                <p className="text-sm text-muted-foreground mb-8">
                    {wasSuccessful ? t('successMessage') : t('endedMessage')}
                </p>

                {/* Action Buttons */}
                <div className="space-y-3">
                    {context.callType === 'staged' && (
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                                router.push(`/chat/${context.matchId}`)
                                onClose()
                            }}
                            className="w-full py-4 bg-brand text-white rounded-2xl font-bold flex items-center justify-center gap-2"
                        >
                            <MessageCircle className="w-5 h-5" />
                            {t('returnToChat')}
                        </motion.button>
                    )}

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                            router.push('/home')
                            onClose()
                        }}
                        className="w-full py-4 bg-muted text-foreground rounded-2xl font-bold flex items-center justify-center gap-2"
                    >
                        <Home className="w-5 h-5" />
                        {t('goHome')}
                    </motion.button>
                </div>
            </motion.div>
        </div>
    )
}
