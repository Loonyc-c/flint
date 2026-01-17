import 'dotenv/config';
import { calculateProfileCompleteness } from '../../shared/lib';
import { Db } from 'mongodb';

const updateUsers = async (db: Db) => {
    const usersCollection = db.collection('users');
    const users = await usersCollection.find({}).toArray();

    const dryRun = process.argv.includes('--dry-run');
    console.log(`\n🚀 Starting Identity Migration...`);
    console.log(`📊 Mode: ${dryRun ? 'DRY RUN (No changes will be saved)' : 'LIVE MIGRATION'}`);
    console.log(`👥 Total users to process: ${users.length}\n`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const user of users as any[]) {
        // 1. Extract legacy root-level names
        const rootFirstName = user.firstName;
        const rootLastName = user.lastName;

        // 2. Prepare updated profile
        const currentProfile = user.profile || {};
        const updatedProfile = { ...currentProfile };
        let hasStructuralChange = false;

        if (rootFirstName && !updatedProfile.firstName) {
            updatedProfile.firstName = rootFirstName;
            hasStructuralChange = true;
        }

        if (rootLastName && !updatedProfile.lastName) {
            updatedProfile.lastName = rootLastName;
            hasStructuralChange = true;
        }

        // 3. Recalculate completeness score using the new 80% weight logic
        const { score } = calculateProfileCompleteness(updatedProfile, user.contactInfo || {});

        // 4. Determine if update is needed
        const scoreChanged = score !== user.profileCompletion;
        if (hasStructuralChange || scoreChanged) {
            console.log(`[UPDATE] User: ${user.email || user._id}`);
            if (hasStructuralChange) {
                console.log(`  - Names moved to profile: ${updatedProfile.firstName} ${updatedProfile.lastName}`);
            }
            if (scoreChanged) {
                console.log(`  - Completeness: ${user.profileCompletion || 0}% -> ${score}%`);
            }

            if (!dryRun) {
                const updateDoc: any = {
                    $set: {
                        profile: updatedProfile,
                        profileCompletion: score,
                        updatedAt: new Date(),
                    }
                };

                const unsetDoc: any = {};
                if (user.firstName !== undefined) unsetDoc.firstName = "";
                if (user.lastName !== undefined) unsetDoc.lastName = "";

                if (Object.keys(unsetDoc).length > 0) {
                    updateDoc.$unset = unsetDoc;
                }

                await usersCollection.updateOne({ _id: user._id }, updateDoc);
            }
            updatedCount++;
        } else {
            skippedCount++;
        }
    }

    console.log(`\n✅ Migration Finished!`);
    console.log(`📝 Updated/Processed: ${updatedCount}`);
    console.log(`⏩ Skipped (No change): ${skippedCount}`);

    if (dryRun) {
        console.log(`\n⚠️  This was a DRY RUN. Run without --dry-run to apply changes.`);
    }

    process.exit(0);
}

