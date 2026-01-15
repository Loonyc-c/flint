'use client'

import { motion } from 'framer-motion'
import { CheckCircle2, Circle, AlertTriangle, ArrowRight, Loader2 } from 'lucide-react'
import { useRouter } from '@/i18n/routing'
import { cn } from '@/lib/utils'
import { type MissingField } from '@shared/lib/profile/calculator'

interface ProfileGuidanceProps {
  score: number
  missingFields: MissingField[]
  isLoading?: boolean
  onClose?: () => void
}

export const ProfileGuidance = ({
  score,
  missingFields,
  isLoading,
  onClose,
}: ProfileGuidanceProps) => {
  const router = useRouter()

  if (isLoading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center bg-card rounded-3xl border border-border shadow-xl">
        <Loader2 className="w-10 h-10 animate-spin text-brand mb-4" />
        <p className="text-muted-foreground animate-pulse font-medium">Checking profile readiness...</p>
      </div>
    )
  }

  const isReady = score >= 80

  return (
    <div className="bg-card rounded-3xl border border-border shadow-2xl overflow-hidden max-w-md w-full mx-auto">
      {/* Header */}
      <div className="p-6 text-center bg-gradient-to-b from-brand/5 to-transparent border-b border-border/50">
        <div className="relative w-24 h-24 mx-auto mb-4">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50" cy="50" r="45"
              fill="none" stroke="currentColor" strokeWidth="8"
              className="text-muted/20"
            />
            <motion.circle
              cx="50" cy="50" r="45"
              fill="none" stroke="currentColor" strokeWidth="8"
              strokeLinecap="round"
              initial={{ strokeDasharray: "0 283" }}
              animate={{ strokeDasharray: `${(score / 100) * 283} 283` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className={cn(isReady ? "text-success" : "text-brand")}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-black text-foreground">{score}%</span>
          </div>
        </div>

        <h3 className="text-xl font-bold text-foreground mb-2">
          {isReady ? "Profile is Ready!" : "Profile Readiness"}
        </h3>
        <p className="text-sm text-muted-foreground">
          {isReady 
            ? "Your profile meets our safety standards. Happy matching!"
            : "Complete your profile to unlock Live Calls and better matches."}
        </p>
      </div>

      {/* Checklist */}
      <div className="p-6 space-y-3">
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">
          What&apos;s Missing?
        </p>
        
        {missingFields.length > 0 ? (
          <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
            {missingFields.map((field) => (
              <div key={field.key} className="flex items-center justify-between p-3 bg-muted/30 rounded-xl border border-border/50">
                <div className="flex items-center gap-3">
                  <Circle className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">{field.label}</span>
                </div>
                <span className="text-[10px] font-bold text-brand">+{field.weight}%</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-3 p-4 bg-success/10 rounded-xl border border-success/20">
            <CheckCircle2 className="w-5 h-5 text-success" />
            <span className="text-sm font-bold text-success">Everything looks great!</span>
          </div>
        )}
      </div>

      {/* Action */}
      <div className="p-6 pt-0">
        {!isReady ? (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push('/profile')}
            className="w-full bg-brand hover:bg-brand-300 text-white font-bold py-4 rounded-2xl shadow-xl shadow-brand/20 flex items-center justify-center gap-2 transition-all"
          >
            Complete My Profile
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        ) : onClose ? (
          <button
            onClick={onClose}
            className="w-full bg-muted hover:bg-muted/80 text-foreground font-bold py-4 rounded-2xl transition-all"
          >
            Continue
          </button>
        ) : null}
        
        {!isReady && (
          <div className="mt-4 flex items-start gap-2 p-3 bg-amber-500/5 rounded-xl border border-amber-500/10">
            <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
            <p className="text-[10px] text-amber-600/80 leading-tight italic">
              Safety First! We require at least 80% completeness to ensure high-quality, trusted connections for everyone.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
