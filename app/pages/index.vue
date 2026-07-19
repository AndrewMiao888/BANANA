<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface ModelOption {
  id: string
  name: string
  provider: 'local' | 'groq'
  tier: string
  description: string
}

// Reactive UI Tracking states
const messages = ref<Message[]>([])
const inputMessage = ref('')
const isLoading = ref(false)
const networkStatus = ref<'ONLINE' | 'OFFLINE' | 'CHECKING...'>('CHECKING...')
const scrollContainer = ref<HTMLElement | null>(null)

// Model Matrix Options Configuration
const availableModels = ref<ModelOption[]>([])
const selectedModelId = ref('llama3-8b-8192') // Defaults to Instant-NANA Cloud Engine

// Automatically keeps conversation viewport locked to bottom on new updates
const autoScrollToBottom = async () => {
  await nextTick()
  if (scrollContainer.value) {
    scrollContainer.value.scrollTop = scrollContainer.value.scrollHeight
  }
}

// 📡 Synchronize with available local hardware capabilities
const syncNetworkHardware = async () => {
  try {
    const data = await $fetch<{ localComputerStatus: 'ONLINE' | 'OFFLINE'; models: ModelOption[] }>('/api/models')
    networkStatus.value = data.localComputerStatus
    availableModels.value = data.models
    
    // Safety check: ensure the active selection is currently allowed in the array
    const isValidSelection = data.models.some(model => model.id === selectedModelId.value)
    const firstModel = data.models[0]
    
    if (!isValidSelection && firstModel) {
      selectedModelId.value = firstModel.id
    }
  } catch (err) {
    console.error('System Network Synchronization Interrupted:', err)
    networkStatus.value = 'OFFLINE'
  }
}

// 🚀 Transmit execution packet through the API pipeline
const handleExecutePipeline = async () => {
  const sanitizedPrompt = inputMessage.value.trim()
  if (!sanitizedPrompt || isLoading.value) return

  // Clear input frame and push message structure immediately into active array
  inputMessage.value = ''
  messages.value.push({ role: 'user', content: sanitizedPrompt })
  isLoading.value = true
  await autoScrollToBottom()

  try {
    const data = await $fetch<any>('/api/chat', {
      method: 'POST',
      body: {
        messages: messages.value,
        selectedModelId: selectedModelId.value
      }
    })

    if (data.success && data.message) {
      messages.value.push({
        role: 'assistant',
        content: data.message.content
      })
    }
  } catch (error: any) {
    messages.value.push({
      role: 'system',
      content: `CRITICAL EXECUTION ERROR: ${error.statusMessage || 'The compute matrix failed to parse this instruction.'}`
    })
  } finally {
    isLoading.value = false
    await autoScrollToBottom()
  }
}

// Mount and initialize tracking
onMounted(() => {
  syncNetworkHardware()
})
</script>

<template>
  <div class="flex flex-col h-screen max-w-5xl mx-auto p-4 md:p-6 select-none">
    
    <header class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
      <div>
        <div class="flex items-center gap-2">
          <span class="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <h1 class="text-xl font-black tracking-wider text-emerald-400 font-mono">NANA_CORE_v4</h1>
        </div>
        <p class="text-xs text-slate-500 font-mono mt-0.5">Automated Hybrid AI Fallback Matrix</p>
      </div>

      <div class="flex flex-wrap items-center gap-4">
        <div class="bg-slate-950 px-3 py-1.5 rounded border border-slate-800 flex items-center gap-3">
          <span class="text-xs text-slate-400 font-mono">LOCAL_PC:</span>
          <span :class="['text-xs font-mono font-bold uppercase transition-colors px-1.5 py-0.5 rounded',
            networkStatus === 'ONLINE' ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800' :
            networkStatus === 'OFFLINE' ? 'bg-rose-950/80 text-rose-400 border border-rose-800' : 'bg-slate-800 text-slate-400']">
            {{ networkStatus }}
          </span>
        </div>

        <div class="flex flex-col min-w-[220px]">
          <select 
            v-model="selectedModelId"
            class="bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono rounded p-2 focus:outline-none focus:border-emerald-500 cursor-pointer transition"
          >
            <option v-for="model in availableModels" :key="model.id" :value="model.id">
              {{ model.name }} [{{ model.tier }}]
            </option>
          </select>
        </div>

        <button 
          @click="syncNetworkHardware"
          class="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 rounded transition active:scale-95"
          title="Rescan target computer hardware channels"
        >
          <span class="block text-sm transform hover:rotate-180 transition-transform duration-500">🔄</span>
        </button>
      </div>
    </header>

    <main 
      ref="scrollContainer"
      class="flex-1 overflow-y-auto my-6 space-y-6 pr-2 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent"
    >
      <div v-if="messages.length === 0" class="h-full flex flex-col items-center justify-center text-center px-4">
        <div class="w-12 h-12 bg-slate-950 text-slate-600 rounded-full flex items-center justify-center border border-slate-800 mb-3 text-lg font-mono">
          ∅
        </div>
        <p class="text-sm font-mono text-slate-500 tracking-wide max-w-sm">
          Pipeline connection verified. Select target -NANA matrix configuration above to initialize calculations.
        </p>
      </div>

      <div 
        v-for="(message, index) in messages" 
        :key="index"
        :class="['p-4 rounded border text-sm max-w-[85%] transition-all duration-200',
          message.role === 'user' 
            ? 'bg-slate-950 border-slate-800 ml-auto text-slate-100 font-sans' 
            : message.role === 'system'
              ? 'bg-rose-950/30 border-rose-900/40 text-rose-300 mx-auto w-full max-w-full font-mono text-xs text-center'
              : 'bg-slate-900/60 border-slate-850 text-slate-200 mr-auto font-sans']"
      >
        <div class="flex items-center gap-2 mb-1.5 opacity-45 select-none font-mono text-[10px] uppercase tracking-widest">
          <span>{{ message.role === 'user' ? '► OPERATOR' : message.role === 'system' ? '⚠️ BROADCAST' : '⚡ NANA_OUTPUT' }}</span>
        </div>
        <p class="whitespace-pre-wrap leading-relaxed selection:bg-emerald-500 selection:text-slate-950">{{ message.content }}</p>
      </div>

      <div v-if="isLoading" class="flex items-center gap-3 text-xs font-mono text-slate-500 p-2 bg-slate-950/20 w-fit rounded border border-slate-900 animate-pulse">
        <span class="text-emerald-400">⚡</span> Processing core computations...
      </div>
    </main>

    <footer class="border-t border-slate-800 pt-4 bg-slate-900">
      <form @submit.prevent="handleExecutePipeline" class="flex gap-2.5">
        <input 
          v-model="inputMessage"
          type="text"
          placeholder="Awaiting pipeline instructions..."
          class="flex-1 bg-slate-950 border border-slate-800 focus:border-emerald-500/80 rounded px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none font-mono transition"
          :disabled="isLoading"
          autocomplete="off"
        />
        <button 
          type="submit"
          class="bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-950 disabled:border-slate-800 disabled:text-slate-700 text-slate-950 px-6 py-3 rounded font-mono font-bold text-xs tracking-wider border border-emerald-500 transition active:scale-98"
          :disabled="isLoading || !inputMessage.trim()"
        >
          EXECUTE
        </button>
      </form>
    </footer>

  </div>
</template>

<style scoped>
/* Scannable custom scrollbars for webkit layouts */
.scrollbar-thin::-webkit-scrollbar {
  width: 4px;
}
.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}
.scrollbar-thin::-webkit-scrollbar-thumb {
  background: #1e293b;
  border-radius: 2px;
}
.scrollbar-thin::-webkit-scrollbar-thumb:hover {
  background: #334155;
}
</style>