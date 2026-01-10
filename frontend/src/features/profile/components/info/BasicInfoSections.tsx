'use client'

import { type UseFormRegister, type FieldErrors } from 'react-hook-form'
import { type ProfileCreationFormData } from '@shared/validations'
import { FormInput } from '@/components/ui/form-input'
import { Label } from '@/components/ui/label'
import { LabelInputContainer } from '@/utils'

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
export const BasicInfoSection = ({ register, errors }: BasicInfoProps) => (
  <section className="bg-white dark:bg-neutral-900 rounded-3xl p-6 shadow-sm border border-neutral-100 dark:border-neutral-800 space-y-6">
    <FormInput
      label="How others see you (Nickname)"
      id="nickName"
      placeholder="Display Name"
      error={errors.nickName}
      {...register('nickName')}
    />
    <div className="grid grid-cols-2 gap-6">
      <FormInput
        label="Your Age"
        id="age"
        type="number"
        error={errors.age}
        {...register('age', { valueAsNumber: true })}
      />
      <LabelInputContainer>
        <Label htmlFor="gender">Gender</Label>
        <select
          id="gender"
          {...register('gender')}
          className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-base md:text-sm font-medium appearance-none outline-none cursor-pointer focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] transition-[color,box-shadow] dark:bg-input/30"
        >
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
      </LabelInputContainer>
    </div>
  </section>
)

/**
 * Bio form section with a textarea for self-description.
 */
export const BioSection = ({ register, errors }: BasicInfoProps) => (
  <section className="bg-white dark:bg-neutral-900 rounded-3xl p-6 shadow-sm border border-neutral-100 dark:border-neutral-800">
    <div className="flex items-center gap-2 mb-4">
      <h2 className="font-bold text-sm uppercase tracking-widest text-neutral-500">About Me</h2>
    </div>
    <textarea
      {...register('bio')}
      placeholder="Share a bit of your story..."
      className="w-full min-h-32 bg-neutral-50 dark:bg-black rounded-2xl p-4 text-lg resize-none placeholder:text-neutral-400 outline-none border-none focus:ring-2 focus:ring-brand/10 transition-all"
    />
    {errors.bio && <p className="text-xs text-destructive mt-2 px-2">{errors.bio.message}</p>}
  </section>
)
