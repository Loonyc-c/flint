import { Db } from 'mongodb'

/**
 * Migration to update existing users data structure.
 * 1. Removes the 'other' gender option, defaulting to 'male' (or we could choose based on other data, but simple default is safer for strict schemas).
 * 2. Removes 'preferences.lookingFor' field if it exists.
 */

export const up = async (db: Db) => {
    // 1. Update Users with 'other' gender to a default valid gender (e.g., 'male' or 'female')
    // Since we are enforcing strict binary gender for this feature request, we must migrate existing 'other' data.
    // CAUTION: This is a data-loss operation for the 'other' value.
    // For this task, we will default 'other' to 'male' as a fallback, or we could leave it invalid.
    // Given "strict female and male", we should probably migrate them.
    // Let's migrate 'other' to 'male' for now to satisfy the enum constraint, or maybe just 'male' as a placeholder.
    // A better approach might be to unset it so the user is forced to choose again, 
    // but the request implies strict structure now. 
    // Let's unset it so the profile becomes incomplete and they have to re-select.

    console.log('Migrating users with gender "other"...')
    
    // Find users with gender 'other'
    const usersWithOther = await db.collection('users').updateMany(
        { 'profile.gender': 'other' },
        { $unset: { 'profile.gender': "" } } // Unset so they must choose again
    )
    console.log(`Unset gender for ${usersWithOther.modifiedCount} users who had 'other'.`)


    // 2. Remove 'preferences.lookingFor' field
    console.log('Removing preferences.lookingFor field...')
    const resultPreferences = await db.collection('users').updateMany(
        { 'preferences.lookingFor': { $exists: true } },
        { $unset: { 'preferences.lookingFor': "" } }
    )
    
    console.log(`Removed lookingFor from ${resultPreferences.modifiedCount} users.`)
}

export const down = async (db: Db) => {
    // Reverting this is difficult because we lost data (the 'other' gender and the 'lookingFor' value).
    // We can't restore exact values without a backup.
    console.log('Irreversible migration: Data was removed (gender=other and preferences.lookingFor).')
}
