<template>
  <div 
    class="flex h-screen w-screen overflow-hidden bg-zinc-950 text-zinc-100 font-sans"
    :style="{ height: 'calc(var(--vh, 1vh) * 100)' }"
  >
    
    <div 
      v-if="isSidebarOpen" 
      @click="isSidebarOpen = false" 
      class="md:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm animate-fade-in"
    ></div>

    <aside 
      :class="[isSidebarOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full md:w-64 md:translate-x-0']" 
      class="bg-zinc-900 border-r border-zinc-850 flex flex-col h-full z-50 fixed md:relative transition-all duration-300 ease-in-out overflow-hidden"
    >
      <div class="p-4 flex justify-between items-center border-b border-zinc-850 min-w-[256px]">
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
          <span class="text-sm font-bold">+</span>
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

      <div class="flex-1 p-3 overflow-y-auto space-y-1 min-w-[256px] custom-scrollbar">
        <div class="text-[10px] font-bold text-zinc-500 uppercase px-2 tracking-widest mb-2 flex justify-between items-center">
          <span>Active Sessions</span>
          <span v-if="searchQuery" class="text-[9px] text-yellow-500 font-mono normal-case">
            {{ filteredSessions.length }} found
          </span>
        </div>
        
        <div 
          v-for="(session, idx) in filteredSessions" 
          :key="session.originalIndex"
          @click="switchSession(session.originalIndex)"
          class="group w-full text-left p-2.5 rounded-xl transition flex items-center justify-between cursor-pointer border"
          :class="[
            currentSessionIndex === session.originalIndex 
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
            @click.stop="deleteSession(session.originalIndex)"
            class="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/10 rounded text-zinc-500 hover:text-red-400 transition-all duration-150"
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

    <div class="flex-1 flex flex-col min-w-0 h-full relative">
      
      <header class="h-14 border-b border-zinc-850 bg-zinc-900/40 backdrop-blur-md px-4 flex items-center justify-between z-30 select-none">
        <div class="flex items-center space-x-3">
          <button 
            @click="isSidebarOpen = !isSidebarOpen" 
            class="p-2 hover:bg-zinc-850 rounded-lg text-zinc-400 transition"
            title="Toggle Workspace Sidebar"
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
          class="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin scrollbar-thumb-zinc-800 scroll-smooth pb-6"
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

        <div class="mt-auto pt-2 bg-gradient-to-t from-zinc-950 via-zinc-950 to-transparent">
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
const currentSummary = ref('')
const isSidebarOpen = ref(false)
const isServerOnline = ref(true) 
const selectedModel = ref('Instant-Nana')
const searchQuery = ref('') // Real-time chat filter state query
let currentAbortController = null

const chatHistory = ref([
  { role: 'assistant', content: 'System initialized. Welcome to BANANA Core control panel.' }
])
const savedSessions = ref([])
const currentSessionIndex = ref(null)

// Ensure safety checks are disabled so inline links render smoothly
marked.setOptions({
  gfm: true,
  breaks: true,
});

// =====================================================
// ⚡ PARSING PIPELINE: MATH (KATEX) & MARKDOWN RENDERING
// =====================================================
const renderRichPayload = (rawContent) => {
  if (!rawContent) return ''

  let processed = rawContent

  // 1. Render Block Math equations ($$ formula $$)
  processed = processed.replace(/\$\$(.*?)\$\$/gs, (match, formula) => {
    try {
      return `<div class="katex-block my-4 overflow-x-auto py-1">${katex.renderToString(formula, { displayMode: true, throwOnError: false })}</div>`
    } catch {
      return match
    }
  })

  // 2. Render Inline Math equations ($ formula $)
  processed = processed.replace(/\$(.*?)\$/g, (match, formula) => {
    try {
      return katex.renderToString(formula, { displayMode: false, throwOnError: false })
    } catch {
      return match
    }
  })

  // 3. Process complete Markdown Structure using Marked.js
  try {
    return marked.parse(processed)
  } catch (err) {
    console.error("Renderer Failure:", err)
    return processed
  }
}

// Hide system instructional tags from main user viewport
const visibleMessages = computed(() => {
  return chatHistory.value.filter(msg => msg.role !== 'system')
})

// =====================================================
// 🔍 DYNAMIC CHAT SEARCH FILTER ENGINE
// =====================================================
const filteredSessions = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  // Map index tracking so we switch to the correct absolute item when filtered
  const mapped = savedSessions.value.map((session, index) => ({
    ...session,
    originalIndex: index
  }))
  
  if (!query) return mapped

  return mapped.filter(session => {
    const titleMatch = session.title?.toLowerCase().includes(query)
    const historyMatch = session.history?.some(msg => msg.content?.toLowerCase().includes(query))
    return titleMatch || historyMatch
  })
})

const setSelectedModel = (modelId) => {
  selectedModel.value = modelId
}

// =====================================================
// 💾 DYNAMIC LOCAL STORAGE & TELEMETRY INITIALIZERS
// =====================================================
onMounted(() => {
  const storedSessions = localStorage.getItem('banana_saved_sessions')
  if (storedSessions) savedSessions.value = JSON.parse(storedSessions)

  const activeChat = localStorage.getItem('banana_chat_history')
  if (activeChat) chatHistory.value = JSON.parse(activeChat)
  
  const storedIdx = localStorage.getItem('banana_current_session_index')
  if (storedIdx !== null) currentSessionIndex.value = JSON.parse(storedIdx)

  const storedSummary = localStorage.getItem('banana_current_summary')
  if (storedSummary) currentSummary.value = storedSummary

  setVhProperty()
  window.addEventListener('resize', setVhProperty)

  scrollWindowToBottom()
})

const setVhProperty = () => {
  const vh = window.innerHeight * 0.01
  document.documentElement.style.setProperty('--vh', `${vh}px`)
}

// State watcher pipelines to guarantee storage integrity
watch(chatHistory, (newHistory) => {
  localStorage.setItem('banana_chat_history', JSON.stringify(newHistory))
}, { deep: true })

watch(savedSessions, (newSessions) => {
  localStorage.setItem('banana_saved_sessions', JSON.stringify(newSessions))
}, { deep: true })

watch(currentSessionIndex, (newIdx) => {
  localStorage.setItem('banana_current_session_index', JSON.stringify(newIdx))
})

watch(currentSummary, (newSummary) => {
  localStorage.setItem('banana_current_summary', newSummary)
})

const scrollWindowToBottom = async () => {
  await nextTick()
  if (chatWindow.value) {
    chatWindow.value.scrollTop = chatWindow.value.scrollHeight
  }
}

// =====================================================
// 🤖 CORE MSG DISPATCHER & CONNECTION WATCHDOG
// =====================================================
const submitMessage = async (textPrompt) => {
  const cleanInput = textPrompt?.trim()
  if (!cleanInput || isLoading.value) return

  chatHistory.value.push({ role: 'user', content: cleanInput })
  isLoading.value = true
  await scrollWindowToBottom()

  currentAbortController = new AbortController()

  try {
    const finalAiReply = await runAgent1Core({
      messages: chatHistory.value,
      model: selectedModel.value,
      existingSummary: currentSummary.value
    })
    
    if (isLoading.value) {
      chatHistory.value.push({ role: 'assistant', content: finalAiReply.content })

      if (finalAiReply.updatedSummary) {
        currentSummary.value = finalAiReply.updatedSummary
      }
      
      // Sync telemetry signal indicator
      if (finalAiReply.provider === 'ollama') {
        isServerOnline.value = true
      } else if (finalAiReply.provider === 'groq' && selectedModel.value !== 'Instant-Nana') {
        isServerOnline.value = false 
      }

      updateSidebarTracking()
    }
  } catch (error) {
    if (isLoading.value) {
      isServerOnline.value = false
      chatHistory.value.push({ 
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
  chatHistory.value.push({ role: 'assistant', content: '_Generation stopped by Banana Admin._' })
  updateSidebarTracking()
}

// =====================================================
// 📂 WORKSPACE SEEDING & MANAGEMENT
// =====================================================
const createNewSession = () => {
  chatHistory.value = [{ role: 'assistant', content: 'System initialized. Welcome to BANANA Core control panel.' }]
  currentSummary.value = ''
  currentSessionIndex.value = null
  isSidebarOpen.value = false
}

const switchSession = (idx) => {
  const session = savedSessions.value[idx]
  if (session) {
    chatHistory.value = [...session.history]
    currentSummary.value = session.summary
    currentSessionIndex.value = idx
  }
  isSidebarOpen.value = false
  scrollWindowToBottom()
}

const deleteSession = (idx) => {
  savedSessions.value.splice(idx, 1)
  if (currentSessionIndex.value === idx) {
    createNewSession()
  } else if (currentSessionIndex.value > idx) {
    currentSessionIndex.value--
  }
}

const updateSidebarTracking = () => {
  const firstUserMsg = chatHistory.value.find(msg => msg.role === 'user')?.content || 'New Chat'
  const cleanTitle = firstUserMsg.length > 25 ? firstUserMsg.substring(0, 25) + '...' : firstUserMsg

  if (currentSessionIndex.value !== null && savedSessions.value[currentSessionIndex.value]) {
    savedSessions.value[currentSessionIndex.value].history = [...chatHistory.value]
    savedSessions.value[currentSessionIndex.value].summary = currentSummary.value
    savedSessions.value[currentSessionIndex.value].updatedAt = Date.now()
  } else {
    const newChatSession = {
      title: cleanTitle,
      history: [...chatHistory.value],
      summary: currentSummary.value,
      updatedAt: Date.now()
    }
    savedSessions.value.unshift(newChatSession)
    currentSessionIndex.value = 0
  }
}
</script>

<style>
/* =====================================================
🎨 MARKDOWN RICH PARSING DESIGN SPECIFICATIONS
===================================================== */
.prose-custom {
  color: #d4d4d8; /* The exact hex value for Tailwind's text-zinc-300 */
}
/* Base Headings Layout Formatting */
.prose-custom h1 {
  font-size: 1.35rem;
  font-weight: 700;
  color: #f4f4f5; /* zinc-100 */
  margin-top: 1.25rem;
  margin-bottom: 0.5rem;
}
.prose-custom h2 {
  font-size: 1.15rem;
  font-weight: 600;
  color: #f4f4f5;
  margin-top: 1rem;
  margin-bottom: 0.4rem;
}
.prose-custom h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #e4e4e7; /* zinc-200 */
  margin-top: 0.75rem;
  margin-bottom: 0.25rem;
}

/* Content Spacers */
.prose-custom p {
  margin-bottom: 0.75rem;
  line-height: 1.6;
}
.prose-custom p:last-child {
  margin-bottom: 0;
}

/* Horizontal Partition (<hr>) Rule Styles */
.prose-custom hr {
  border: 0;
  border-top: 1px solid #27272a; /* zinc-800 */
  margin: 1.5rem 0;
}

/* Code Container Boxes */
.prose-custom pre {
  background-color: #09090b; /* zinc-950 */
  border: 1px solid #27272a; /* zinc-800 */
  border-radius: 0.75rem;
  padding: 1rem;
  margin: 1rem 0;
  overflow-x: auto;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.85rem;
}
.prose-custom code {
  background-color: rgba(39, 39, 42, 0.4); /* zinc-800/40 */
  padding: 0.15rem 0.35rem;
  border-radius: 0.25rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.85rem;
  color: #f4f4f5;
}
.prose-custom pre code {
  background-color: transparent;
  padding: 0;
  border-radius: 0;
  color: #e4e4e7;
}

/* Lists Rendering */
.prose-custom ul {
  list-style-type: disc;
  padding-left: 1.25rem;
  margin-bottom: 0.75rem;
}
.prose-custom ol {
  list-style-type: decimal;
  padding-left: 1.25rem;
  margin-bottom: 0.75rem;
}
.prose-custom li {
  margin-bottom: 0.25rem;
}

/* KaTeX Adjustment Metrics */
.katex-display {
  margin: 0.5em 0 !important;
}
.katex {
  font-size: 1.05em;
  text-rendering: auto;
}

/* custom slim track scrollbars */
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #27272a;
  border-radius: 99px;
}
</style>