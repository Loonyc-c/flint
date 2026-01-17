'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Video, Mic, AlertCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useHardwareGate } from '../hooks/useHardwareGate'
import type { DeviceCheckResult } from '../types/call-fsm'

// =============================================================================
// Types
// =============================================================================

interface DeviceCheckScreenProps {
    requireVideo?: boolean
    requireAudio?: boolean
    onResult: (result: DeviceCheckResult) => void
    onCancel: () => void
}

// =============================================================================
// Component
// =============================================================================

export const DeviceCheckScreen = ({
    requireVideo = true,
    requireAudio = true,
    onResult,
    onCancel
}: DeviceCheckScreenProps) => {
    const t = useTranslations('call.deviceCheck')
    const { checking, result, checkDevices } = useHardwareGate({ requireVideo, requireAudio })

    // Loop Protection: Ensure we only check once per mount
    const hasChecked = useRef(false)

    // Auto-check on mount
    useEffect(() => {
        if (!hasChecked.current) {
            hasChecked.current = true
            checkDevices()
        }
    }, [checkDevices])

    // Report result to parent ONLY if successful. 
    // Failures stay on this screen to prevent loops and show error/retry UI.
    useEffect(() => {
        if (result?.ready) {
            onResult(result)
        }
    }, [result, onResult])

    const getErrorMessage = () => {
        if (!result?.error) return t('defaultError')
        return t(`errors.${result.error}`)
    }

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="max-w-md w-full bg-card rounded-3xl p-8 text-center"
            >
                {checking ? (
                    <>
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-brand/20 flex items-center justify-center">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                            >
                                {requireVideo ? (
                                    <Video className="w-10 h-10 text-brand" />
                                ) : (
                                    <Mic className="w-10 h-10 text-brand" />
                                )}
                            </motion.div>
                        </div>
                        <h3 className="text-xl font-bold text-foreground mb-2">{t('checking')}</h3>
                        <p className="text-muted-foreground">{t('pleaseAllow')}</p>
                    </>
                ) : result?.ready ? (
                    <>
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 200 }}
                            >
                                <Video className="w-10 h-10 text-green-500" />
                            </motion.div>
                        </div>
                        <h3 className="text-xl font-bold text-foreground mb-2">{t('ready')}</h3>
                        <p className="text-muted-foreground">{t('connecting')}</p>
                    </>
                ) : (
                    <>
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-destructive/20 flex items-center justify-center">
                            <AlertCircle className="w-10 h-10 text-destructive" />
                        </div>
                        <h3 className="text-xl font-bold text-foreground mb-2">{t('permissionDenied')}</h3>
                        <p className="text-muted-foreground mb-6">{getErrorMessage()}</p>
                        <div className="flex flex-col gap-3">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={checkDevices}
                                className="w-full px-6 py-3 bg-brand rounded-full text-white font-bold"
                            >
                                {t('retry')}
                            </motion.button>
                            <button
                                onClick={onCancel}
                                className="w-full px-6 py-3 bg-secondary rounded-full text-foreground font-medium hover:bg-secondary/80 transition-colors"
                            >
                                {t('cancel')}
                            </button>
                        </div>
                    </>
                )}
            </motion.div>
        </div>
    )
}
