// src/models.ts

export interface ModelOption {
  id: string
  name: string
  provider: 'local' | 'groq'
  tier: 'High Demand' | 'Instant' | 'Unlimited'
  description: string
}

export const AVAILABLE_MODELS: ModelOption[] = [
  // --- LOCAL COMPUTER MODELS (Free, Unlimited) ---
  { 
    id: 'qwen-super:latest', 
    name: 'Qwen Super Engine', 
    provider: 'local', 
    tier: 'High Demand', 
    description: 'Primary custom local logic and coding engine.' 
  },
  { 
    id: 'llava:latest', 
    name: 'Vision-NANA', 
    provider: 'local', 
    tier: 'Unlimited', 
    description: 'Local multimodal visual structural processing.' 
  },

  // --- CLOUD FALLBACK MODEL (Groq API) ---
  { 
    id: 'llama-3.1-8b-instant', 
    name: 'Instant-NANA (Cloud)', 
    provider: 'groq', 
    tier: 'Instant', 
    description: 'Ultra-fast cloud processing core (used if local is offline).' 
  }
]