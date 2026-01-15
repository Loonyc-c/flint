/**
 * Circuit Breaker to protect the process from crashing under high load/memory pressure.
 */
class CircuitBreaker {
  private isMaintenanceMode = false
  private memoryThreshold = 1.5 * 1024 * 1024 * 1024 // 1.5GB
  private eventLoopThreshold = 200 // 200ms lag
  private lastLag = 0
  
  constructor() {
    this.startMonitoring()
  }

  private startMonitoring() {
    let lastTime = Date.now()
    
    setInterval(() => {
      const now = Date.now()
      this.lastLag = now - lastTime - 1000 // 1000ms is the interval
      lastTime = now

      const memoryUsage = process.memoryUsage().heapUsed
      
      if (memoryUsage > this.memoryThreshold || this.lastLag > this.eventLoopThreshold) {
        if (!this.isMaintenanceMode) {
          console.error(`🚨 [CircuitBreaker] TRIGGERED: Memory=${(memoryUsage / 1024 / 1024).toFixed(2)}MB, Lag=${this.lastLag}ms`)
          this.isMaintenanceMode = true
        }
      } else if (this.isMaintenanceMode && memoryUsage < this.memoryThreshold * 0.8 && this.lastLag < this.eventLoopThreshold * 0.5) {
        console.log('✅ [CircuitBreaker] RECOVERED: System healthy again')
        this.isMaintenanceMode = false
      }
    }, 1000)
  }

  public isOpen(): boolean {
    return this.isMaintenanceMode
  }

  public setMaintenanceMode(enabled: boolean) {
    this.isMaintenanceMode = enabled
  }

  public getStats() {
    return {
      isMaintenanceMode: this.isMaintenanceMode,
      heapUsedMB: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2),
      eventLoopLagMS: this.lastLag,
    }
  }
}

export const circuitBreaker = new CircuitBreaker()
