'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { UserAvatar } from '@/components/ui/UserAvatar'
import type { PartnerInfo } from '../types/call-fsm'

// =============================================================================
// Types
// =============================================================================

interface ConnectingScreenProps {
    partnerInfo: PartnerInfo
    onTimeout?: () => void
    timeoutMs?: number
}

// =============================================================================
// Component
// =============================================================================

export const ConnectingScreen = ({
    partnerInfo,
    onTimeout,
    timeoutMs = 15000
}: ConnectingScreenProps) => {
    const t = useTranslations('call.connecting')
    const [timedOut, setTimedOut] = useState(false)

    useEffect(() => {
        const timer = setTimeout(() => {
            setTimedOut(true)
            onTimeout?.()
        }, timeoutMs)

        return () => clearTimeout(timer)
    }, [timeoutMs, onTimeout])

    return (
        <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center p-4">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="max-w-md w-full text-center"
            >
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
                        className="mx-auto ring-4 ring-brand/30"
                    />
                </motion.div>

                {/* Connecting Text */}
                <h3 className="text-2xl font-bold text-white mb-2">
                    {timedOut ? t('timeout') : t('connecting')}
                </h3>
                <p className="text-white/60 mb-8">
                    {timedOut ? t('timeoutMessage') : t('connectingTo', { name: partnerInfo.name })}
                </p>

                {/* Spinner */}
                {!timedOut && (
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="inline-block"
                    >
                        <Loader2 className="w-8 h-8 text-brand" />
                    </motion.div>
                )}
            </motion.div>
        </div>
    )
}
