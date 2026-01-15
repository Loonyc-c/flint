export type UserBusyStatus = 'available' | 'queueing' | 'connecting' | 'in-call'

class BusyStateService {
  private busyUsers = new Map<string, UserBusyStatus>()

  public setUserStatus(userId: string, status: UserBusyStatus) {
    const currentStatus = this.getUserStatus(userId)
    if (currentStatus === status) return

    if (status === 'available') {
      this.busyUsers.delete(userId)
    } else {
      this.busyUsers.set(userId, status)
    }
    
    console.log(`[BusyState] User ${userId} status changed: ${currentStatus} -> ${status}`)
    
    // REMOVED: Global broadcast is a performance bottleneck for 1000+ users
    // if (this.io) {
    //   this.io.emit('user-busy-state-changed', { userId, status })
    // }
  }

  public getUserStatus(userId: string): UserBusyStatus {
    return this.busyUsers.get(userId) || 'available'
  }

  public isUserBusy(userId: string): boolean {
    const status = this.getUserStatus(userId)
    return status !== 'available'
  }

  public clearUserStatus(userId: string) {
    this.setUserStatus(userId, 'available')
  }

  public getAllBusyUsers() {
    return Object.fromEntries(this.busyUsers)
  }
}

export const busyStateService = new BusyStateService()
