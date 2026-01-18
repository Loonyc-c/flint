import { MongoClient } from 'mongodb';
import { calculateProfileCompleteness } from '../../shared/lib/profile/calculator';

async function migrate() {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/flint';
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db();
        const usersCollection = db.collection('users');

        // Find users with legacy contact data or verifiedPlatforms
        const users = await usersCollection.find({
            $or: [
                { contactInfo: { $exists: true } },
                { 'profile.instagram': { $exists: true } },
                { 'profile.verifiedPlatforms': { $exists: true } },
                { verifiedPlatforms: { $exists: true } }
            ]
        }).toArray();

        console.log(`Found ${users.length} users to migrate.`);

        for (const user of users) {
            const legacyRootContact = user.contactInfo || {};
            const legacyFlatInstagram = user.profile?.instagram;
            const legacyProfileVerifiedPlatforms = user.profile?.verifiedPlatforms;
            const legacyRootVerifiedPlatforms = user.verifiedPlatforms;

            const instagramHandle = legacyFlatInstagram || legacyRootContact.instagram;

            const updateDoc: any = {
                $unset: {
                    contactInfo: "",
                    verifiedPlatforms: "",
                    'profile.instagram': "",
                    'profile.verifiedPlatforms': ""
                }
            };

            if (instagramHandle) {
                // Prepare new structure: profile.contactInfo.instagram.userName
                const newContactInfo = {
                    instagram: {
                        userName: instagramHandle,
                        isVerified: false
                    }
                };

                const updatedProfile = {
                    ...(user.profile || {}),
                    contactInfo: newContactInfo
                };

                // Clean up legacy profile fields
                delete (updatedProfile as any).instagram;
                delete (updatedProfile as any).verifiedPlatforms;

                // Recalculate score
                const { score } = calculateProfileCompleteness(updatedProfile);

                updateDoc.$set = {
                    profile: updatedProfile,
                    profileCompletion: score
                };

                console.log(`Migrated user ${user._id}: Instagram mapped to nested structure. Score: ${score}`);
            } else {
                console.log(`Cleaned up user ${user._id} (no instagram found, just unsetting legacy fields)`);
            }

            await usersCollection.updateOne({ _id: user._id }, updateDoc);
        }

        console.log('Migration completed successfully.');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await client.close();
    }
}

migrate();
