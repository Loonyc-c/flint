import { type LucideIcon, CheckCircle2, Link as LinkIcon } from 'lucide-react'
import type { UseFormRegister, FieldValues } from 'react-hook-form'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'

interface ContactFieldProps {
  name: string
  label: string
  placeholder: string
  icon: LucideIcon
  verifiable?: boolean
  isVerified: boolean
  register: UseFormRegister<FieldValues>
  error?: string
  onConnect?: () => void
}

export const ContactField = ({
  name,
  label,
  placeholder,
  icon: Icon,
  verifiable,
  isVerified,
  register,
  error,
  onConnect,
}: ContactFieldProps) => {
  const t = useTranslations('profile.contact')

  return (
    <div key={name}>
      <div className="flex items-center justify-between mb-1.5">
        <label className="block text-sm font-medium text-foreground">
          {label}
        </label>
        {isVerified && (
          <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-success">
            <CheckCircle2 className="w-3 h-3" />
            {t('verifiedBadge')}
          </span>
        )}
      </div>
      <div className="relative flex gap-2">
        <div className="relative flex-1">
          <div className="absolute -translate-y-1/2 left-3 top-1/2 text-muted-foreground">
            <Icon className="w-5 h-5" />
          </div>
          <input
            {...register(name)}
            type="text"
            readOnly={isVerified}
            placeholder={placeholder}
            className={cn(
              'w-full pl-11 pr-4 py-3 rounded-xl border bg-background',
              'text-foreground placeholder:text-muted-foreground',
              'focus:ring-2 focus:ring-brand/50 focus:border-brand outline-none transition-all',
              isVerified && 'bg-muted/50 border-success/30 text-muted-foreground',
              error ? 'border-destructive' : 'border-border'
            )}
          />
        </div>
        {verifiable && !isVerified && (
          <button
            type="button"
            onClick={onConnect}
            className="flex items-center gap-2 px-4 py-3 font-medium transition-all border rounded-xl bg-secondary hover:bg-secondary/80 border-border text-foreground text-sm"
          >
            <LinkIcon className="w-4 h-4" />
            {t('connect')}
          </button>
        )}
      </div>
      {error && (
        <p className="mt-1 text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
