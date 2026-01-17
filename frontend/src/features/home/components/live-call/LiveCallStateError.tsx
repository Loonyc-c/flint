'use client'

import { useTranslations } from 'next-intl'
import { Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface LiveCallStateErrorProps {
    error: string | null
    onClose: () => void
}

export const LiveCallStateError = ({ error, onClose }: LiveCallStateErrorProps) => {
    const t = useTranslations('home.findMatch.liveCall')

    return (
        <div className="p-10 text-center flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
                <Phone className="w-10 h-10 text-destructive rotate-[135deg]" />
            </div>
            <h3 className="text-2xl font-bold text-destructive mb-2">{t('error')}</h3>
            <p className="text-muted-foreground mb-8 text-sm">
                {error === 'err.live_call.connection_failed'
                    ? 'Failed to connect to voice channel please check your microphone and network settings.'
                    : error || 'Something went wrong'}
            </p>
            <Button
                onClick={onClose}
                variant="outline"
                className="w-full h-12 rounded-2xl font-bold border-2"
            >
                {t('backToHome')}
            </Button>
        </div>
    )
}
