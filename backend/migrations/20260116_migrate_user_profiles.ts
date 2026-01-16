import { Db } from 'mongodb'

/**
 * User Profile Migration (2026-01-16)
 * 
 * Objectives:
 * 1. Standardize 'photo' field (singular) and deprecate 'photos' (plural).
 * 2. Clean up 'contactInfo' (remove 'manualContactInfo', ensure 'verifiedPlatforms').
 * 3. Recalculate 'profileCompletion' scores based on the new strict criteria.
 */

// Inline calculation logic to avoid dependency issues during migration
const calculateScore = (profile: any, contactInfo: any): number => {
  let score = 0

  // 1. Basic Info (20% total: 10% Age, 10% Gender)
  if (profile?.age) score += 10
  if (profile?.gender) score += 10

  // 2. Profile Image (15%)
  if (profile?.photo) score += 15

  // 3. Contact Info (20%) - Instagram Verified only
  const hasInstagram = contactInfo?.verifiedPlatforms?.includes('instagram') || 
                       contactInfo?.instagram // Fallback check if verifiedPlatforms missing but field exists
  if (hasInstagram) score += 20

  // 4. Bio/Introduction (15%)
  if (profile?.bio && profile.bio.trim().length >= 10) score += 15

  // 5. Interests (15% - at least 3)
  if (profile?.interests?.length >= 3) score += 15

  // 6. Questions/Audio Answers (15% - 5% each)
  const answeredQuestions = profile?.questions?.filter((q: any) => q.questionId && q.audioUrl).length || 0
  score += Math.min(answeredQuestions, 3) * 5

  return Math.min(score, 100)
}

export const up = async (db: Db) => {
  console.log('   [Profile Migration] Starting...')
  const usersCollection = db.collection('users')
  
  // Fetch all users to process logic in-memory (1600 is small enough)
  const users = await usersCollection.find({}).toArray()
  console.log(`   [Profile Migration] Processing ${users.length} users...`)

  let updatedCount = 0
  
  // Process in batches for safety
  const batchSize = 100
  for (let i = 0; i < users.length; i += batchSize) {
    const batch = users.slice(i, i + batchSize)
    const operations = batch.map(user => {
      const profile = user.profile || {}
      const contactInfo = user.contactInfo || {}

      // 1. Migrate Photo
      let finalPhoto = profile.photo
      if (!finalPhoto && profile.photos && profile.photos.length > 0) {
        finalPhoto = profile.photos[0]
      }

      // 2. Standardize Contact Info
      let verifiedPlatforms = contactInfo.verifiedPlatforms || []
      // If they had instagram field but not in verified list, we might assume it was verified or just leave it.
      // Better to trust existing 'verifiedPlatforms' if it exists, or init it.
      // If we want to be generous: if contactInfo.instagram is present, add to verified? 
      // No, let's stick to the existing data truth.

      const newProfile = { ...profile, photo: finalPhoto }
      const newContactInfo = { ...contactInfo, verifiedPlatforms }

      // 3. Recalculate Score
      const newScore = calculateScore(newProfile, newContactInfo)

      return {
        updateOne: {
          filter: { _id: user._id },
          update: {
            $set: {
              'profile.photo': finalPhoto,
              'contactInfo.verifiedPlatforms': verifiedPlatforms,
              profileCompletion: newScore
            },
            $unset: {
              'profile.photos': "",
              'contactInfo.manualContactInfo': "",
              'contactInfo.phone': "",
              'contactInfo.telegram': "",
              'contactInfo.snapchat': "",
              'contactInfo.whatsapp': "",
              'contactInfo.wechat': "",
              'contactInfo.facebook': "",
              'contactInfo.twitter': "",
              'contactInfo.linkedin': "",
              'contactInfo.other': ""
            }
          }
        }
      }
    })

    if (operations.length > 0) {
      await usersCollection.bulkWrite(operations)
      updatedCount += operations.length
    }
  }

  console.log(`   [Profile Migration] Successfully updated ${updatedCount} users.`)
}

export const down = async (db: Db) => {
  console.warn('   [Profile Migration] Down migration is not fully supported (data loss possible).')
  console.log('   [Profile Migration] Resetting profileCompletion to 0 to force recalculation logic on next update.')
  
  const usersCollection = db.collection('users')
  await usersCollection.updateMany({}, { $set: { profileCompletion: 0 } })
}
