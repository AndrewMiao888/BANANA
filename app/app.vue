<template>
  <div 
    class="flex h-screen w-screen overflow-hidden bg-zinc-950 text-zinc-100 font-sans select-none"
    :style="{ height: 'calc(var(--vh, 1vh) * 100)' }"
  >
    
    <div 
      v-if="isSidebarOpen" 
      @click="isSidebarOpen = false" 
      class="md:hidden fixed inset-0 bg-black/70 z-40 backdrop-blur-sm transition-opacity duration-300"
    ></div>

    <aside 
      :class="[
        isSidebarOpen 
          ? 'w-64 translate-x-0 opacity-100 visual-sidebar-visible' 
          : 'w-0 -translate-x-full opacity-0 md:w-64 md:translate-x-0 md:opacity-100'
      ]" 
      class="bg-zinc-900 border-r border-zinc-850 flex flex-col h-full z-50 fixed md:relative transition-all duration-300 ease-in-out overflow-hidden"
    >
      <div class="p-4 flex justify-between items-center border-b border-zinc-850 min-w-[256px] shrink-0">
        <div class="flex items-center space-x-2">
          <span class="text-xl">🍌</span>
          <span class="font-bold text-xs tracking-widest text-yellow-400 font-mono">BANANA CORE</span>
        </div>
        <button 
          @click="isSidebarOpen = false" 
          class="md:hidden p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-100 transition active:scale-95 flex items-center justify-center border border-transparent hover:border-zinc-700"
          title="Close Menu Workspace"
        >
          <span class="text-sm">✕</span>
        </button>
      </div>

      <div class="p-3 space-y-2 min-w-[256px] border-b border-zinc-850/40 shrink-0">
        <button 
          @click="createNewSession"
          class="w-full bg-zinc-950 hover:bg-zinc-850 hover:text-yellow-400 border border-zinc-800 text-xs font-mono py-2.5 px-3 rounded-xl flex items-center justify-center space-x-2 transition-all duration-200 active:scale-[0.99]"
        >
          <span class="text-sm font-bold leading-none">+</span>
          <span>New Workspace Chat</span>
        </button>

        <div class="relative">
          <span class="absolute left-3 top-2.5 text-zinc-500 text-xs">🔍</span>
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
          <div class="flex flex-col min-w-0 pr-2 pointer-events-none">
            <span class="text-xs truncate font-medium">{{ session.title }}</span>
            <span class="text-[9px] text-zinc-500 mt-0.5">
              {{ new Date(session.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }}
            </span>
          </div>
          <button 
            @click.stop="deleteSession(session.id)"
            class="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/10 rounded text-zinc-500 hover:text-red-400 transition-all duration-150 active:scale-90"
            title="Delete Session"
          >
            ✕
          </button>
        </div>

        <div v-if="filteredSessions.length === 0" class="text-center py-8 text-xs text-zinc-600 font-mono">
          No matching chats.
        </div>
      </div>
    </aside>

    <div class="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden">
      
      <header class="h-14 border-b border-zinc-850 bg-zinc-900/40 backdrop-blur-md px-4 flex items-center justify-between z-30 select-none shrink-0 w-full">
        <div class="flex items-center space-x-3">
          <button 
            @click="isSidebarOpen = !isSidebarOpen" 
            class="p-2 hover:bg-zinc-800 active:bg-zinc-750 border border-zinc-800 hover:border-zinc-700 rounded-xl text-zinc-300 transition-all duration-150 flex items-center justify-center shadow-sm"
            title="Toggle Sidebar Matrix Menu"
          >
            <span class="text-base leading-none">☰</span>
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
          class="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin scrollbar-thumb-zinc-800 scroll-smooth pb-6 select-text"
        >
          <div 
            v-for="(msg, idx) in visibleMessages" 
            :key="idx"
            class="flex flex-col space-y-1.5"
            :class="[msg.role === 'user' ? 'items-end' : 'items-start']"
          >
            <span class="text-[10px] font-mono font-medium text-zinc-500 select-none uppercase tracking-wider px-1">
              {{ msg.role === 'user' ? 'Operator' : 'Banana Core' }}
            </span>

            <div 
              class="px-4 py-3 rounded-2xl shadow-md text-sm leading-relaxed max-w-[85%] border"
              :class="[
                msg.role === 'user' 
                  ? 'bg-zinc-800 border-zinc-700/50 text-zinc-100 rounded-tr-sm' 
                  : msg.content.includes('Connection Error:')
                    ? 'bg-red-500/10 border-red-500/20 text-red-400 rounded-tl-sm font-mono'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-300 rounded-tl-sm'
              ]"
            >
              <div 
                class="prose-custom w-full break-words" 
                v-html="renderRichPayload(msg.content)"
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

// --- WORKSPACE APPLICATION SYSTEM VARIABLES ---
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
  { role: 'assistant', content: 'System initialized. Welcome to BANANA Core control panel.' }
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

// Equation Parser and Rich Text Engine System Loop
const renderRichPayload = (rawContent) => {
  if (!rawContent) return ''
  let processed = rawContent
  processed = processed.replace(/\$\$(.*?)\$\$/gs, (m, f) => {
    try { return `<div class="katex-block my-4 overflow-x-auto py-1">${katex.renderToString(f, { displayMode: true, throwOnError: false })}</div>` } catch { return m }
  })
  processed = processed.replace(/\$(.*?)\$/g, (m, f) => {
    try { return katex.renderToString(f, { displayMode: false, throwOnError: false }) } catch { return m }
  })
  try { return marked.parse(processed) } catch { return processed }
}

// Session Matching Logic Filtering Indexes
const filteredSessions = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return savedSessions.value
  return savedSessions.value.filter(s => 
    s.title.toLowerCase().includes(query) || 
    s.history.some(m => m.content.toLowerCase().includes(query))
  )
})

const setSelectedModel = (modelId) => { selectedModel.value = modelId }

// Mounted System Initialization Hook Parameters
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

  setVhProperty()
  window.addEventListener('resize', setVhProperty)
  scrollWindowToBottom()
})

const setVhProperty = () => {
  document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`)
}

watch(savedSessions, (newVal) => {
  localStorage.setItem('banana_workspace_sessions', JSON.stringify(newVal))
}, { deep: true })

watch(currentSessionId, (newId) => {
  if (newId) localStorage.setItem('banana_active_session_id', newId)
  scrollWindowToBottom()
})

const scrollWindowToBottom = async () => {
  await nextTick()
  if (chatWindow.value) chatWindow.value.scrollTop = chatWindow.value.scrollHeight
}

// Active Multi-Chat Array Controller Mutation
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

// Conversation Payload Formatter Dispatcher Pipeline
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

  // Dynamic Auto-Naming Summary Sequencer
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
      
      if (responsePayload.provider === 'ollama') {
        isServerOnline.value = true
      } else if (responsePayload.provider === 'groq' && selectedModel.value !== 'Instant-Nana') {
        isServerOnline.value = false 
      }
      activeChat.updatedAt = Date.now()
    }
  } catch (error) {
    if (isLoading.value) {
      isServerOnline.value = false
      activeChat.history.push({ 
        role: 'assistant', 
        content: 'Connection Error: BANANA Core systems are unreachable. Please check if your computer server is online or your account is valid.' 
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
    activeChat.history.push({ role: 'assistant', content: '_Generation stopped by Banana Admin._' })
    activeChat.updatedAt = Date.now()
  }
}
</script>

<style>
/* 🎨 CSS Syntax Class Matrix Replacement overrides */
.prose-custom {
  color: #d4d4d8; 
}
.prose-custom h1 { font-size: 1.35rem; font-weight: 700; color: #f4f4f5; margin-top: 1.25rem; margin-bottom: 0.5rem; }
.prose-custom h2 { font-size: 1.15rem; font-weight: 600; color: #f4f4f5; margin-top: 1rem; margin-bottom: 0.4rem; }
.prose-custom h3 { font-size: 1rem; font-weight: 600; color: #e4e4e7; margin-top: 0.75rem; margin-bottom: 0.25rem; }
.prose-custom p { margin-bottom: 0.75rem; line-height: 1.6; }
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

/* Desktop scaling grid correction layouts */
@media (min-width: 768px) {
  .visual-sidebar-visible {
    min-width: 256px !important;
  }
}

.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #27272a; border-radius: 99px; }
</style>