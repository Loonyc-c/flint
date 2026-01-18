import { Db } from 'mongodb'

/**
 * Launch Readiness Indexes
 * Optimizes authentication, discovery, and ephemeral session cleanup.
 */

export const up = async (db: Db) => {
    // 1. Users Collection
    const users = await db.collection('users').find().toArray()

    console.log(`Calculating profile completion for ${users.length} users...`)

    let successCount = 0
    let skippedCount = 0

    for (const user of users) {
        try {
            // Skip users without a profile
            if (!user.profile) {
                skippedCount++
                continue
            }

            let score = 0

            // 1. Identity (25%)
            if (user.profile.firstName) {
                score += 5
            }

            if (user.profile.lastName) {
                score += 5
            }

            if (user.profile.nickName) {
                score += 5
            }

            if (user.profile.age) {
                score += 5
            }

            if (user.profile.gender) {
                score += 5
            }

            // 2. Photo (10%)
            if (user.profile.photo) {
                score += 10
            }

            // 3. Bio (10%)
            if (user.profile.bio && user.profile.bio.trim().length >= 10) {
                score += 10
            }

            // 4. Voice Intro (15%)
            if (user.profile.voiceIntro && user.profile.voiceIntro.trim().length > 0) {
                score += 15
            }

            // 5. Interests (10%)
            if (user.profile.interests && user.profile.interests.length >= 3) {
                score += 10
            }

            // 6. Questions (10%)
            // Check for either uploaded audio (audioUrl) OR local recording (audioFile)
            const answeredCount =
                user.profile.questions?.filter((q: any) => {
                    const hasQuestionId = !!q.questionId
                    const hasAudioUrl = !!q.audioUrl
                    const hasAudioFile = !!q.audioFile
                    return hasQuestionId && (hasAudioUrl || hasAudioFile)
                }).length || 0

            // 3.33 points per question, max 10 points
            const questionScore = Math.min(answeredCount, 3) * (10 / 3)
            score += questionScore

            // 7. Contact Info (20%) - Instagram
            const instagram = user.profile.contactInfo?.instagram?.userName
            if (instagram) {
                score += 20
            }

            // HARD PENALTY CAP SYSTEM
            // If critical fields are missing, cap score at 75%
            // This guarantees 80% is only reachable if ALL criticals are present
            const hasCriticalIdentity =
                user.profile.firstName &&
                user.profile.lastName &&
                user.profile.nickName &&
                user.profile.age &&
                user.profile.gender

            const hasCriticalContent =
                user.profile.photo &&
                user.profile.bio &&
                user.profile.bio.trim().length >= 10 &&
                user.profile.voiceIntro &&
                user.profile.voiceIntro.trim().length > 0

            const hasCriticalEngagement = answeredCount >= 3 && user.profile.interests && user.profile.interests.length >= 3

            const hasCriticalContact = !!instagram

            // If ANY of these "Gate Components" are missing, the user CANNOT pass 80%
            const isGateOpen = hasCriticalIdentity && hasCriticalContent && hasCriticalEngagement && hasCriticalContact

            const maxScore = isGateOpen ? 100 : 75

            const finalScore = Math.min(Math.round(score), maxScore)

            await db.collection('users').updateOne(
                { _id: user._id },
                { $set: { profileCompletion: finalScore } }
            )

            successCount++

            if (successCount % 100 === 0) {
                console.log(`Processed ${successCount} users...`)
            }
        } catch (err) {
            console.error(`Error processing user ${user._id}:`, err)
        }
    }

    console.log(`Migration completed. Success: ${successCount}, Skipped: ${skippedCount}`)
}