
<script setup lang="ts">
import { ref, computed } from 'vue'
import { runAgent1Core } from '../src/agents'
import type { ChatMessage } from '../src/agents'

// UI States
const isSidebarOpen = ref(true)
const isModelPickerOpen = ref(false)
const isComputerOnline = ref(true) // Checked dynamically based on server provider status
const selectedModel = ref('Instant-Nana')
const userInput = ref('')
const isLoading = ref(false)

// Chat History State
const messages = ref<ChatMessage[]>([
  { role: 'assistant', content: 'System initialized. Welcome to BANANA Core control panel.' }
])

// 🍌 Model List Configuration Matrix
// 🍌 Ultimate BANANA Core Model Identity Mapping (20+ Configurations)
const modelsList = computed(() => [
  // --- CLOUD INSTANT LAYER ---
  { 
    id: 'Instant-Nana', 
    name: '🍌 Instant-Nana (Cloud Backup)', 
    desc: 'Powered by Groq Cloud. Ultimate speed for general prompt routing.',
    ollamaModelTag: 'llama-3.1-8b-instant', 
    requiresLocal: false 
  },

  // --- GENERAL ENTERPRISE KERNELS (LLAMA FAMILY) ---
  { 
    id: 'Pro-Nana', 
    name: '⚡ Pro-Nana (Llama 3.1 8B)', 
    desc: 'Flagship local engine. Perfectly balanced for logic, reasoning, and context.',
    ollamaModelTag: 'llama3.1:8b', 
    requiresLocal: true 
  },
  { 
    id: 'Max-Nana', 
    name: '🦍 Max-Nana (Llama 3.1 70B)', 
    desc: 'Heavyweight intelligence cluster. Demands high VRAM for deep analytical problems.',
    ollamaModelTag: 'llama3.1:70b', 
    requiresLocal: true 
  },
  { 
    id: 'Ultra-Nana', 
    name: '👑 Ultra-Nana (Llama 3.3 70B)', 
    desc: 'State-of-the-art enterprise intelligence. Absolute precision command matching.',
    ollamaModelTag: 'llama3.3', 
    requiresLocal: true 
  },

  // --- CODER & SYNTAX SPECIALISTS ---
  { 
    id: 'Code-Nana', 
    name: '💻 Code-Nana (Qwen 2.5 Coder 7B)', 
    desc: 'Specialized local script engineer. Flawless syntax generation and structural fixes.',
    ollamaModelTag: 'qwen2.5-coder:7b', 
    requiresLocal: true 
  },
  { 
    id: 'Dev-Nana', 
    name: '🛠️ Dev-Nana (Qwen 2.5 Coder 1.5B)', 
    desc: 'Ultra-fast autocomplete engine for inline coding workflows.',
    ollamaModelTag: 'qwen2.5-coder:1.5b', 
    requiresLocal: true 
  },
  { 
    id: 'Script-Nana', 
    name: '📜 Script-Nana (CodeGemma)', 
    desc: 'Google-backed local dev kernel. Optimized for code logic maps and math arrays.',
    ollamaModelTag: 'codegemma', 
    requiresLocal: true 
  },
  { 
    id: 'Deep-Code-Nana', 
    name: '🐋 Deep-Code-Nana (DeepSeek Coder V2)', 
    desc: 'Advanced architectural coder. Exceptional multi-file project analysis.',
    ollamaModelTag: 'deepseek-coder-v2', 
    requiresLocal: true 
  },

  // --- LIGHTWEIGHT & SPEED-OPTIMIZED SYSTEMS ---
  { 
    id: 'Mini-Nana', 
    name: '🍃 Mini-Nana (Phi 3 3.8B)', 
    desc: 'Microsoft-backed small model. Incredibly smart for its lightweight resource footprint.',
    ollamaModelTag: 'phi3', 
    requiresLocal: true 
  },
  { 
    id: 'Micro-Nana', 
    name: '🔎 Micro-Nana (Llama 3.2 1B)', 
    desc: 'Ultra-compact model. Designed for instant summaries and background parsing.',
    ollamaModelTag: 'llama3.2:1b', 
    requiresLocal: true 
  },
  { 
    id: 'Nano-Nana', 
    name: '⚛️ Nano-Nana (Llama 3.2 3B)', 
    desc: 'Perfect local balance of low-RAM usage and fast chat responses.',
    ollamaModelTag: 'llama3.2:3b', 
    requiresLocal: true 
  },
  { 
    id: 'Gemma-Mini', 
    name: '💎 Gemma-Mini (Gemma 2 2B)', 
    desc: 'Google open-source engine. Lightning-fast text structuring.',
    ollamaModelTag: 'gemma2:2b', 
    requiresLocal: true 
  },

  // --- REASONING, LOGIC & MATH ENGINES ---
  { 
    id: 'Logic-Nana', 
    name: '🧠 Logic-Nana (DeepSeek R1 Distill 8B)', 
    desc: 'Chain-of-thought engine. Explicitly thinks through math and logical paradoxes step-by-step.',
    ollamaModelTag: 'deepseek-r1:8b', 
    requiresLocal: true 
  },
  { 
    id: 'Think-Nana', 
    name: '💭 Think-Nana (DeepSeek R1 Distill 14B)', 
    desc: 'Extended chain-of-thought core for highly complex scientific parsing tasks.',
    ollamaModelTag: 'deepseek-r1:14b', 
    requiresLocal: true 
  },
  { 
    id: 'Qwen-Math-Nana', 
    name: '📊 Qwen-Math-Nana (Qwen 2.5 Math)', 
    desc: 'Dedicated mathematical matrix calculator and algorithmic expert.',
    ollamaModelTag: 'qwen2.5-math', 
    requiresLocal: true 
  },

  // --- CREATIVE, CHAT, & AGENT CORES ---
  { 
    id: 'Creative-Nana', 
    name: '🎨 Creative-Nana (Mistral 7B)', 
    desc: 'Excellent prose generation, copy editing, and flexible conversational dynamics.',
    ollamaModelTag: 'mistral', 
    requiresLocal: true 
  },
  { 
    id: 'Gemma-Core', 
    name: '🔮 Gemma-Core (Gemma 2 9B)', 
    desc: 'Highly accurate text engine optimized for nuanced prompt understanding.',
    ollamaModelTag: 'gemma2:9b', 
    requiresLocal: true 
  },
  { 
    id: 'Qwen-Chat-Nana', 
    name: '💬 Qwen-Chat-Nana (Qwen 2.5 7B)', 
    desc: 'Exceptional instruction-following model for agent-based automation paths.',
    ollamaModelTag: 'qwen2.5:7b', 
    requiresLocal: true 
  },
  { 
    id: 'Command-Nana', 
    name: '🎖️ Command-Nana (Cohere Command R)', 
    desc: 'Built specifically for enterprise agents and massive RAG context lookups.',
    ollamaModelTag: 'command-r', 
    requiresLocal: true 
  },

  // --- VECTOR EMBEDDING & PIPELINE ENGINES ---
  { 
    id: 'Embed-Nana', 
    name: '🗂️ Embed-Nana (All-MiniLM-L6-V2)', 
    desc: 'Specialized embedding core. Used silently to convert local data into vector search maps.',
    ollamaModelTag: 'all-minilm', 
    requiresLocal: true 
  },
  { 
    id: 'Bge-Embed-Nana', 
    name: '📌 Bge-Embed-Nana (BGE Large)', 
    desc: 'High-accuracy sentence embedding engine for complex document searching.',
    ollamaModelTag: 'bge-large', 
    requiresLocal: true 
  }
])
// Toggle Sidebar Helper
const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value
}

// Select Model Option Helper
const selectModel = (model: any) => {
  if (model.requiresLocal && !isComputerOnline.value) return // Block if computer is off
  selectedModel.value = model.id
  isModelPickerOpen.value = false
}

// Send Message Stream Wrapper
const sendMessage = async () => {
  if (!userInput.value.trim() || isLoading.value) return

  const userText = userInput.value
  messages.value.push({ role: 'user', content: userText })
  userInput.value = ''
  isLoading.value = true

  try {
    // Exclude system log prompts from standard client array representation
    const activeHistory = messages.value.filter(m => m.role !== 'system')
    const response = await runAgent1Core(activeHistory)
    
    // Update model accessibility statuses cleanly based on backend response metadata
    if (response.provider === 'groq') {
      isComputerOnline.value = false
      if (selectedModel.value !== 'Instant-Nana') {
        selectedModel.value = 'Instant-Nana' // Snap user back to valid cloud fallback
      }
    } else if (response.provider === 'ollama') {
      isComputerOnline.value = true
    }

    messages.value.push({ role: 'assistant', content: response.content })
  } catch (error) {
    messages.value.push({ role: 'assistant', content: 'Connection Error: Core gateway timeout reached.' })
  } finally {
    isLoading.value = false
  }
}

const formatMarkdown = (text: string) => {
  if (!text) return ''
  
  return text
    // 1. Clean up line breaks safely
    .replace(/\n/g, '<br />')
    // 2. Bold text headings e.g., **Heading**
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-yellow-400 text-base block my-1">$1</strong>')
    // 3. Bullet points e.g., 1. Item
    .replace(/(\d+\.\s+)/g, '<span class="text-yellow-400 font-bold">$1</span>')
}
</script>

<template>
  <div class="flex h-screen w-screen overflow-hidden bg-zinc-900 text-zinc-100 font-sans">
    
    <div 
      :class="[isSidebarOpen ? 'w-64' : 'w-0']" 
      class="bg-zinc-950 transition-all duration-300 ease-in-out flex flex-col border-r border-zinc-800 overflow-hidden relative"
    >
      <div class="p-4 flex justify-between items-center border-b border-zinc-800 min-w-[256px]">
        <h1 class="font-bold text-yellow-400 tracking-wider">🍌 BANANA CORE</h1>
        <button @click="toggleSidebar" class="p-1 hover:bg-zinc-800 rounded text-zinc-400">
          ✕
        </button>
      </div>

      <div class="flex-1 p-3 overflow-y-auto space-y-2 min-w-[256px]">
        <div class="text-xs font-semibold text-zinc-500 uppercase px-2 mb-1">Recents</div>
      </div>
    </div>

    <div class="flex-1 flex flex-col min-w-0 bg-zinc-900 relative">
      
      <header class="h-14 border-b border-zinc-800 flex items-center justify-between px-4">
        <div class="flex items-center space-x-3">
          <button v-if="!isSidebarOpen" @click="toggleSidebar" class="p-1.5 hover:bg-zinc-800 rounded text-zinc-400">
            ☰
          </button>
          
          <div class="relative">
            <button 
              @click="isModelPickerOpen = !isModelPickerOpen"
              class="flex items-center space-x-2 bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-lg text-sm font-medium transition"
            >
              <span>{{ selectedModel }}</span>
              <span class="text-xs text-zinc-400">▼</span>
            </button>

            <div v-if="isModelPickerOpen" class="absolute left-0 mt-2 w-72 bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl p-2 z-50 space-y-1">
              <div 
                v-for="model in modelsList" 
                :key="model.id"
                @click="selectModel(model)"
                :class="[
                  model.requiresLocal && !isComputerOnline ? 'opacity-40 cursor-not-allowed' : 'hover:bg-zinc-800 cursor-pointer',
                  selectedModel === model.id ? 'bg-zinc-900 border border-zinc-700' : ''
                ]"
                class="p-2.5 rounded-lg transition text-left relative"
              >
                <div class="flex justify-between items-center">
                  <div class="font-medium text-sm">{{ model.name }}</div>
                  <div v-if="model.requiresLocal && !isComputerOnline" class="text-[10px] bg-red-900/40 text-red-400 font-bold px-1.5 py-0.5 rounded border border-red-800">
                    High Demand
                  </div>
                </div>
                <div class="text-xs text-zinc-400 mt-0.5">{{ model.desc }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="flex items-center space-x-2 text-xs px-2.5 py-1 rounded-full border bg-zinc-950" :class="isComputerOnline ? 'text-green-400 border-green-900/50' : 'text-amber-400 border-amber-900/50'">
          <span class="h-2 w-2 rounded-full animate-pulse" :class="isComputerOnline ? 'bg-green-400' : 'bg-amber-400'"></span>
          <span>Core Location: {{ isComputerOnline ? 'Home Server (Ollama)' : 'Cloud Node Fallback' }}</span>
        </div>
      </header>

<main class="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 max-w-3xl mx-auto w-full">
  <div 
    v-for="(msg, index) in messages" 
    :key="index"
    class="flex"
    :class="[msg.role === 'user' ? 'justify-end' : 'justify-start']"
  >
    <div 
      :class="[msg.role === 'user' ? 'bg-yellow-400 text-zinc-950 font-medium ml-12' : 'bg-zinc-800 text-zinc-100 mr-12 border border-zinc-700/50']"
      class="px-4 py-3 rounded-2xl shadow-sm text-sm leading-relaxed max-w-full"
    >
      <span v-if="msg.role === 'assistant'" v-html="formatMarkdown(msg.content)"></span>
      <span v-else>{{ msg.content }}</span>
    </div>
  </div>
</main>

      <footer class="p-4 max-w-3xl mx-auto w-full">
        <div class="bg-zinc-950 border border-zinc-800 rounded-2xl p-2 focus-within:border-zinc-700 transition relative flex items-end">
          <textarea 
            v-model="userInput"
            @keydown.enter.prevent="sendMessage"
            placeholder="Talk with BANANA Core..."
            rows="1"
            class="w-full bg-transparent resize-none outline-none text-sm p-2 text-zinc-100 placeholder-zinc-500 max-h-32"
          ></textarea>
          <button 
            @click="sendMessage"
            :disabled="isLoading || !userInput.trim()"
            class="bg-yellow-400 hover:bg-yellow-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-950 font-bold p-2 rounded-xl transition shadow-sm ml-2"
          >
            <span v-if="!isLoading">↑</span>
            <span v-else class="block h-4 w-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin"></span>
          </button>
        </div>
        <div class="text-center text-[10px] text-zinc-600 mt-2">
          BANANA Engine Core v4.0. Enterprise Local/Cloud Hybrid System.
        </div>
      </footer>
      
    </div>
  </div>
</template>