---
name: Fix Profile Validation Issues
overview: Debug and resolve profile form validation errors preventing submission at 85% completeness, fix schema mismatches between form state and validation schemas, and correct the completeness calculator to properly account for all fields including voiceIntro.
todos:
  - id: update-calculator
    content: Add voiceIntro field (15%) to completeness calculator and rebalance weights
    status: completed
  - id: clean-questions-data
    content: Remove audioFile field from questions before validation
    status: completed
  - id: clean-voiceintro-file
    content: Remove voiceIntroFile from profile payload before submission
    status: completed
  - id: enhance-error-logging
    content: Improve onInvalid handler with detailed field-level error messages
    status: completed
  - id: verify-fix
    content: Test complete profile submission reaches 100% and validates successfully
    status: completed
---

# Fix Profile Form Validation and Completeness Calculation

## Root Cause Analysis

After analyzing the codebase, I've identified **3 critical issues** causing the 85% completeness cap and validation failures:

### Issue 1: voiceIntro Missing from Completeness Calculator
The `voiceIntro` field is **required** in [`shared/validations/profile.validation.ts`](shared/validations/profile.validation.ts) (line 35) but is **NOT included** in the completeness score calculation in [`shared/lib/profile/calculator.ts`](shared/lib/profile/calculator.ts).

**Current score distribution:**
- Age (10%) + Gender (10%) + Photo (15%) + Instagram (20%) + Bio (15%) + Interests (15%) + Questions (15%) = **100%**
- VoiceIntro: **0%** ❌ (missing from calculator)

This explains why users can fill everything but still cap at 85% - the calculator doesn't account for voiceIntro, but the schema requires it for validation.

### Issue 2: Form State Schema Mismatch - Extra `audioFile` Field
In [`frontend/src/features/profile/hooks/useProfileForm.ts`](frontend/src/features/profile/hooks/useProfileForm.ts), the form schema extends questions with an `audioFile` field for local blob storage (lines 40, 57-60, 85). However, the backend `questionAnswerSchema` only expects `{ questionId, audioUrl, uploadId }` (lines 16-23 in profile.validation.ts).

**Problem:** During validation, if any question still has the `audioFile` field present (even as `undefined`), the strict Zod schema will reject it as an unexpected key.

### Issue 3: Weak Error Logging
The `onInvalid` handler (line 158-161 in useProfileForm.ts) only logs errors to console without exposing field-level details to the user, making debugging impossible for end-users.

## Implementation Plan

### Step 1: Add voiceIntro to Completeness Calculator
**File:** [`shared/lib/profile/calculator.ts`](shared/lib/profile/calculator.ts)

Add voiceIntro scoring (10%) and redistribute weights to maintain 100% total:

```typescript
// Updated score distribution (100% Total):
// - Basic Info (20%): Age (10%), Gender (10%)
// - Photo (10%): Main profile photo
// - Bio (10%): At least 10 characters
// - Interests (10%): At least 3 interests
// - Questions (15%): 5% per answered question (max 3)
// - Voice Intro (15%): Voice introduction recorded
// - Contact Info (20%): Instagram connected
```

Add check after line 58:
```typescript
// 7. Voice Intro (15%)
if (profile.voiceIntro && profile.voiceIntro.trim().length > 0) {
  score += 15
} else {
  missingFields.push({ key: 'voiceIntro', label: 'Voice Introduction', weight: 15 })
}
```

Adjust other field weights: Photo (15% → 10%), Bio (15% → 10%), Interests (15% → 10%)

### Step 2: Clean Questions Data Before Validation
**File:** [`frontend/src/features/profile/hooks/useProfileForm.ts`](frontend/src/features/profile/hooks/useProfileForm.ts)

In the `onManualSave` function (line 129-142), ensure the `audioFile` field is explicitly removed from questions before creating `profileToUpdate`:

```typescript
const questionsToSave = await Promise.all(data.questions.map(async (qa: any, index: number) => {
  if (qa.audioFile instanceof Blob) {
    const result = await uploadAudioToCloudinary(qa.audioFile, { folder: 'flint/profile-questions' });
    const updated = { questionId: qa.questionId, audioUrl: result.url, uploadId: result.publicId };
    // Update form state...
    return updated;
  }
  // CRITICAL: Strip audioFile to match backend schema
  return { 
    questionId: qa.questionId, 
    audioUrl: qa.audioUrl || '', 
    uploadId: qa.uploadId || '' 
  };
}));
```

Verify the final `profileToUpdate` object only contains schema-compliant fields.

### Step 3: Enhance Error Logging in onInvalid
**File:** [`frontend/src/features/profile/hooks/useProfileForm.ts`](frontend/src/features/profile/hooks/useProfileForm.ts)

Replace lines 158-161 with detailed error extraction:

```typescript
const onInvalid = (errors: unknown) => {
  console.error('=== FORM VALIDATION ERRORS ===')
  console.error(JSON.stringify(errors, null, 2))
  
  if (errors && typeof errors === 'object') {
    const errorMessages = Object.entries(errors)
      .map(([field, err]: [string, any]) => `${field}: ${err?.message || 'Invalid'}`)
      .join(', ')
    toast.error(`Validation failed: ${errorMessages}`)
  } else {
    toast.error('Please fix the errors in your profile')
  }
}
```

### Step 4: Verify Instagram Field Handling
The current implementation correctly separates `instagram` from the profile payload (line 144) and passes it separately to `saveProfileData` (line 152). No changes needed here - this is already compliant.

### Step 5: Add voiceIntroFile Cleanup
**File:** [`frontend/src/features/profile/hooks/useProfileForm.ts`](frontend/src/features/profile/hooks/useProfileForm.ts)

Ensure `voiceIntroFile` is removed from the final payload (line 145-150):

```typescript
const { instagram, voiceIntroFile, ...profilePayload } = data;
const profileToUpdate: ProfileCreationFormData = {
  ...profilePayload,
  photo: finalPhotoUrl || data.photo,
  questions: questionsToSave,
  voiceIntro: finalVoiceIntroUrl || data.voiceIntro || '',
} as ProfileCreationFormData;
```

## Validation & Testing

After implementation:
1. Fill all profile fields including voiceIntro
2. Check completeness score reaches 100%
3. Submit form and verify no validation errors
4. Check console for detailed error logs if validation fails
5. Verify backend receives only schema-compliant fields (no `audioFile`, `voiceIntroFile`, or `instagram` in profile payload)

## Files to Modify

1. [`shared/lib/profile/calculator.ts`](shared/lib/profile/calculator.ts) - Add voiceIntro scoring
2. [`frontend/src/features/profile/hooks/useProfileForm.ts`](frontend/src/features/profile/hooks/useProfileForm.ts) - Clean form data, improve error logging