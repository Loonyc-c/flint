'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { useCallSounds } from '../hooks/useCallSounds'
import type { PartnerInfo } from '../types/call-fsm'

// =============================================================================
// Types
// =============================================================================

interface ConnectingScreenProps {
    partnerInfo: PartnerInfo
    isRequester?: boolean
    onTimeout?: () => void
    onCancel?: () => void
    timeoutMs?: number
}

// =============================================================================
// Component
// =============================================================================

export const ConnectingScreen = ({
    partnerInfo,
    isRequester = false,
    onTimeout,
    onCancel,
    timeoutMs = 15000
}: ConnectingScreenProps) => {
    const t = useTranslations('call.connecting')
    const { playDialing, stopDialing } = useCallSounds()
    const [timedOut, setTimedOut] = useState(false)

    useEffect(() => {
        if (isRequester && !timedOut) {
            playDialing()
        } else {
            stopDialing()
        }

        const timer = setTimeout(() => {
            setTimedOut(true)
            stopDialing()
            onTimeout?.()
        }, timeoutMs)

        return () => {
            clearTimeout(timer)
            stopDialing()
        }
    }, [timeoutMs, onTimeout, isRequester, timedOut, playDialing, stopDialing])

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-sm bg-card rounded-3xl shadow-2xl p-8 border border-border/50 relative overflow-hidden"
            >
                {/* Background decorative elements */}
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-brand/10 to-transparent pointer-events-none" />

                <div className="relative z-10 flex flex-col items-center text-center">
                    {/* Partner Avatar */}
                    <motion.div
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                        className="mb-8"
                    >
                        <UserAvatar
                            src={partnerInfo.avatar}
                            name={partnerInfo.name}
                            size="xl"
                            className="mx-auto ring-4 ring-brand/30 shadow-lg"
                        />
                    </motion.div>

                    {/* Connecting Text */}
                    <h3 className="text-xl font-bold text-foreground mb-2">
                        {timedOut ? t('timeout') : (isRequester ? t('calling') : t('connecting'))}
                    </h3>
                    <p className="text-muted-foreground mb-8 text-base">
                        {timedOut ? t('timeoutMessage') : (isRequester ? t('callingTo', { name: partnerInfo.name }) : t('connectingTo', { name: partnerInfo.name }))}
                    </p>

                    {/* Spinner */}
                    {!timedOut && (
                        <div className="flex flex-col items-center gap-8 w-full">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                className="inline-block"
                            >
                                <Loader2 className="w-8 h-8 text-brand" />
                            </motion.div>

                            {isRequester && (
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={onCancel || onTimeout}
                                    className="w-full h-12 rounded-full bg-destructive/10 border border-destructive/20 text-destructive font-semibold hover:bg-destructive hover:text-white transition-all flex items-center justify-center"
                                >
                                    {t('cancel')}
                                </motion.button>
                            )}
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    )
}
