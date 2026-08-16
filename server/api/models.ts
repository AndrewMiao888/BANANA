// server/api/models.ts
import { defineEventHandler } from 'h3'
// @ts-ignore
import { AVAILABLE_MODELS } from '~~/src/models'

export default defineEventHandler(async () => {
  let isLocalComputerOnline = false

  const config = useRuntimeConfig()
const localBaseUrl = (config as any).homeOllamaUrl || process.env.HOME_OLLAMA_URL || 'https://xps9530-haydenk.tailb68230.ts.net'

try {
    // Ping local Ollama via Tailscale Funnel to check if machine is online
    await $fetch(`${localBaseUrl}/`, { method: 'GET', timeout: 1000 })
    isLocalComputerOnline = true
  } catch {
    isLocalComputerOnline = false
  }

  // Filter out local models if hardware is offline
  const filteredModels = AVAILABLE_MODELS.filter((model: { provider: string; id: string; name: string }) => {
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