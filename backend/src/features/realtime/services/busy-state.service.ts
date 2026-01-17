export type UserBusyStatus = 'available' | 'queueing' | 'connecting' | 'in-call'

/**
 * Service to manage user busy states with optimistic locking
 * Prevents race conditions by using version numbers for atomic state transitions
 */
class BusyStateService {
  private busyUsers = new Map<string, { status: UserBusyStatus; version: number; timestamp: number }>()

  /**
   * Get the current status of a user
   */
  public getUserStatus(userId: string): UserBusyStatus {
    return this.busyUsers.get(userId)?.status || 'available'
  }

  /**
   * Get the current version of a user's busy state
   */
  public getUserVersion(userId: string): number {
    return this.busyUsers.get(userId)?.version || 0
  }

  /**
   * Check if a user can start a call (more granular than isUserBusy)
   */
  public canUserStartCall(userId: string): { allowed: boolean; reason?: string } {
    const status = this.getUserStatus(userId)
    if (status !== 'available') {
      return { allowed: false, reason: `User is ${status}` }
    }
    return { allowed: true }
  }

  /**
   * Check if a user is busy (simple boolean check)
   */
  public isUserBusy(userId: string): boolean {
    const status = this.getUserStatus(userId)
    return status !== 'available'
  }

  /**
   * Atomically set user status with optimistic locking
   * Returns success status and current version
   */
  public trySetUserStatus(
    userId: string,
    newStatus: UserBusyStatus,
    expectedVersion?: number
  ): { success: boolean; currentVersion: number; reason?: string } {
    const current = this.busyUsers.get(userId)
    const currentVersion = current?.version || 0
    const currentStatus = current?.status || 'available'

    // If expectedVersion provided, verify it matches (optimistic lock)
    if (expectedVersion !== undefined && currentVersion !== expectedVersion) {
      console.warn(
        `[BusyState] Version mismatch for ${userId}: expected ${expectedVersion}, got ${currentVersion}`
      )
      return {
        success: false,
        currentVersion,
        reason: 'Version conflict - state changed by another operation'
      }
    }

    // Validate state transition
    if (!this.isValidTransition(currentStatus, newStatus)) {
      console.warn(
        `[BusyState] Invalid transition for ${userId}: ${currentStatus} -> ${newStatus}`
      )
      return {
        success: false,
        currentVersion,
        reason: `Invalid transition from ${currentStatus} to ${newStatus}`
      }
    }

    // Perform atomic update
    const newVersion = currentVersion + 1
    if (newStatus === 'available') {
      this.busyUsers.delete(userId)
    } else {
      this.busyUsers.set(userId, {
        status: newStatus,
        version: newVersion,
        timestamp: Date.now()
      })
    }

    console.log(
      `[BusyState] User ${userId} status changed: ${currentStatus} -> ${newStatus} (v${newVersion})`
    )
    return { success: true, currentVersion: newVersion }
  }

  /**
   * Legacy method for backward compatibility (non-atomic)
   * @deprecated Use trySetUserStatus for atomic operations
   */
  public setUserStatus(userId: string, status: UserBusyStatus): void {
    const result = this.trySetUserStatus(userId, status)
    if (!result.success) {
      console.error(`[BusyState] Failed to set status for ${userId}: ${result.reason}`)
    }
  }

  /**
   * Clear user status (set to available)
   */
  public clearUserStatus(userId: string): void {
    this.setUserStatus(userId, 'available')
  }

  /**
   * Validate if a state transition is allowed
   */
  private isValidTransition(from: UserBusyStatus, to: UserBusyStatus): boolean {
    // Define valid state transitions
    const validTransitions: Record<UserBusyStatus, UserBusyStatus[]> = {
      available: ['queueing', 'connecting', 'in-call'], // Can start any call flow
      queueing: ['available', 'in-call', 'connecting'], // Can leave queue or get matched
      connecting: ['available', 'in-call'], // Can cancel or connect
      'in-call': ['available'] // Can only end call
    }

    // Same state is always valid (idempotent)
    if (from === to) return true

    return validTransitions[from]?.includes(to) || false
  }

  /**
   * Clean up stale busy states (run periodically)
   * Removes states older than MAX_AGE
   */
  public cleanupStaleStates(): number {
    const now = Date.now()
    const MAX_AGE = 5 * 60 * 1000 // 5 minutes
    let cleaned = 0

    for (const [userId, data] of this.busyUsers.entries()) {
      if (now - data.timestamp > MAX_AGE) {
        console.warn(`[BusyState] Clearing stale state for ${userId} (${data.status})`)
        this.busyUsers.delete(userId)
        cleaned++
      }
    }

    if (cleaned > 0) {
      console.log(`[BusyState] Cleaned up ${cleaned} stale states`)
    }

    return cleaned
  }

  /**
   * Get all busy users (for socket sync)
   */
  public getAllBusyUsers(): Record<string, UserBusyStatus> {
    const result: Record<string, UserBusyStatus> = {}
    for (const [userId, data] of this.busyUsers.entries()) {
      result[userId] = data.status
    }
    return result
  }
}

export const busyStateService = new BusyStateService()

// Run cleanup every 60 seconds
setInterval(() => {
  busyStateService.cleanupStaleStates()
}, 60 * 1000)
