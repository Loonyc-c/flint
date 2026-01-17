'use client'

import { useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Check, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { CallContext } from '../types/call-fsm'

// =============================================================================
// Types
// =============================================================================

interface IntermissionOverlayProps {
    context: CallContext
    onResponse: (accepted: boolean) => void
    muteStreams?: () => void
    unmuteStreams?: () => void
}

// =============================================================================
// Component
// =============================================================================

export const IntermissionOverlay = ({
    context,
    onResponse,
    muteStreams,
    unmuteStreams
}: IntermissionOverlayProps) => {
    const t = useTranslations('call.intermission')
    const nextStage = ((context.currentStage || 1) + 1) as 2 | 3 | 4

    // Mute streams on mount
    useEffect(() => {
        muteStreams?.()
        return () => {
            // Don't auto-unmute on unmount - let parent handle it
        }
    }, [muteStreams])

    const handleAccept = useCallback(() => {
        unmuteStreams?.()
        onResponse(true)
    }, [unmuteStreams, onResponse])

    const handleDecline = useCallback(() => {
        onResponse(false)
    }, [onResponse])

    return (
        <div className="fixed inset-0 z-[110] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="max-w-md w-full bg-card rounded-3xl p-8 text-center"
            >
                {/* Title */}
                <h3 className="text-2xl font-bold text-foreground mb-2">
                    {t('title', { stage: nextStage })}
                </h3>
                <p className="text-muted-foreground mb-8">
                    {t('description', { name: context.partnerInfo.name })}
                </p>

                {/* Action Buttons */}
                <div className="flex gap-4">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleDecline}
                        className="flex-1 py-4 bg-destructive/20 text-destructive rounded-2xl font-bold flex items-center justify-center gap-2"
                    >
                        <X className="w-5 h-5" />
                        {t('decline')}
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleAccept}
                        className="flex-1 py-4 bg-brand text-white rounded-2xl font-bold flex items-center justify-center gap-2"
                    >
                        <Check className="w-5 h-5" />
                        {t('accept')}
                    </motion.button>
                </div>

                {/* Info Text */}
                <p className="text-xs text-muted-foreground mt-4">
                    {t('waitingForBoth')}
                </p>
            </motion.div>
        </div>
    )
}
