
<script setup lang="typescript">
import { ref, computed } from 'vue'
import { runAgent1Core, type ChatMessage } from './src/agents'

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
const modelsList = computed(() => [
  { 
    id: 'Instant-Nana', 
    name: '🍌 Instant-Nana (Cloud Backup)', 
    desc: 'Powered by Groq Cloud. Hyper-fast text completions.',
    requiresLocal: false 
  },
  { 
    id: 'Pro-Nana', 
    name: '⚡ Pro-Nana (Local Engine)', 
    desc: 'Powered by Llama 3.1. Maximum logical reasoning.',
    requiresLocal: true 
  },
  { 
    id: 'Mini-Nana', 
    name: '🍃 Mini-Nana (Local Tiny)', 
    desc: 'Lightweight local model for prompt summaries.',
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
            class="px-4 py-3 rounded-2xl shadow-sm text-sm leading-relaxed max-w-full whitespace-pre-wrap"
          >
            {{ msg.content }}
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