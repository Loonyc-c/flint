'use client'

import { type UseFormRegister, type FieldErrors } from 'react-hook-form'
import { type ProfileAndContactFormData } from '@/features/profile/hooks/useProfileForm'
import { FormInput } from '@/components/ui/form-input'
import { Instagram } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface ContactInputSectionProps {
  register: UseFormRegister<ProfileAndContactFormData>
  errors: FieldErrors<ProfileAndContactFormData>
}

export const ContactInputSection = ({ register, errors }: ContactInputSectionProps) => {
  const t = useTranslations('profile.contact')

  return (
    <section className="p-6 border shadow-sm bg-card rounded-3xl border-border space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-instagram-gradient flex items-center justify-center shadow-lg shadow-destructive/20">
          <Instagram className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-foreground">{t('labels.instagram')}</h3>
          <p className="text-sm text-muted-foreground">{t('instagramDesc')}</p>
        </div>
      </div>
      <FormInput
        id="instagram"
        label={
          <span className="flex items-center gap-1">
            {t('labels.instagram')} <span className="text-destructive">*</span>
          </span>
        }
        placeholder={t('placeholders.instagram')}
        error={errors.instagram}
        {...register('instagram')}
      />
    </section>
  )
}