import { innovationTracker } from './github-innovation-tracker.js'

// Schedule configuration
const SCAN_INTERVAL = 6 * 60 * 60 * 1000 // 6 hours
const INITIAL_DELAY = 5 * 60 * 1000 // 5 minutes after startup

export class InnovationCronJob {
  private intervalId: Timer | null = null
  private isRunning = false

  async start() {
    console.log('Starting GitHub Innovation Tracker cron job...')
    
    // Run initial scan after a short delay
    setTimeout(async () => {
      await this.runScan()
    }, INITIAL_DELAY)

    // Schedule periodic scans
    this.intervalId = setInterval(async () => {
      await this.runScan()
    }, SCAN_INTERVAL)

    console.log(`Innovation tracker scheduled to run every ${SCAN_INTERVAL / 1000 / 60 / 60} hours`)
  }

  async stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
      console.log('Innovation tracker cron job stopped')
    }
  }

  private async runScan() {
    if (this.isRunning) {
      console.log('Innovation scan already in progress, skipping...')
      return
    }

    this.isRunning = true
    const startTime = Date.now()

    try {
      console.log(`[${new Date().toISOString()}] Starting innovation scan...`)
      await innovationTracker.runInnovationScan()
      
      const duration = (Date.now() - startTime) / 1000
      console.log(`[${new Date().toISOString()}] Innovation scan completed in ${duration.toFixed(2)}s`)
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Innovation scan failed:`, error)
    } finally {
      this.isRunning = false
    }
  }

  // Manual trigger for testing
  async triggerScan() {
    await this.runScan()
  }
}

// Export singleton instance
export const innovationCron = new InnovationCronJob()

// Auto-start if running as main module
if (import.meta.main) {
  innovationCron.start()
}