'use client'

import { type UseFormRegister, type FieldErrors } from 'react-hook-form'
import { type ProfileCreationFormData } from '@shared/validations'
import { FormInput } from '@/components/ui/form-input'
import { Label } from '@/components/ui/label'
import { LabelInputContainer } from '@/utils'
import { useTranslations } from 'next-intl'

// =============================================================================
// Types
// =============================================================================

interface BasicInfoProps {
  register: UseFormRegister<ProfileCreationFormData>
  errors: FieldErrors<ProfileCreationFormData>
}

// =============================================================================
// Components
// =============================================================================

/**
 * Basic info form section containing nickname, age, and gender fields.
 */
export const BasicInfoSection = ({ register, errors }: BasicInfoProps) => {
  const t = useTranslations('profile.info')

  return (
    <section className="p-6 border shadow-sm bg-card rounded-3xl border-border space-y-6">
      <FormInput
        label={t('nicknameLabel')}
        id="nickName"
        placeholder={t('nicknamePlaceholder')}
        error={errors.nickName}
        {...register('nickName')}
      />
      <div className="grid grid-cols-2 gap-6">
        <FormInput
          label={t('ageLabel')}
          id="age"
          type="number"
          error={errors.age}
          {...register('age', { valueAsNumber: true })}
        />
        <LabelInputContainer>
          <Label htmlFor="gender">{t('genderLabel')}</Label>
          <select
            id="gender"
            {...register('gender')}
            className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-base md:text-sm font-medium appearance-none outline-none cursor-pointer focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] transition-[color,box-shadow] dark:bg-input/30"
          >
            <option value="male">{t('genders.male')}</option>
            <option value="female">{t('genders.female')}</option>
            <option value="other">{t('genders.other')}</option>
          </select>
        </LabelInputContainer>
      </div>
    </section>
  )
}

/**
 * Bio form section with a textarea for self-description.
 */
export const BioSection = ({ register, errors }: BasicInfoProps) => {
  const t = useTranslations('profile.info')

  return (
    <section className="p-6 border shadow-sm bg-card rounded-3xl border-border">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-sm font-bold tracking-widest uppercase text-muted-foreground">{t('aboutMe')}</h2>
      </div>
      <textarea
        {...register('bio')}
        placeholder={t('bioPlaceholder')}
        className="w-full p-4 text-lg transition-all border-none outline-none min-h-32 bg-muted rounded-2xl resize-none placeholder:text-muted-foreground focus:ring-2 focus:ring-brand/10"
      />
      {errors.bio && <p className="text-xs text-destructive mt-2 px-2">{errors.bio.message}</p>}
    </section>
  )
}
