<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
  source?: string
  attachments?: string[]
}

interface ModelOption {
  id: string
  name: string
  provider: 'local' | 'groq'
  tier: string
  description: string
}

// UI State Management
const isSidebarOpen = ref(true)
const messages = ref<Message[]>([])
const inputMessage = ref('')
const isLoading = ref(false)
const networkStatus = ref<'ONLINE' | 'OFFLINE' | 'CHECKING...'>('CHECKING...')
const scrollContainer = ref<HTMLElement | null>(null)

// Memory & Summary telemetry states
const runningSummary = ref<string>('No summary computed yet.')
const longTermMemories = ref<string[]>([])

// Input Feature States
const isRecording = ref(false)
const selectedFiles = ref<{ name: string; base64: string }[]>([])
const fileInputRef = ref<HTMLInputElement | null>(null)

// Model Configuration Matrix
const availableModels = ref<ModelOption[]>([])
const selectedModelId = ref('llama3-8b-8192')

// Abort Controller for Generation Stop
let activeAbortController: AbortController | null = null

const autoScrollToBottom = async () => {
  await nextTick()
  if (scrollContainer.value) {
    scrollContainer.value.scrollTop = scrollContainer.value.scrollHeight
  }
}

// 📡 Synchronize available hardware channels and context state
const syncNetworkHardware = async () => {
  try {
    const data = await $fetch<{ localComputerStatus: 'ONLINE' | 'OFFLINE'; models: ModelOption[] }>('/api/models')
    networkStatus.value = data.localComputerStatus
    availableModels.value = data.models
    
    const isValidSelection = data.models.some(m => m.id === selectedModelId.value)
    const firstModel = data.models[0]
    if (!isValidSelection && firstModel) {
      selectedModelId.value = firstModel.id
    }

    // Trigger explicit context summarization protocols depending on computer status
    await updateSystemSummaryState()
  } catch (err) {
    console.error('Network Synchronization Failure:', err)
    networkStatus.value = 'OFFLINE'
  }
}

// 🧠 Memory & Summary Sync Engine Trigger
const updateSystemSummaryState = async () => {
  try {
    const data = await $fetch<any>('/api/memory-sync', {
      method: 'POST',
      body: {
        messages: messages.value,
        isLocalComputerOn: networkStatus.value === 'ONLINE',
        currentSummary: runningSummary.value
      }
    })
    if (data.success) {
      runningSummary.value = data.summary
      if (data.extractedMemories) {
        longTermMemories.value = [...longTermMemories.value, ...data.extractedMemories]
      }
    }
  } catch (e) {
    console.warn('Memory telemetry system sync deferred.', e)
  }
}

// 🛠️ Feature: File Processing Layer
const handleFileTrigger = () => {
  fileInputRef.value?.click()
}

const onFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (!target.files) return

  Array.from(target.files).forEach(file => {
    const reader = new FileReader()
    reader.onload = (event) => {
      if (event.target?.result) {
        selectedFiles.value.push({
          name: file.name,
          base64: event.target.result as string
        })
      }
    }
    reader.readAsDataURL(file)
  })
}

const removeFile = (index: number) => {
  selectedFiles.value.splice(index, 1)
}

// 🎤 Feature: Microphone Transcription Simulation
const toggleMicrophone = () => {
  if (isRecording.value) {
    isRecording.value = false
    inputMessage.value += (inputMessage.value ? ' ' : '') + '[Transcribed Protocol Entry Raw Data]'
  } else {
    isRecording.value = true
  }
}

// 🛑 Feature: Interrupt/Stop Stream Engine
const stopGenerationPipeline = () => {
  if (activeAbortController) {
    activeAbortController.abort()
    activeAbortController = null
    isLoading.value = false
    messages.value.push({
      role: 'system',
      content: '🔧 OPERATOR OVERRIDE: Compute core generation execution manually interrupted.'
    })
    autoScrollToBottom()
  }
}

// Advanced Client-Side Parsing Engine for Headings, Code Blocks, and KaTeX Mathematical structures
const parseRichContent = (text: string) => {
  if (!text) return ''
  
  let formatted = text
    // 1. Render Block Math Layouts $$ ... $$ or \[ ... \]
    .replace(/\$\$(.*?)\$\$/gs, '<div class="my-3 p-3 bg-slate-950 rounded border border-slate-800 text-center font-serif text-emerald-300 overflow-x-auto">$$1</div>')
    .replace(/\\\[(.*?)\\\]/gs, '<div class="my-3 p-3 bg-slate-950 rounded border border-slate-800 text-center font-serif text-emerald-300 overflow-x-auto">$$1</div>')
    
    // 2. Render Inline Math Layouts $ ... $ or \( ... \)
    .replace(/\$(.*?)\$/g, '<span class="px-1 py-0.5 bg-slate-950 text-emerald-300 font-serif rounded">$1</span>')
    .replace(/\\\((.*?)\\\)/g, '<span class="px-1 py-0.5 bg-slate-950 text-emerald-300 font-serif rounded">$1</span>')
    
    // 3. Render Code Blocks ```lang ... ```
    .replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
      return `<div class="my-4 bg-slate-950 rounded border border-slate-800 overflow-hidden font-mono text-left">
        <div class="bg-slate-900 px-4 py-1.5 border-b border-slate-800 flex justify-between text-[10px] text-slate-400 select-none uppercase tracking-wider">
          <span>${lang || 'CODE_STREAM'}</span>
          <span class="text-emerald-500/50">ACTIVE_BLOCK</span>
        </div>
        <pre class="p-4 overflow-x-auto text-slate-200 text-xs select-text"><code>${code.trim()}</code></pre>
      </div>`
    })
    
    // 4. Render Inline Quick Code Tags `...`
    .replace(/`([^`\n]+)`/g, '<code class="px-1.5 py-0.5 bg-slate-950 border border-slate-800 text-rose-400 font-mono rounded select-text">$1</code>')
    
    // 5. Structural Core Framework Headings ###, ##, #
    .replace(/^### (.*$)/gim, '<h3 class="text-slate-100 font-bold text-sm mt-4 mb-2 tracking-wide font-sans">■ $1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-emerald-400 font-black text-base mt-5 mb-2.5 tracking-wider font-sans">⚡ $1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-emerald-400 font-black text-lg mt-6 mb-3 border-b border-slate-800 pb-1 tracking-widest font-sans">$1</h1>')
    
    // 6. Bold transformations **text**
    .replace(/\*\*([^*]+)\*\*/g, '<strong class="text-emerald-400 font-bold">$1</strong>')

  return formatted
}

// 🚀 Core Execution Pipeline Engine
const handleExecutePipeline = async () => {
  const sanitizedPrompt = inputMessage.value.trim()
  if (!sanitizedPrompt && selectedFiles.value.length === 0 || isLoading.value) return

  const attachments = selectedFiles.value.map(f => f.name)
  const base64Payload = selectedFiles.value[0]?.base64 || null

  messages.value.push({ 
    role: 'user', 
    content: sanitizedPrompt || `[Analyzed Asset Transmission: ${attachments.join(', ')}]`,
    attachments: attachments.length > 0 ? attachments : undefined
  })

  inputMessage.value = ''
  selectedFiles.value = []
  isLoading.value = true
  await autoScrollToBottom()

  activeAbortController = new AbortController()

  try {
    const targetEndpoint = base64Payload ? '/api/analyze-vision' : '/api/chat'
    const payloadBody = base64Payload 
      ? { prompt: sanitizedPrompt || 'Analyze this image context.', imageBase64: base64Payload }
      : { 
          messages: messages.value.map(m => ({ role: m.role, content: m.content })), 
          selectedModelId: selectedModelId.value,
          summaryContext: runningSummary.value,
          memories: longTermMemories.value
        }

    const data = await $fetch<any>(targetEndpoint, {
      method: 'POST',
      signal: activeAbortController.signal,
      body: payloadBody
    })

    if (data.success) {
      messages.value.push({
        role: 'assistant',
        content: data.message?.content || data.analysis || 'Calculation finalized.',
        source: data.source
      })
      
      // Update running memory and state map continuously after model yields output
      await updateSystemSummaryState()
    }
  } catch (error: any) {
    if (error.name !== 'AbortError') {
      messages.value.push({
        role: 'system',
        content: `PIPELINE EXHAUSTION ERROR: ${error.statusMessage || 'The compute grid dropped this layout packet.'}`
      })
    }
  } finally {
    isLoading.value = false
    activeAbortController = null
    await autoScrollToBottom()
  }
}

onMounted(() => {
  syncNetworkHardware()
})
</script>

<template>
  <div class="flex h-screen bg-slate-950 font-mono text-xs select-none antialiased text-slate-200 overflow-hidden">
    
    <aside 
      :class="['bg-slate-900 border-r border-slate-800 flex flex-col transition-all duration-300 ease-in-out z-20 shrink-0 h-full',
        isSidebarOpen ? 'w-64' : 'w-0 border-r-0 overflow-hidden']"
    >
      <div class="p-4 border-b border-slate-800 flex items-center justify-between">
        <span class="text-emerald-400 font-black tracking-widest text-[10px]">CORE MEMORY DATA</span>
        <span class="bg-slate-950 px-1 text-slate-500 rounded text-[9px] border border-slate-800">TELEMETRY</span>
      </div>

      <div class="flex-1 p-3 space-y-4 overflow-y-auto text-slate-400">
        <div class="space-y-1.5">
          <div class="text-[9px] text-slate-500 uppercase font-bold tracking-wider">⚡ Running Main Idea Summary:</div>
          <div class="p-2.5 bg-slate-950 border border-slate-850 rounded text-slate-300 text-[10px] leading-relaxed font-sans max-h-40 overflow-y-auto">
            {{ runningSummary }}
          </div>
        </div>

        <div v-if="longTermMemories.length > 0" class="space-y-1.5">
          <div class="text-[9px] text-slate-500 uppercase font-bold tracking-wider">💾 Extracted Memories (Offline Cache):</div>
          <div class="space-y-1">
            <div v-for="(memory, mIdx) in longTermMemories" :key="mIdx" class="p-1.5 bg-slate-950 border border-slate-850 rounded text-[9px] truncate text-emerald-400/80">
              • {{ memory }}
            </div>
          </div>
        </div>
      </div>

      <div class="p-3 border-t border-slate-800 bg-slate-950 text-[10px] space-y-1 text-slate-500">
        <div>SYS_LOC: 127.0.0.1:11434</div>
        <div>CONTEXT_STRATEGY: {{ networkStatus === 'ONLINE' ? 'LOCAL_FULL_READ' : 'CLOUD_INCREMENTAL' }}</div>
      </div>
    </aside>

    <div class="flex-1 flex flex-col h-full bg-slate-950 relative overflow-hidden">
      
      <header class="h-14 border-b border-slate-800 flex items-center justify-between px-4 bg-slate-900 shrink-0">
        <div class="flex items-center gap-3">
          <button 
            @click="isSidebarOpen = !isSidebarOpen"
            class="p-1.5 bg-slate-950 border border-slate-800 text-slate-400 hover:text-emerald-400 rounded transition"
          >
            {{ isSidebarOpen ? '◀' : '▶' }}
          </button>
          <div class="flex flex-col">
            <div class="flex items-center gap-1.5">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span class="font-bold tracking-wider text-slate-100">NANA_INTELLIGENCE_CORE</span>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-4">
          <div class="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 border border-slate-800 rounded">
            <span class="text-slate-500 text-[10px]">GRID:</span>
            <span :class="['font-bold text-[10px]', networkStatus === 'ONLINE' ? 'text-emerald-400' : 'text-rose-400']">
              {{ networkStatus }}
            </span>
          </div>

          <select 
            v-model="selectedModelId"
            class="bg-slate-950 border border-slate-850 text-slate-300 text-[11px] rounded p-1 focus:outline-none focus:border-emerald-500 font-mono cursor-pointer transition"
          >
            <option v-for="model in availableModels" :key="model.id" :value="model.id">
              {{ model.name }} [{{ model.tier }}]
            </option>
          </select>

          <button 
            @click="syncNetworkHardware"
            class="p-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-850 text-slate-300 rounded transition"
          >
            🔄
          </button>
        </div>
      </header>

      <main ref="scrollContainer" class="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 scroll-smooth">
        <div v-if="messages.length === 0" class="h-full flex flex-col items-center justify-center text-center text-slate-600">
          <span class="text-3xl mb-2 text-slate-800">⚙️</span>
          <p class="max-w-xs leading-normal">Operational matrix standby. Provide operational parameters or instructions to mount computational threads.</p>
        </div>

        <div 
          v-for="(msg, index) in messages" 
          :key="index"
          :class="['p-3.5 rounded border text-[11px] max-w-[85%] relative transition-all duration-150',
            msg.role === 'user' ? 'bg-slate-900 border-slate-800 ml-auto text-slate-100' :
            msg.role === 'system' ? 'bg-rose-950/20 border-rose-900/40 text-rose-300 mx-auto w-full max-w-full text-center font-bold' :
            'bg-slate-900/30 border-slate-850/80 text-slate-300 mr-auto']"
        >
          <div class="flex items-center gap-2 mb-1.5 opacity-40 text-[9px] uppercase tracking-wider select-none font-black">
            <span>{{ msg.role === 'user' ? '► OP_INPUT' : msg.role === 'system' ? '⚠️ BROADCAST' : '⚡ NANA_RESPONSE' }}</span>
            <span v-if="msg.source" class="text-[8px] bg-slate-950 px-1 border border-slate-800 text-emerald-400">{{ msg.source }}</span>
          </div>
          
          <div v-if="msg.attachments" class="mb-2 p-1.5 bg-slate-950 border border-slate-850 rounded text-slate-400 space-y-0.5">
            <div v-for="(file, fIdx) in msg.attachments" :key="fIdx" class="truncate flex items-center gap-1">
              📎 <span>{{ file }}</span>
            </div>
          </div>

          <div v-html="parseRichContent(msg.content)" class="prose prose-invert max-w-none space-y-2 select-text"></div>
        </div>

        <div v-if="isLoading" class="p-3 bg-slate-900 border border-emerald-950 text-[11px] w-fit rounded flex items-center gap-4 animate-pulse">
          <div class="flex items-center gap-2">
            <span class="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span class="text-slate-400">Computing core routing parameters...</span>
          </div>
          <button 
            @click="stopGenerationPipeline"
            class="px-2 py-0.5 bg-rose-950 border border-rose-800 text-rose-400 rounded text-[9px] hover:bg-rose-900/60 transition font-black"
          >
            🛑 BREAK SYSTEM
          </button>
        </div>
      </main>

      <footer class="p-4 border-t border-slate-800 bg-slate-900 shrink-0">
        <div v-if="selectedFiles.length > 0" class="flex flex-wrap gap-2 mb-3 p-2 bg-slate-950 border border-slate-850 rounded">
          <div v-for="(file, idx) in selectedFiles" :key="idx" class="bg-slate-900 border border-slate-800 pl-2 pr-1 py-1 rounded flex items-center gap-2 max-w-[200px]">
            <span class="truncate text-slate-400 font-sans text-[10px]">📁 {{ file.name }}</span>
            <button type="button" @click="removeFile(idx)" class="text-rose-400 hover:bg-rose-950/40 w-4 h-4 rounded text-center leading-none">×</button>
          </div>
        </div>

        <form @submit.prevent="handleExecutePipeline" class="flex gap-2">
          <input type="file" ref="fileInputRef" class="hidden" multiple accept="image/*" @change="onFileChange" />

          <div class="flex gap-1">
            <button type="button" @click="handleFileTrigger" class="px-3 bg-slate-950 hover:bg-slate-800 border border-slate-850 text-slate-400 hover:text-emerald-400 rounded transition" :disabled="isLoading">📁</button>
            <button type="button" @click="toggleMicrophone" :class="['px-3 border rounded transition font-bold', isRecording ? 'bg-rose-950 border-rose-800 text-rose-400 animate-pulse' : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-emerald-400']" :disabled="isLoading">
              {{ isRecording ? '🎙️ REC' : '🎙️' }}
            </button>
          </div>

          <input 
            v-model="inputMessage" 
            type="text" 
            placeholder="Awaiting operational protocols or file injections..." 
            class="flex-1 bg-slate-950 border border-slate-850 focus:border-emerald-500 text-[11px] rounded px-3 text-slate-100 placeholder-slate-600 focus:outline-none font-mono transition" 
            :disabled="isLoading" 
            autocomplete="off" 
          />
          
          <button 
            type="submit" 
            class="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-950 disabled:border-slate-850 disabled:text-slate-700 text-slate-950 px-5 rounded font-black border border-emerald-600 transition tracking-wider" 
            :disabled="isLoading || (!inputMessage.trim() && selectedFiles.length === 0)"
          >
            EXECUTE
          </button>
        </form>
      </footer>

    </div>
  </div>
</template>