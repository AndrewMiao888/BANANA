<template>
  <div 
    class="flex h-screen w-screen overflow-hidden bg-zinc-950 text-zinc-200 font-sans relative"
    :style="{ height: 'calc(var(--vh, 1vh) * 100)' }"
  >
    
    <div 
      v-if="isSidebarOpen" 
      @click="isSidebarOpen = false" 
      class="md:hidden fixed inset-0 bg-black/80 z-40 backdrop-blur-sm animate-fade-in"
    ></div>

    <aside 
      :class="[isSidebarOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full md:w-64 md:translate-x-0']" 
      class="bg-zinc-900 border-r border-zinc-850 flex flex-col h-full z-50 fixed md:static transition-all duration-300 ease-in-out overflow-hidden"
    >
      <div class="p-4 flex justify-between items-center border-b border-zinc-850 min-w-[256px] select-none">
        <div class="flex items-center space-x-2">
          <span class="text-xl">🍌</span>
          <span class="font-bold text-xs tracking-widest text-yellow-400 font-mono">BANANA CORE</span>
        </div>
        <button 
          @click="isSidebarOpen = false" 
          class="md:hidden p-1.5 hover:bg-zinc-800 rounded text-zinc-400 transition"
          title="Close Sidebar"
        >
          ✕
        </button>
      </div>

      <div class="p-3 space-y-2 min-w-[256px] border-b border-zinc-850/40">
        <button 
          @click="createNewSession"
          class="w-full bg-zinc-950 hover:bg-zinc-850 hover:text-yellow-400 border border-zinc-800 text-xs font-mono py-2.5 px-3 rounded-xl flex items-center justify-center space-x-2 transition-all duration-200"
        >
          <span class="text-sm font-bold leading-none">+</span>
          <span>New Workspace Chat</span>
        </button>

        <div class="relative">
          <span class="absolute left-3 top-2.5 text-zinc-500 text-xs select-none">🔍</span>
          <input 
            v-model="searchQuery"
            type="text"
            placeholder="Search workspace chats..."
            class="w-full bg-zinc-950/80 border border-zinc-800 focus:border-zinc-700 text-xs py-2 pl-8 pr-7 rounded-xl focus:outline-none text-zinc-300 placeholder-zinc-600 transition"
          />
          <button 
            v-if="searchQuery" 
            @click="searchQuery = ''"
            class="absolute right-2.5 top-2 text-zinc-500 hover:text-zinc-300 text-xs p-0.5"
          >
            ✕
          </button>
        </div>
      </div>

      <div class="flex-1 p-3 overflow-y-auto space-y-1 min-w-[256px] custom-scrollbar select-none">
        <div class="text-[10px] font-bold text-zinc-500 uppercase px-2 tracking-widest mb-2 flex justify-between items-center">
          <span>Active Sessions</span>
          <span v-if="searchQuery" class="text-[9px] text-yellow-500 font-mono normal-case">
            {{ filteredSessions.length }} found
          </span>
        </div>
        
        <div 
          v-for="session in filteredSessions" 
          :key="session.id"
          @click="switchSession(session.id)"
          class="group w-full text-left p-2.5 rounded-xl transition flex items-center justify-between cursor-pointer border"
          :class="[
            currentSessionId === session.id 
              ? 'bg-zinc-850 border-zinc-750 text-zinc-100 shadow-sm' 
              : 'bg-transparent border-transparent hover:bg-zinc-850/50 text-zinc-400 hover:text-zinc-200'
          ]"
        >
          <div class="flex flex-col min-w-0 pr-2">
            <span class="text-xs truncate font-medium">{{ session.title }}</span>
            <span class="text-[9px] text-zinc-500 mt-0.5">
              {{ new Date(session.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }}
            </span>
          </div>
          <button 
            @click.stop="deleteSession(session.id)"
            class="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/10 rounded text-zinc-500 hover:text-red-400 transition-all duration-150"
            title="Delete Session"
          >
            ✕
          </button>
        </div>

        <div v-if="filteredSessions.length === 0" class="text-center py-8 text-xs text-zinc-600 font-mono">
          No matching chats found.
        </div>
      </div>
    </aside>

    <div class="flex-1 flex flex-col min-w-0 h-full relative">
      
      <header class="h-14 border-b border-zinc-850 bg-zinc-900/40 backdrop-blur-md px-4 flex items-center justify-between z-30 select-none shrink-0">
        <div class="flex items-center space-x-3">
          <button 
            @click="isSidebarOpen = !isSidebarOpen" 
            class="p-2 hover:bg-zinc-850 rounded-lg text-zinc-400 transition"
            title="Toggle Sidebar"
          >
            <span>☰</span>
          </button>
          <span class="text-xs font-mono text-zinc-400 hidden sm:inline uppercase tracking-widest bg-zinc-950 px-2.5 py-1 border border-zinc-850 rounded-lg">
            BANANA_SYS_V4.0
          </span>
        </div>

        <div 
          class="flex items-center space-x-2 text-[11px] px-3 py-1 rounded-full border bg-zinc-950 transition-all duration-300" 
          :class="isServerOnline ? 'text-green-400 border-green-900/30' : 'text-amber-400 border-amber-900/30'"
        >
          <span class="h-1.5 w-1.5 rounded-full animate-pulse" :class="isServerOnline ? 'bg-green-400' : 'bg-amber-400'"></span>
          <span class="font-medium font-mono">
            {{ isServerOnline ? 'Ollama Cluster Linked' : 'Cloud Recovery Active' }}
          </span>
        </div>
      </header>

      <div class="flex-1 flex flex-col overflow-hidden max-w-4xl mx-auto w-full p-4 pb-0">
        <div 
          ref="chatWindow"
          class="flex-1 overflow-y-auto space-y-5 pr-1 custom-scrollbar scroll-smooth pb-6 select-text"
        >
          <div 
            v-for="(msg, idx) in visibleMessages" 
            :key="idx"
            class="flex flex-col space-y-1.5 animate-fade-in"
            :class="[msg.role === 'user' ? 'items-end' : 'items-start']"
          >
            <span class="text-[10px] font-mono font-medium text-zinc-500 select-none uppercase tracking-wider px-1">
              {{ msg.role === 'user' ? 'Operator' : 'Banana Core' }}
            </span>

            <div 
              class="px-4 py-3.5 rounded-2xl shadow-md text-sm leading-relaxed max-w-[85%] border"
              :class="[
                msg.role === 'user' 
                  ? 'bg-zinc-800 border-zinc-700/50 text-zinc-100 rounded-tr-sm' 
                  : msg.content.includes('Connection Error:') || msg.content.includes('HIGH DEMAND')
                    ? 'bg-red-500/10 border-red-500/20 text-red-400 rounded-tl-sm font-mono'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-300 rounded-tl-sm'
              ]"
            >
              <div v-if="msg.role !== 'user' && extractThinking(msg.content)" class="mb-3.5 border-l-2 border-zinc-700 pl-3">
                <details class="group cursor-pointer" open>
                  <summary class="text-xs font-mono text-zinc-500 select-none hover:text-zinc-400 transition flex items-center space-x-1.5">
                    <span class="group-open:rotate-90 transition-transform duration-150 inline-block text-[10px]">▶</span>
                    <span>Thinking Process...</span>
                  </summary>
                  <p class="text-xs text-zinc-500 font-mono mt-2 whitespace-pre-wrap leading-relaxed tracking-wide">
                    {{ extractThinking(msg.content) }}
                  </p>
                </details>
              </div>

              <div 
                class="prose-custom w-full break-words" 
                v-html="renderRichPayload(stripThinking(msg.content))"
              ></div>
            </div>
          </div>
        </div>

        <div class="mt-auto pt-2 bg-gradient-to-t from-zinc-950 via-zinc-950 to-transparent shrink-0">
          <ChatInput 
            :is-loading="isLoading"
            @send="submitMessage"
            @cancel="handleAbortTransmission"
            @update-model="setSelectedModel"
          />
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

// --- CORE SYSTEM STATES ---
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
  { role: 'assistant', content: '<thinking>Bootstrapping initial state matrix... Core services linked.</thinking>System initialized. Welcome to BANANA Core control panel.' }
]

const currentSession = computed(() => {
  return savedSessions.value.find(s => s.id === currentSessionId.value)
})

const chatHistory = computed(() => {
  return currentSession.value ? currentSession.value.history : defaultHistory()
})

const currentSummary = computed(() => {
  return currentSession.value ? currentSession.value.summary : ''
})

const visibleMessages = computed(() => {
  return chatHistory.value.filter(msg => msg.role !== 'system')
})

// --- REGEX REASONING EXTRACTION ENGINES ---
const extractThinking = (content) => {
  const match = content.match(/<thinking>([\s\S]*?)<\/thinking>/)
  return match ? match[1].trim() : null
}

const stripThinking = (content) => {
  return content.replace(/<thinking>[\s\S]*?<\/thinking>/, '').trim()
}

// --- LATEX & MARKDOWN PARSING ENGINE ---
const renderRichPayload = (rawContent) => {
  if (!rawContent) return ''
  let processed = rawContent
  
  // Parse Block-level Formulas: $$...$$
  processed = processed.replace(/\$\$(.*?)\$\$/gs, (m, formula) => {
    try {
      return `<div class="katex-block my-4 overflow-x-auto py-1">${katex.renderToString(formula, { displayMode: true, throwOnError: false })}</div>`
    } catch {
      return m
    }
  })

  // Parse Inline Formulas: $...$
  processed = processed.replace(/\$(.*?)\$/g, (m, formula) => {
    try {
      return katex.renderToString(formula, { displayMode: false, throwOnError: false })
    } catch {
      return m
    }
  })

  try {
    return marked.parse(processed)
  } catch {
    return processed
  }
}

// --- WORKSPACE SEARCH MODULES ---
const filteredSessions = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return savedSessions.value
  return savedSessions.value.filter(s => 
    s.title.toLowerCase().includes(query) || 
    s.history.some(m => m.content.toLowerCase().includes(query))
  )
})

const setSelectedModel = (modelId) => { selectedModel.value = modelId }

// --- LIFECYCLE SYNC & ENVIRONMENT ---
onMounted(() => {
  const stored = localStorage.getItem('banana_workspace_sessions')
  if (stored) {
    savedSessions.value = JSON.parse(stored)
  }
  const lastActiveId = localStorage.getItem('banana_active_session_id')
  if (lastActiveId && savedSessions.value.some(s => s.id === lastActiveId)) {
    currentSessionId.value = lastActiveId
  } else if (savedSessions.value.length > 0) {
    currentSessionId.value = savedSessions.value[0].id
  } else {
    createNewSession()
  }

  scrollWindowToBottom()
})

watch(savedSessions, (newVal) => {
  localStorage.setItem('banana_workspace_sessions', JSON.stringify(newVal))
}, { deep: true })

watch(currentSessionId, (newId) => {
  if (newId) localStorage.setItem('banana_active_session_id', newId)
  scrollWindowToBottom()
})

const scrollWindowToBottom = async () => {
  await nextTick()
  if (chatWindow.value) {
    chatWindow.value.scrollTop = chatWindow.value.scrollHeight
  }
}

// --- WORKSPACE MEMORY MODIFIERS ---
const createNewSession = () => {
  const newId = 'session_' + Date.now()
  const newChat = {
    id: newId,
    title: 'New Chat Workspace',
    history: defaultHistory(),
    summary: '',
    updatedAt: Date.now()
  }
  savedSessions.value.unshift(newChat)
  currentSessionId.value = newId
  isSidebarOpen.value = false
}

const switchSession = (id) => {
  currentSessionId.value = id
  isSidebarOpen.value = false
}

const deleteSession = (id) => {
  const targetIdx = savedSessions.value.findIndex(s => s.id === id)
  if (targetIdx !== -1) {
    savedSessions.value.splice(targetIdx, 1)
    if (currentSessionId.value === id) {
      if (savedSessions.value.length > 0) {
        currentSessionId.value = savedSessions.value[0].id
      } else {
        createNewSession()
      }
    }
  }
}

// --- AGENT EXECUTION TRANSMISSION HANDLER ---
const submitMessage = async (textPrompt) => {
  const cleanInput = textPrompt?.trim()
  if (!cleanInput || isLoading.value) return

  if (!currentSessionId.value) createNewSession()
  
  const activeChat = savedSessions.value.find(s => s.id === currentSessionId.value)
  if (!activeChat) return

  activeChat.history.push({ role: 'user', content: cleanInput })
  activeChat.updatedAt = Date.now()
  isLoading.value = true
  await scrollWindowToBottom()

  // Auto-Naming Workspace Feature
  if (activeChat.title === 'New Chat Workspace' || activeChat.title.trim() === 'New Chat') {
    activeChat.title = cleanInput.length > 28 ? cleanInput.substring(0, 28) + '...' : cleanInput
  }

  currentAbortController = new AbortController()

  try {
    const responsePayload = await runAgent1Core({
      messages: activeChat.history,
      model: selectedModel.value,
      existingSummary: activeChat.summary
    })
    
    if (isLoading.value) {
      activeChat.history.push({ role: 'assistant', content: responsePayload.content })
      if (responsePayload.updatedSummary) activeChat.summary = responsePayload.updatedSummary
      
      // Determine Online Indicator based on engine provider response
      if (responsePayload.provider === 'ollama') {
        isServerOnline.value = true
      } else if (responsePayload.provider === 'groq' && selectedModel.value !== 'Instant-Nana') {
        isServerOnline.value = false 
      } else if (responsePayload.provider === 'error') {
        isServerOnline.value = false
      }
      activeChat.updatedAt = Date.now()
    }
  } catch (error) {
    if (isLoading.value) {
      isServerOnline.value = false
      activeChat.history.push({ 
        role: 'assistant', 
        content: '<thinking>Host connection timed out.</thinking>⚠️ HIGH DEMAND [COMPUTER NOT ON]: Offline or cloud queues blocked. Check local Ollama execution configurations.' 
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
    activeChat.history.push({ 
      role: 'assistant', 
      content: '<thinking>Signal sequence interrupted by user action.</thinking>_Generation stopped by Banana Admin._' 
    })
    activeChat.updatedAt = Date.now()
  }
}
</script>

<style>
/* Pure CSS overrides replacing deprecated @apply classes safely for production rendering */
.prose-custom {
  color: #d4d4d8; 
}
.prose-custom h1 { font-size: 1.35rem; font-weight: 700; color: #f4f4f5; margin-top: 1.25rem; margin-bottom: 0.5rem; }
.prose-custom h2 { font-size: 1.15rem; font-weight: 600; color: #f4f4f5; margin-top: 1rem; margin-bottom: 0.4rem; }
.prose-custom h3 { font-size: 1rem; font-weight: 600; color: #e4e4e7; margin-top: 0.75rem; margin-bottom: 0.25rem; }
.prose-custom p { margin-bottom: 0.75rem; line-height: 1.65; }
.prose-custom p:last-child { margin-bottom: 0; }
.prose-custom hr { border: 0; border-top: 1px solid #27272a; margin: 1.5rem 0; }
.prose-custom pre { background-color: #09090b; border: 1px solid #27272a; border-radius: 0.75rem; padding: 1rem; margin: 1rem 0; overflow-x: auto; font-family: ui-monospace, SFMono-Regular, monospace; font-size: 0.85rem; }
.prose-custom code { background-color: rgba(39, 39, 42, 0.4); padding: 0.15rem 0.35rem; border-radius: 0.25rem; font-family: ui-monospace, SFMono-Regular, monospace; font-size: 0.85rem; color: #f4f4f5; }
.prose-custom pre code { background-color: transparent; padding: 0; border-radius: 0; color: #e4e4e7; }
.prose-custom ul { list-style-type: disc; padding-left: 1.25rem; margin-bottom: 0.75rem; }
.prose-custom ol { list-style-type: decimal; padding-left: 1.25rem; margin-bottom: 0.75rem; }
.prose-custom li { margin-bottom: 0.25rem; }
.katex-display { margin: 0.5em 0 !important; }
.katex { font-size: 1.05em; text-rendering: auto; }
</style>