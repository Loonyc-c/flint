'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, ChevronRight, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/routing'
import { Button } from '@/components/ui/button'
import { type MissingField } from '@shared/lib'

interface IncompleteProfileModalProps {
    isOpen: boolean
    onClose: () => void
    score: number
    missingFields: MissingField[]
}

export const IncompleteProfileModal = ({
    isOpen,
    onClose,
    score,
    missingFields
}: IncompleteProfileModalProps) => {
    const t = useTranslations('home.findMatch.gate')
    const router = useRouter()

    const handleGoToProfile = () => {
        onClose()
        router.push('/profile')
    }

    // MissingField already has a label from the backend/shared calculator
    const formatFieldName = (field: MissingField) => {
        return field.label
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-md bg-white dark:bg-neutral-900 rounded-[2.5rem] overflow-hidden shadow-2xl border border-neutral-100 dark:border-neutral-800"
                    >
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-6 right-6 p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                        >
                            <X className="w-5 h-5 text-neutral-400" />
                        </button>

                        <div className="p-8 pb-10">
                            {/* Icon/Header */}
                            <div className="flex flex-col items-center text-center space-y-4 mb-8">
                                <div className="w-20 h-20 bg-amber-50 dark:bg-amber-900/20 rounded-full flex items-center justify-center">
                                    <AlertCircle className="w-10 h-10 text-amber-500" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-neutral-900 dark:text-white mb-2 leading-tight">
                                        {t('title')}
                                    </h2>
                                    <p className="text-neutral-500 dark:text-neutral-400 text-sm px-4">
                                        {t('subtitle')}
                                    </p>
                                </div>
                            </div>

                            {/* Score Indicator */}
                            <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-3xl p-6 mb-8">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-sm font-bold text-neutral-600 dark:text-neutral-400">
                                        {t('score', { score })}
                                    </span>
                                    <span className="text-xs font-black text-brand tracking-widest uppercase">
                                        Target: 80%
                                    </span>
                                </div>
                                <div className="h-3 w-full bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${score}%` }}
                                        className="h-full bg-brand"
                                    />
                                </div>
                            </div>

                            {/* Missing Fields List */}
                            <div className="space-y-4 mb-10 text-left">
                                <h3 className="text-xs font-black text-neutral-400 dark:text-neutral-500 tracking-widest uppercase px-1">
                                    {t('missingTitle')}
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {missingFields.map((field) => (
                                        <div
                                            key={field.key}
                                            className="flex items-center gap-2 p-3 bg-neutral-50 dark:bg-neutral-800/30 rounded-2xl border border-neutral-100 dark:border-neutral-800/50"
                                        >
                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                                            <span className="text-sm font-bold text-neutral-700 dark:text-neutral-300">
                                                {formatFieldName(field)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Action Button */}
                            <Button
                                onClick={handleGoToProfile}
                                className="w-full h-16 bg-brand hover:bg-brand-300 text-white rounded-2xl font-black tracking-widest transition-all active:scale-[0.98] shadow-xl shadow-brand/20 group"
                            >
                                {t('button')}
                                <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
