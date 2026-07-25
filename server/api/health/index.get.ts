import { defineApiHandler } from '../../utils/defineApiHandler'
import { useDatabase } from '../../database/client'

export default defineApiHandler(() => {
  useDatabase()

  return {
    status: 'ok' as const,
    service: 'taskflow',
    timestamp: new Date().toISOString()
  }
})
