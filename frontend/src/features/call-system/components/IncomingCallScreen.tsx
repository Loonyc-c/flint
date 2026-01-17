'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Phone, PhoneOff, Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { Button } from '@/components/ui/button'
import { useCallSounds } from '../hooks/useCallSounds'
import type { PartnerInfo } from '../types/call-fsm'

interface IncomingCallScreenProps {
    partnerInfo: PartnerInfo
    onAccept: () => void
    onDecline: () => void
    onTimeout?: () => void
    timeoutMs?: number
}

export const IncomingCallScreen = ({
    partnerInfo,
    onAccept,
    onDecline,
    onTimeout,
    timeoutMs = 15000
}: IncomingCallScreenProps) => {
    const t = useTranslations('call.incoming')
    const [timedOut, setTimedOut] = useState(false)
    const { playRingtone, stopRingtone } = useCallSounds()

    useEffect(() => {
        if (!timedOut) {
            playRingtone()
        } else {
            stopRingtone()
        }

        const timer = setTimeout(() => {
            setTimedOut(true)
            stopRingtone()
            onTimeout?.()
        }, timeoutMs)

        return () => {
            clearTimeout(timer)
            stopRingtone()
        }
    }, [timeoutMs, onTimeout, timedOut, playRingtone, stopRingtone])

    return (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-sm text-center">
                {/* Ringing Avatar Effect */}
                <div className="relative mb-12 flex justify-center">
                    <motion.div
                        animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute inset-0 bg-brand/20 rounded-full"
                    />
                    <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="relative z-10"
                    >
                        <UserAvatar
                            src={partnerInfo.avatar}
                            name={partnerInfo.name}
                            size="xl"
                            className="ring-4 ring-brand/50"
                        />
                    </motion.div>
                </div>

                {/* Text */}
                <h2 className="text-3xl font-bold text-white mb-2">
                    {timedOut ? t('timeout') : t('title')}
                </h2>
                <p className="text-white/60 text-lg mb-16">
                    {timedOut ? t('timeoutMessage') : t('subtitle', { name: partnerInfo.name })}
                </p>

                {/* Actions */}
                {!timedOut ? (
                    <div className="flex items-center justify-center gap-12">
                        <div className="flex flex-col items-center gap-3">
                            <Button
                                onClick={onDecline}
                                variant="outline"
                                size="icon"
                                className="w-16 h-16 rounded-full bg-red-500/10 border-red-500/50 hover:bg-red-500 hover:text-white transition-all text-red-500"
                            >
                                <PhoneOff className="w-8 h-8" />
                            </Button>
                            <span className="text-white/40 text-sm font-medium">{t('decline')}</span>
                        </div>

                        <div className="flex flex-col items-center gap-3">
                            <Button
                                onClick={onAccept}
                                variant="default"
                                size="icon"
                                className="w-20 h-20 rounded-full bg-brand hover:bg-brand/90 transition-all shadow-lg shadow-brand/20"
                            >
                                <Phone className="w-10 h-10 text-white animate-pulse" />
                            </Button>
                            <span className="text-brand text-sm font-bold uppercase tracking-wider">{t('accept')}</span>
                        </div>
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-center justify-center"
                    >
                        <Loader2 className="w-8 h-8 text-white/20 animate-spin" />
                    </motion.div>
                )}
            </div>
        </div>
    )
}
