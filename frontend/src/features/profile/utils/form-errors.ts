import { toast } from 'react-toastify'

export const onInvalid = (errors: unknown) => {
    console.error('=== FORM VALIDATION ERRORS ===')
    console.error(JSON.stringify(errors, null, 2))

    if (errors && typeof errors === 'object') {
        // Special handling for questions array errors
        if ('questions' in errors) {
            const questionsError = (errors as Record<string, unknown>).questions
            if (questionsError && typeof questionsError === 'object' && 'message' in questionsError) {
                toast.error(String(questionsError.message))
                return
            }
            // Check for individual question errors
            if (Array.isArray(questionsError)) {
                const questionErrors = questionsError
                    .map((qErr, idx) => {
                        if (qErr && typeof qErr === 'object') {
                            const errorFields = Object.entries(qErr)
                                .filter(([_, val]) => val && typeof val === 'object' && 'message' in val)
                                .map(([field, val]) => `${field}: ${(val as { message: string }).message}`)
                            if (errorFields.length > 0) {
                                return `Question ${idx + 1} - ${errorFields.join(', ')}`
                            }
                        }
                        return null
                    })
                    .filter(Boolean)
                if (questionErrors.length > 0) {
                    toast.error(`Question validation failed: ${questionErrors.join('; ')}`)
                    return
                }
            }
            toast.error('Please complete all 3 questions with audio recordings')
            return
        }

        const errorMessages = Object.entries(errors)
            .map(([field, err]) => {
                const errorMsg =
                    typeof err === 'object' && err !== null && 'message' in err
                        ? String(err.message)
                        : 'Invalid'
                return `${field}: ${errorMsg}`
            })
            .join(', ')
        toast.error(`Validation failed: ${errorMessages}`)
    } else {
        toast.error('Please fix the errors in your profile')
    }
}
