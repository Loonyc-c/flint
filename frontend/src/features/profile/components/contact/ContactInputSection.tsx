'use client'

import { type UseFormRegister, type FieldErrors } from 'react-hook-form'
import { type ProfileAndContactFormData } from '@/features/profile/hooks/useProfileForm' // Assuming the extended form type
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
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 flex items-center justify-center shadow-lg shadow-red-500/20">
          <Instagram className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-foreground">Instagram</h3>
          <p className="text-sm text-muted-foreground">Enter your Instagram handle</p>
        </div>
      </div>
      <FormInput
        id="instagram"
        label={t('labels.instagram')}
        placeholder={t('placeholders.instagram')}
        error={errors.instagram}
        {...register('instagram')}
      />
    </section>
  )
}