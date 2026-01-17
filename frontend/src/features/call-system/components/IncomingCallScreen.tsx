'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Phone, PhoneOff, Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { UserAvatar } from '@/components/ui/UserAvatar'

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
                    {/* Ringing Avatar Effect */}
                    <div className="relative mb-8 flex justify-center">
                        <motion.div
                            animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute inset-0 bg-brand/30 rounded-full"
                        />
                        <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                            className="relative z-10"
                        >
                            <UserAvatar
                                src={partnerInfo.avatar}
                                name={partnerInfo.name}
                                size="xl"
                                className="ring-4 ring-brand shadow-lg"
                            />
                        </motion.div>
                    </div>

                    {/* Text */}
                    <h2 className="text-2xl font-bold text-foreground mb-2">
                        {timedOut ? t('timeout') : t('title')}
                    </h2>
                    <p className="text-muted-foreground text-base mb-10">
                        {timedOut ? t('timeoutMessage') : t('subtitle', { name: partnerInfo.name })}
                    </p>

                    {/* Actions */}
                    {!timedOut ? (
                        <div className="flex items-center justify-center gap-10 w-full">
                            <div className="flex flex-col items-center gap-2">
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={onDecline}
                                    className="w-16 h-16 rounded-full bg-destructive/10 border border-destructive/20 text-destructive flex items-center justify-center hover:bg-destructive hover:text-white transition-colors"
                                >
                                    <PhoneOff className="w-7 h-7" />
                                </motion.button>
                                <span className="text-xs font-semibold text-muted-foreground">{t('decline')}</span>
                            </div>

                            <div className="flex flex-col items-center gap-2">
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={onAccept}
                                    className="w-20 h-20 rounded-full bg-green-500 text-white flex items-center justify-center shadow-lg shadow-green-500/30 hover:bg-green-600 transition-colors relative"
                                >
                                    <div className="absolute inset-0 rounded-full animate-ping bg-green-500/50" />
                                    <Phone className="w-8 h-8 relative z-10" />
                                </motion.button>
                                <span className="text-xs font-bold text-green-500 uppercase tracking-wide">{t('accept')}</span>
                            </div>
                        </div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-center justify-center"
                        >
                            <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
                        </motion.div>
                    )}
                </div>
            </motion.div>
        </div>
    )
}
