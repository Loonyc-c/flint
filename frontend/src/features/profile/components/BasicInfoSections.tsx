'use client'

import { FormInput } from '@/components/ui/form-input'
import { UseFormRegister, FieldErrors } from 'react-hook-form'
import { ProfileCreationFormData } from '@shared/validations'

interface BasicInfoProps {
  register: UseFormRegister<ProfileCreationFormData>
  errors: FieldErrors<ProfileCreationFormData>
}

export const BasicInfoSection = ({ register, errors }: BasicInfoProps) => {
  return (
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
        <div className="flex flex-col space-y-2">
          <label className="text-sm font-bold text-neutral-500 ml-1">Gender</label>
          <select
            {...register('gender')}
            className="h-10 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-transparent px-4 font-medium appearance-none outline-none focus:ring-2 focus:ring-brand/20 transition-all"
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>
    </section>
  )
}

export const BioSection = ({ register, errors }: BasicInfoProps) => {
  return (
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
}
