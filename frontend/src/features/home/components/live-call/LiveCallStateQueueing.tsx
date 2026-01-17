'use client'

import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { Phone, ShieldCheck, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { type LiveCallStatus } from '@/features/live-call/context/LiveCallContext'

interface LiveCallStateQueueingProps {
    status: LiveCallStatus
    onClose: () => void
}

export const LiveCallStateQueueing = ({ status, onClose }: LiveCallStateQueueingProps) => {
    const t = useTranslations('home.findMatch.liveCall')

    return (
        <div className="p-8 text-center flex flex-col items-center">
            <div className="relative w-24 h-24 mb-8">
                <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 bg-brand rounded-full"
                />
                <div className="relative flex items-center justify-center w-full h-full bg-brand rounded-full text-brand-foreground shadow-lg shadow-brand/20">
                    {status === 'queueing' ? (
                        <Phone className="w-10 h-10 animate-pulse" />
                    ) : (
                        <ShieldCheck className="w-10 h-10" />
                    )}
                </div>
            </div>
            <h2 className="text-2xl font-bold mb-2">
                {status === 'queueing' ? t('finding') : t('matchFound')}
            </h2>
            <p className="text-muted-foreground mb-8">
                {status === 'queueing' ? t('findingDesc') : t('connecting')}
            </p>
            <div className="flex flex-col gap-4 w-full">
                <div className="flex items-center justify-center gap-2 text-sm text-brand font-medium">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t('searching')}
                </div>
                <Button
                    variant="outline"
                    onClick={onClose}
                    className="rounded-2xl h-12 border-2"
                >
                    {t('cancel')}
                </Button>
            </div>
        </div>
    )
}
