import { Db, UpdateFilter } from 'mongodb';

const up = async (db: Db) => {
    try {
        const usersCollection = db.collection('users');

        // Find users with ANY legacy data or needing verification of structure
        const users = await usersCollection.find({}).toArray();

        console.log(`Analyzing ${users.length} users for migration.`);

        let migratedCount = 0;
        let skippedCount = 0;

        for (const user of users) {
            // Safely access nested property with optional chaining
            const userName = user.profile?.contactInfo?.instagram;

            // Skip if no instagram username exists
            if (!userName) {
                skippedCount++;
                continue;
            }

            const updateDoc: UpdateFilter<any> = {
                $set: {
                    'profile.contactInfo.instagram.userName': userName,
                    'profile.contactInfo.instagram.isVerified': false,
                    updatedAt: new Date()
                },
                $unset: {
                    'contactInfo': "",
                    'profile.instagram': "",
                    'profile.verifiedPlatforms': ""
                }
            };

            await usersCollection.updateOne({ _id: user._id }, updateDoc);
            migratedCount++;
        }

        console.log(`Migration v3 completed successfully.`);
        console.log(`Migrated: ${migratedCount}, Skipped: ${skippedCount}`);
    } catch (error) {
        console.error('Migration failed:', error);
        throw error; // Re-throw to indicate migration failure
    }
}

export { up };