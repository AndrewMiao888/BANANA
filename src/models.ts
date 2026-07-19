// src/models.ts

export interface ModelOption {
  id: string
  name: string
  provider: 'local' | 'groq'
  tier: 'High Demand' | 'Instant' | 'Unlimited'
  description: string
}

export const AVAILABLE_MODELS: ModelOption[] = [
  // --- SINGLE EXCLUSIVE CLOUD MODEL (GROQ) ---
  { id: 'llama3-8b-8192', name: 'Instant-NANA (Cloud)', provider: 'groq', tier: 'Instant', description: 'Ultra-fast cloud processing core' },

  // --- LOCAL COMPUTER MODELS (Active only when machine is ON) ---
  // Core Compute Tiers
  { id: 'llama3:8b', name: 'Standard-NANA', provider: 'local', tier: 'High Demand', description: 'Local foundational network' },
  { id: 'llama3:70b', name: 'Pro-NANA', provider: 'local', tier: 'High Demand', description: 'Heavy local reasoning engine' },
  { id: 'llama3.1:8b', name: 'Advanced-NANA', provider: 'local', tier: 'High Demand', description: 'Upgraded tools layout execution' },
  { id: 'llama3.2:1b', name: 'Micro-NANA', provider: 'local', tier: 'Instant', description: 'Minimalist system pipeline footprint' },
  { id: 'llama3.2:3b', name: 'Lite-NANA', provider: 'local', tier: 'Instant', description: 'Balanced lightweight text handling' },
  
  // Engineering & Logic Tiers
  { id: 'codestral:latest', name: 'Dev-NANA', provider: 'local', tier: 'High Demand', description: 'Specialized code completion pipeline' },
  { id: 'codequery:latest', name: 'Architect-NANA', provider: 'local', tier: 'High Demand', description: 'Heavy codebase synthesis structural layout' },
  { id: 'qwen2.5-coder:7b', name: 'Syntax-NANA', provider: 'local', tier: 'High Demand', description: 'Optimized parsing engine' },
  { id: 'deepseek-coder:6.7b', name: 'Logic-NANA', provider: 'local', tier: 'High Demand', description: 'High precision software engineering' },
  { id: 'deepseek-coder:33b', name: 'Deep-NANA', provider: 'local', tier: 'High Demand', description: 'Complex algorithmic computation array' },
  
  // Reasoning Tiers
  { id: 'mistral:7b', name: 'Swift-NANA', provider: 'local', tier: 'High Demand', description: 'High utility processing balance' },
  { id: 'phi3:3.8b', name: 'Mini-NANA', provider: 'local', tier: 'Instant', description: 'Compact contextual logic matrix' },
  { id: 'phi3:medium', name: 'Core-NANA', provider: 'local', tier: 'High Demand', description: 'Mid-tier local operational workspace' },
  { id: 'qwen2:7b', name: 'Global-NANA', provider: 'local', tier: 'High Demand', description: 'Multi-lingual processing pipeline' },
  { id: 'qwen2:72b', name: 'Apex-NANA', provider: 'local', tier: 'High Demand', description: 'Extreme computational capacity' },
  { id: 'command-r:latest', name: 'Search-NANA', provider: 'local', tier: 'High Demand', description: 'Advanced search context routing' },
  { id: 'command-r-plus:latest', name: 'Enterprise-NANA', provider: 'local', tier: 'High Demand', description: 'Massive agent task processing network' },
  { id: 'gemma2:27b', name: 'Quantum-NANA', provider: 'local', tier: 'High Demand', description: 'Heavy open-weight logic framework' },
  { id: 'codegemma:7b', name: 'Script-NANA', provider: 'local', tier: 'High Demand', description: 'Fast code helper implementation' },
  
  // Specialized & Multimodal Vision Tiers
  { id: 'llava:latest', name: 'Vision-NANA', provider: 'local', tier: 'Unlimited', description: 'Multimodal visual structural processing' },
  { id: 'bakllava:latest', name: 'Sight-NANA', provider: 'local', tier: 'Unlimited', description: 'Fast local graphic asset analysis' },
  { id: 'starcoder2:15b', name: 'Matrix-NANA', provider: 'local', tier: 'High Demand', description: 'Raw multi-language token layout' },
  { id: 'neural-chat:latest', name: 'Synapse-NANA', provider: 'local', tier: 'Instant', description: 'Fine-tuned conversational execution' },
  { id: 'solar:10.7b', name: 'Ray-NANA', provider: 'local', tier: 'High Demand', description: 'Compact execution architecture' },
  { id: 'vicuna:13b', name: 'Classic-NANA', provider: 'local', tier: 'High Demand', description: 'Standard traditional dialogue set' },
  { id: 'wizardlm2:7b', name: 'Spell-NANA', provider: 'local', tier: 'High Demand', description: 'High velocity prompt optimization' },
  { id: 'wizardlm2:8x22b', name: 'Titan-NANA', provider: 'local', tier: 'High Demand', description: 'Heavy mixture-of-experts logic array' },
  { id: 'orca-mini:latest', name: 'Pod-NANA', provider: 'local', tier: 'Instant', description: 'Sub-dataset optimization processing' },
  { id: 'tinyllama:latest', name: 'Nano-NANA', provider: 'local', tier: 'Instant', description: 'Minimal computational framework requirement' }
]