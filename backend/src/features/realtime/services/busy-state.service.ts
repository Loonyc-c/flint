import { Server } from 'socket.io'

export type UserBusyStatus = 'available' | 'queueing' | 'connecting' | 'in-call'

class BusyStateService {
  private busyUsers = new Map<string, UserBusyStatus>()
  private io: Server | null = null

  public setIO(io: Server) {
    this.io = io
  }

  public setUserStatus(userId: string, status: UserBusyStatus) {
    const currentStatus = this.getUserStatus(userId)
    if (currentStatus === status) return

    if (status === 'available') {
      this.busyUsers.delete(userId)
    } else {
      this.busyUsers.set(userId, status)
    }
    
    console.log(`[BusyState] User ${userId} status changed: ${currentStatus} -> ${status}`)
    
    if (this.io) {
      this.io.emit('user-busy-state-changed', { userId, status })
    }
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
