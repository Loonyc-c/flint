import { LOOKING_FOR, USER_GENDER, UserPreferences } from '@shared/types'

export interface QueueEntry {
  userId: string
  gender: USER_GENDER
  age: number
  preferences: UserPreferences
  joinedAt: Date
}

class LiveCallQueueService {
  private queue: Map<string, QueueEntry> = new Map()

  /**
   * Add a user to the queue and try to find a match
   */
  public joinQueue(entry: QueueEntry): QueueEntry | null {
    // Remove if already in queue to avoid duplicates or update info
    this.queue.delete(entry.userId)

    // Try to find a match
    for (const [id, potentialMatch] of this.queue.entries()) {
      if (this.isMatch(entry, potentialMatch)) {
        this.queue.delete(id)
        return potentialMatch
      }
    }

    // No match found, add to queue
    this.queue.set(entry.userId, entry)
    return null
  }

  /**
   * Remove a user from the queue
   */
  public leaveQueue(userId: string): void {
    this.queue.delete(userId)
  }

  /**
   * Check if two users match each other's preferences
   * TODO: PERFORMANCE - This loop is O(N). For 1000+ users, consider 
   * indexing by gender/preference or using a dedicated matchmaking service.
   */
  private isMatch(a: QueueEntry, b: QueueEntry): boolean {
    // Check gender preferences
    if (!this.checkGenderPreference(a, b) || !this.checkGenderPreference(b, a)) {
      return false
    }

    // Check age preferences
    if (!this.checkAgePreference(a, b) || !this.checkAgePreference(b, a)) {
      return false
    }

    return true
  }

  private checkGenderPreference(user: QueueEntry, target: QueueEntry): boolean {
    const lookingFor = user.preferences.lookingFor
    if (lookingFor === LOOKING_FOR.ALL) return true
    
    // LOOKING_FOR enum values match USER_GENDER string values
    return lookingFor as unknown as USER_GENDER === target.gender
  }

  private checkAgePreference(user: QueueEntry, target: QueueEntry): boolean {
    // As per match.service.ts, ageRange is treated as max age
    // We also assume a minimum age of 18
    const maxAge = user.preferences.ageRange
    return target.age >= 18 && target.age <= maxAge
  }

  public getQueueSize(): number {
    return this.queue.size
  }
}

export const liveCallQueueService = new LiveCallQueueService()
