'use client';

import { type UseFormRegister, type FieldErrors } from 'react-hook-form';
import { type ProfileCreationFormData } from '@shared/validations';
import { FormInput } from '@/components/ui/form-input';
import { useTranslations } from 'next-intl';

interface ContactSectionProps {
  register: UseFormRegister<ProfileCreationFormData>;
  errors: FieldErrors<ProfileCreationFormData>;
}

export const ContactSection = ({ register, errors }: ContactSectionProps) => {
  const t = useTranslations('profile.contact');

  return (
    <section className="p-6 border shadow-sm bg-card rounded-3xl border-border space-y-6">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-bold tracking-widest uppercase text-muted-foreground">{t('title')}</h2>
      </div>
      <p className="text-sm text-muted-foreground -mt-4">{t('subtitle')}</p>
      
      <FormInput
        label={t('labels.instagram')}
        id="contact.instagram"
        placeholder={t('placeholders.instagram')}
        error={errors.contact?.instagram}
        {...register('contact.instagram')}
      />
    </section>
  );
};
