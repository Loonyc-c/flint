import { z } from 'zod'
import {
    profileUpdateSchema,
    contactInfoSchema
} from '@/shared-types/validations'
import { QUESTION_POOL } from '@/shared-types/types'

// Relaxed question schema for form state (allows local recordings without uploaded URLs)
export const questionAnswerFormSchema = z.object({
    questionId: z
        .string()
        .min(1, 'Question ID is required')
        .refine(id => !id || QUESTION_POOL.some(q => q.id === id), {
            message: 'Question ID not found in the QUESTION_POOL'
        }),
    audioUrl: z.string().optional(),
    uploadId: z.string().optional(),
    audioFile: z.union([z.instanceof(Blob), z.string()]).optional()
})

// Combine schemas for the form - relax questions validation for form state
export const formSchema = profileUpdateSchema
    .omit({ questions: true })
    .extend({
        voiceIntro: z.string().optional(), // Make optional in form because it might be in voiceIntroFile
        instagram: contactInfoSchema.shape.instagram,
        voiceIntroFile: z.union([z.instanceof(Blob), z.string()]).optional(),
        questions: z.array(questionAnswerFormSchema).length(3, 'Please complete all 3 questions')
    })
    .refine(data => data.voiceIntro || data.voiceIntroFile, {
        message: 'Please record a voice introduction',
        path: ['voiceIntro']
    })

export type ProfileAndContactFormData = z.infer<typeof formSchema>
