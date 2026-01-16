import { USER_GENDER, UserPreferences } from '@shared/types'

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

  private isMatch(_a: QueueEntry, _b: QueueEntry): boolean {
    /**
     * Requirement: Live call should not use preferences or age range.
     * Random matching is used to maximize connectivity.
     */
    return true
  }

  public getQueueSize(): number {
    return this.queue.size
  }
}

export const liveCallQueueService = new LiveCallQueueService()