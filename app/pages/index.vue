<template>
  <div 
    class="flex h-screen w-screen overflow-hidden bg-zinc-950 text-zinc-200 font-sans relative"
    :style="{ height: 'calc(var(--vh, 1vh) * 100)' }"
  >
    
    <div 
      v-if="isSidebarOpen" 
      @click="isSidebarOpen = false" 
      class="md:hidden fixed inset-0 bg-black/80 z-40 backdrop-blur-sm transition-opacity duration-300"
    ></div>

    <aside 
      :class="[isSidebarOpen ? 'translate-x-0 w-64 shadow-2xl' : '-translate-x-full w-64 md:translate-x-0 md:shadow-none']" 
      class="bg-zinc-900 border-r border-zinc-800 flex flex-col h-full z-50 fixed md:static transition-transform duration-300 ease-in-out shrink-0"
    >
      <div class="p-4 flex justify-between items-center border-b border-zinc-800 shrink-0 select-none">
        <div class="flex items-center space-x-2">
          <span class="text-xl">🍌</span>
          <span class="font-bold text-xs tracking-widest text-yellow-400 font-mono">BANANA CORE</span>
        </div>
        <button @click="isSidebarOpen = false" class="md:hidden p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-100 border border-zinc-700/50 transition">✕</button>
      </div>

      <div class="p-3 space-y-2 border-b border-zinc-800/60 shrink-0">
        <button @click="createNewSession" class="w-full bg-zinc-950 hover:bg-zinc-800 text-yellow-400 hover:text-yellow-300 border border-zinc-800 text-xs font-mono py-2.5 px-3 rounded-xl flex items-center justify-center space-x-2 transition active:scale-[0.99]">
          <span class="text-sm font-bold leading-none">+</span>
          <span>New Workspace Chat</span>
        </button>
        <div class="relative">
          <span class="absolute left-3 top-2.5 text-zinc-500 text-xs select-none">🔍</span>
          <input v-model="searchQuery" type="text" placeholder="Search workspace chats..." class="w-full bg-zinc-950/80 border border-zinc-800 focus:border-zinc-700 text-xs py-2 pl-8 pr-7 rounded-xl focus:outline-none text-zinc-300 placeholder-zinc-600 transition" />
          <button v-if="searchQuery" @click="searchQuery = ''" class="absolute right-2.5 top-2 text-zinc-500 hover:text-zinc-300 text-xs p-0.5">✕</button>
        </div>
      </div>

      <div class="flex-1 p-3 overflow-y-auto space-y-1 custom-scrollbar select-none">
        <div class="text-[10px] font-bold text-zinc-500 uppercase px-2 tracking-widest mb-2 flex justify-between items-center">
          <span>Active Sessions</span>
          <span v-if="searchQuery" class="text-[9px] text-yellow-500 font-mono normal-case">{{ filteredSessions.length }} found</span>
        </div>
        <div 
          v-for="session in filteredSessions" :key="session.id" @click="switchSession(session.id)"
          class="group w-full text-left p-2.5 rounded-xl transition flex items-center justify-between cursor-pointer border"
          :class="[currentSessionId === session.id ? 'bg-zinc-800 border-zinc-700 text-zinc-100 shadow-sm' : 'bg-transparent border-transparent hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200']"
        >
          <div class="flex flex-col min-w-0 pr-2 pointer-events-none">
            <span class="text-xs truncate font-medium">{{ session.title }}</span>
            <span class="text-[9px] text-zinc-500 mt-0.5">{{ new Date(session.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }}</span>
          </div>
          <button @click.stop="deleteSession(session.id)" class="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/10 rounded text-zinc-500 hover:text-red-400 transition">✕</button>
        </div>
      </div>
    </aside>

    <div class="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden bg-zinc-950">
      
      <header class="h-14 border-b border-zinc-850 bg-zinc-900/40 backdrop-blur-md px-4 flex items-center justify-between z-30 shrink-0 w-full select-none">
        <div class="flex items-center space-x-3">
          <button @click="isSidebarOpen = !isSidebarOpen" class="p-2 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-zinc-300 transition shadow-sm">
            <span class="text-base leading-none">☰</span>
          </button>
          <span class="text-xs font-mono text-zinc-400 hidden sm:inline uppercase tracking-widest bg-zinc-950 px-2.5 py-1 border border-zinc-850 rounded-lg">BANANA_SYS_V4.0</span>
        </div>
        <div class="flex items-center space-x-2 text-[11px] px-3 py-1 rounded-full border bg-zinc-950 transition-all duration-300" :class="isServerOnline ? 'text-green-400 border-green-900/30' : 'text-amber-400 border-amber-900/30'">
          <span class="h-1.5 w-1.5 rounded-full animate-pulse" :class="isServerOnline ? 'bg-green-400' : 'bg-amber-400'"></span>
          <span class="font-medium font-mono">{{ isServerOnline ? 'Ollama Cluster Linked' : 'Cloud Recovery Active' }}</span>
        </div>
      </header>

      <div class="flex-1 flex flex-col overflow-hidden max-w-4xl mx-auto w-full p-4 pb-0">
        <div ref="chatWindow" class="flex-1 overflow-y-auto space-y-5 pr-1 custom-scrollbar scroll-smooth pb-6 select-text">
          <div 
            v-for="(msg, idx) in visibleMessages" :key="idx"
            class="flex flex-col space-y-1.5"
            :class="[msg.role === 'user' ? 'items-end' : 'items-start']"
          >
            <span class="text-[10px] font-mono font-medium text-zinc-500 uppercase px-1">{{ msg.role === 'user' ? 'Operator' : 'Banana Core' }}</span>

            <div 
              class="w-full max-w-[85%] rounded-2xl shadow-md text-sm leading-relaxed border p-4"
              :class="[
                msg.role === 'user' 
                  ? 'bg-zinc-800 border-zinc-700 text-zinc-100 rounded-tr-sm self-end' 
                  : msg.content.includes('Connection Error:') || msg.content.includes('HIGH DEMAND')
                    ? 'bg-red-500/10 border-red-500/20 text-red-400 rounded-tl-sm font-mono'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-300 rounded-tl-sm'
              ]"
            >
              <div v-if="msg.role !== 'user' && extractThinking(msg.content)" class="mb-3 border-l-2 border-zinc-700 pl-3">
                <details class="group cursor-pointer" open>
                  <summary class="text-xs font-mono text-zinc-500 select-none hover:text-zinc-400 transition flex items-center space-x-1.5">
                    <span class="group-open:rotate-90 transition-transform duration-150 inline-block">▶</span>
                    <span>Thinking Process...</span>
                  </summary>
                  <p class="text-xs text-zinc-500 font-mono mt-1.5 whitespace-pre-wrap leading-relaxed">
                    {{ extractThinking(msg.content) }}
                  </p>
                </details>
              </div>

              <div class="prose-custom w-full break-words" v-html="renderRichPayload(stripThinking(msg.content))"></div>
            </div>
          </div>
        </div>

        <div class="mt-auto pt-2 bg-gradient-to-t from-zinc-950 via-zinc-950 to-transparent shrink-0">
          <ChatInput :is-loading="isLoading" @send="submitMessage" @cancel="handleAbortTransmission" @update-model="setSelectedModel" />
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed, nextTick } from 'vue'
import { runAgent1Core } from '~~/src/agents'
import { marked } from 'marked'
import katex from 'katex'
import 'katex/dist/katex.min.css'

const isLoading = ref(false)
const chatWindow = ref(null)
const isSidebarOpen = ref(false)
const isServerOnline = ref(true) 
const selectedModel = ref('Instant-Nana')
const searchQuery = ref('')
const savedSessions = ref([])
const currentSessionId = ref(null)
let currentAbortController = null

marked.setOptions({ gfm: true, breaks: true })

const defaultHistory = () => [
  { role: 'assistant', content: '<thinking>Connecting status diagnostics...</thinking>System initialized. Welcome to BANANA Core control panel.' }
]

const currentSession = computed(() => savedSessions.value.find(s => s.id === currentSessionId.value))
const chatHistory = computed(() => currentSession.value ? currentSession.value.history : defaultHistory())
const currentSummary = computed(() => currentSession.value ? currentSession.value.summary : '')
const visibleMessages = computed(() => chatHistory.value.filter(msg => msg.role !== 'system'))

// Helper: Extract Thinking Trace
const extractThinking = (content) => {
  const match = content.match(/<thinking>([\s\S]*?)<\/thinking>/)
  return match ? match[1].trim() : null
}

// Helper: Remove thinking tags from output render
const stripThinking = (content) => {
  return content.replace(/<thinking>[\s\S]*?<\/thinking>/, '').trim()
}

const renderRichPayload = (raw) => {
  if (!raw) return ''
  let processed = raw
  processed = processed.replace(/\$\$(.*?)\$\$/gs, (m, f) => {
    try { return `<div class="katex-block my-3 overflow-x-auto">${katex.renderToString(f, { displayMode: true, throwOnError: false })}</div>` } catch { return m }
  })
  processed = processed.replace(/\$(.*?)\$/g, (m, f) => {
    try { return katex.renderToString(f, { displayMode: false, throwOnError: false }) } catch { return m }
  })
  try { return marked.parse(processed) } catch { return processed }
}

const filteredSessions = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return savedSessions.value
  return savedSessions.value.filter(s => s.title.toLowerCase().includes(q) || s.history.some(m => m.content.toLowerCase().includes(q)))
})

const setSelectedModel = (mId) => { selectedModel.value = mId }

onMounted(() => {
  const stored = localStorage.getItem('banana_v4_sessions')
  if (stored) savedSessions.value = JSON.parse(stored)
  
  const activeId = localStorage.getItem('banana_v4_active_id')
  if (activeId && savedSessions.value.some(s => s.id === activeId)) {
    currentSessionId.value = activeId
  } else if (savedSessions.value.length > 0) {
    currentSessionId.value = savedSessions.value[0].id
  } else {
    createNewSession()
  }
  scrollWindowToBottom()
})

watch(savedSessions, (newVal) => localStorage.setItem('banana_v4_sessions', JSON.stringify(newVal)), { deep: true })
watch(currentSessionId, (newId) => {
  if (newId) localStorage.setItem('banana_v4_active_id', newId)
  scrollWindowToBottom()
})

const scrollWindowToBottom = async () => {
  await nextTick()
  if (chatWindow.value) chatWindow.value.scrollTop = chatWindow.value.scrollHeight
}

const createNewSession = () => {
  const newId = 'session_' + Date.now()
  savedSessions.value.unshift({
    id: newId,
    title: 'New Chat Workspace',
    history: defaultHistory(),
    summary: '',
    updatedAt: Date.now()
  })
  currentSessionId.value = newId
  isSidebarOpen.value = false
}

const switchSession = (id) => {
  currentSessionId.value = id
  isSidebarOpen.value = false
}

const deleteSession = (id) => {
  const idx = savedSessions.value.findIndex(s => s.id === id)
  if (idx !== -1) {
    savedSessions.value.splice(idx, 1)
    if (currentSessionId.value === id) {
      if (savedSessions.value.length > 0) currentSessionId.value = savedSessions.value[0].id
      else createNewSession()
    }
  }
}

const submitMessage = async (text) => {
  const cleanInput = text?.trim()
  if (!cleanInput || isLoading.value) return

  if (!currentSessionId.value) createNewSession()
  const activeChat = savedSessions.value.find(s => s.id === currentSessionId.value)
  if (!activeChat) return

  activeChat.history.push({ role: 'user', content: cleanInput })
  activeChat.updatedAt = Date.now()
  isLoading.value = true
  await scrollWindowToBottom()

  if (activeChat.title === 'New Chat Workspace') {
    activeChat.title = cleanInput.length > 28 ? cleanInput.substring(0, 28) + '...' : cleanInput
  }

  currentAbortController = new AbortController()

  try {
    const data = await runAgent1Core({
      messages: activeChat.history,
      model: selectedModel.value,
      existingSummary: activeChat.summary
    })
    
    if (isLoading.value) {
      activeChat.history.push({ role: 'assistant', content: data.content })
      if (data.updatedSummary) activeChat.summary = data.updatedSummary
      isServerOnline.value = data.provider !== 'error'
      activeChat.updatedAt = Date.now()
    }
  } catch {
    if (isLoading.value) {
      isServerOnline.value = false
      activeChat.history.push({ 
        role: 'assistant', 
        content: '<thinking>Network terminal request failed.</thinking>⚠️ HIGH DEMAND [COMPUTER NOT ON]: Offline or cloud queues blocked.' 
      })
    }
  } finally {
    isLoading.value = false
    currentAbortController = null
    await scrollWindowToBottom()
  }
}

const handleAbortTransmission = () => {
  if (currentAbortController) currentAbortController.abort()
  isLoading.value = false 
  const activeChat = savedSessions.value.find(s => s.id === currentSessionId.value)
  if (activeChat) {
    activeChat.history.push({ role: 'assistant', content: '<thinking>Generation process aborted by operator override.</thinking>_Generation stopped by Banana Admin._' })
    activeChat.updatedAt = Date.now()
  }
}
</script>