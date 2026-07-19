// server/api/models.ts
import { AVAILABLE_MODELS } from '~~/src/models'

export default defineEventHandler(async () => {
  let isLocalComputerOnline = false

  try {
    // Ping local Ollama to check if machine is online and responding
    await $fetch('http://127.0.0.1:11434/', { method: 'GET', timeout: 1000 })
    isLocalComputerOnline = true
  } catch {
    isLocalComputerOnline = false
  }

  // Filter out local models if the hardware is off/unreachable
  const filteredModels = AVAILABLE_MODELS.filter(model => {
    if (model.provider === 'local') {
      return isLocalComputerOnline
    }
    return true // Groq models are always available from Vercel
  })

  return {
    localComputerStatus: isLocalComputerOnline ? 'ONLINE' : 'OFFLINE',
    models: filteredModels
  }
})