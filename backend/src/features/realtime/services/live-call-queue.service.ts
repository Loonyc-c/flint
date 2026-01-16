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
  // Track users in connecting state (userId -> partnerId)
  private connectingUsers: Map<string, string> = new Map()

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
        // Track both users as connecting
        this.connectingUsers.set(entry.userId, id)
        this.connectingUsers.set(id, entry.userId)
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
    this.connectingUsers.delete(userId)
  }

  /**
   * Get partner ID for a user in connecting state
   */
  public getPartner(userId: string): string | undefined {
    return this.connectingUsers.get(userId)
  }

  /**
   * Clear connecting state for a user
   */
  public clearConnecting(userId: string): void {
    const partnerId = this.connectingUsers.get(userId)
    this.connectingUsers.delete(userId)
    if (partnerId) {
      this.connectingUsers.delete(partnerId)
    }
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