import { Db } from 'mongodb'

/**
 * Launch Readiness Indexes
 * Optimizes authentication, discovery, and ephemeral session cleanup.
 */

export const up = async (db: Db) => {
  // 1. Users Collection
  console.log('   [1/4] Indexing Users...')
  const users = db.collection('users')

  // Unique email for auth
  await users.createIndex({ 'auth.email': 1 }, { unique: true, background: true })

  // High-performance matching: Completeness + Gender + Age
  await users.createIndex(
    { profileCompletion: -1, 'profile.gender': 1, 'profile.age': 1 },
    { background: true }
  )

  // Sparse index for Instagram verification (saves space)
  await users.createIndex(
    { 'contactInfo.instagram': 1 },
    { unique: true, sparse: true, background: true }
  )

  // 2. Matches Collection
  console.log('   [2/4] Indexing Matches...')
  const matches = db.collection('matches')

  // Find active matches for a user efficiently
  await matches.createIndex({ users: 1, stage: 1, isDeleted: 1 }, { background: true })
  await matches.createIndex({ createdAt: -1 }, { background: true })

  // 3. Interactions Collection (Swipes)
  console.log('   [3/4] Indexing Interactions...')
  const interactions = db.collection('interactions')

  // Prevent double-swipes and optimize reciprocity check
  await interactions.createIndex({ actorId: 1, targetId: 1 }, { unique: true, background: true })
  await interactions.createIndex({ targetId: 1, type: 1 }, { background: true })

  // 4. Staged Calls Collection (Ephemeral)
  console.log('   [4/4] Indexing Staged Calls & TTL...')
  const stagedCalls = db.collection('stagedCalls')

  // Rapid lookup by matchId
  await stagedCalls.createIndex({ matchId: 1, status: 1 }, { background: true })

  // TTL Index: Automatically delete stale call sessions after 1 hour (3600 seconds)
  // This is critical for preventing DB bloat during high-load launches.
  await stagedCalls.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0, background: true })
}

export const down = async (db: Db) => {
  const users = db.collection('users')
  const matches = db.collection('matches')
  const interactions = db.collection('interactions')
  const stagedCalls = db.collection('stagedCalls')

  console.log('   Reverting indexes...')

  try {
    await users.dropIndex('auth.email_1')
    await users.dropIndex('profileCompletion_-1_profile.gender_1_profile.age_1')
    await users.dropIndex('contactInfo.instagram_1')

    await matches.dropIndex('users_1_stage_1_isDeleted_1')
    await matches.dropIndex('createdAt_-1')

    await interactions.dropIndex('actorId_1_targetId_1')
    await interactions.dropIndex('targetId_1_type_1')

    await stagedCalls.dropIndex('matchId_1_status_1')
    await stagedCalls.dropIndex('expiresAt_1')
  } catch (_err) {
    console.warn('   Note: Some indexes might not have existed.')
  }
}
