import { Db } from 'mongodb'

/**
 * Migrate Instagram data from contactInfo to profile
 */
export const up = async (db: Db) => {
    const users = db.collection('users')

    console.log('   Starting Instagram migration...')

    // Find all users who have instagram in contactInfo
    const cursor = users.find({ 'contactInfo.instagram': { $exists: true, $ne: '' } })

    let migratedCount = 0

    while (await cursor.hasNext()) {
        const user = await cursor.next()
        if (!user) continue

        const instagram = user.contactInfo?.instagram
        const verifiedPlatforms = user.contactInfo?.verifiedPlatforms || []

        // Check if instagram is already in profile to avoid overwriting newer data if any
        // but in this case, we are moving it.

        await users.updateOne(
            { _id: user._id },
            {
                $set: {
                    'profile.instagram': instagram,
                    'profile.verifiedPlatforms': verifiedPlatforms
                }
            }
        )
        migratedCount++
    }

    console.log(`   ✅ Migrated ${migratedCount} users.`)
}

export const down = async (db: Db) => {
    const users = db.collection('users')

    console.log('   Reverting Instagram migration...')

    const cursor = users.find({ 'profile.instagram': { $exists: true, $ne: '' } })

    let revertedCount = 0

    while (await cursor.hasNext()) {
        const user = await cursor.next()
        if (!user) continue

        const instagram = user.profile?.instagram
        const verifiedPlatforms = user.profile?.verifiedPlatforms || []

        await users.updateOne(
            { _id: user._id },
            {
                $set: {
                    'contactInfo.instagram': instagram,
                    'contactInfo.verifiedPlatforms': verifiedPlatforms
                },
                $unset: {
                    'profile.instagram': '',
                    'profile.verifiedPlatforms': ''
                }
            }
        )
        revertedCount++
    }

    console.log(`   ✅ Reverted ${revertedCount} users.`)
}
