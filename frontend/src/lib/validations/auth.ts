import { z } from 'zod'

export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Invalid email format')
  .transform(email => {
    const trimmed = email.trim().toLowerCase()
    const [localPart, domain] = trimmed.split('@')
    if (domain === 'gmail.com') {
      return `${localPart.replace(/\./g, '')}@${domain}`
    }
    return trimmed
  })

export const passwordSchema = z
  .string()
  .min(1, 'Password is required')
  .regex(
    /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/,
    'Password must meet requirements. Min 8, uppercase, number, special character'
  )

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema
})

export type LoginFormData = z.infer<typeof loginSchema>

export const nameSchema = z
  .string()
  .transform(name => {
    return name
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  })
  .pipe(z.string().min(2, 'Name too short').max(1000, 'Name too long'))

export const signupSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  email: emailSchema,
  password: passwordSchema
})

export type SignupFormData = z.infer<typeof signupSchema>

export const forgetPasswordSchema = z.object({
  email: emailSchema
})

export type ForgetPasswordFormData = z.infer<typeof forgetPasswordSchema>

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: passwordSchema
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword']
  })

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>
