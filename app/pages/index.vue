<template>
  <div class="flex h-[100dvh] w-full bg-zinc-950 text-zinc-200 font-sans overflow-hidden selection:bg-yellow-500/30 selection:text-yellow-200 relative">
    <div 
      v-if="isSidebarVisible" 
      @click="isSidebarVisible = false"
      class="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden transition-opacity"
    ></div>

    <aside 
      :class="[
        'bg-zinc-900/95 border-r border-zinc-800/80 flex flex-col h-full shrink-0 transition-all duration-300 ease-in-out z-40 fixed md:relative',
        isSidebarVisible ? 'w-64 translate-x-0 opacity-100' : '-translate-x-full md:translate-x-0 md:w-0 opacity-0 border-r-0'
      ]"
    >
      <div class="p-3.5 flex items-center gap-2 border-b border-zinc-800/40 shrink-0">
        <button 
          @click="startNewChatSession"
          class="flex-1 py-2 px-4 bg-zinc-800 hover:bg-zinc-700/80 text-zinc-300 hover:text-zinc-100 rounded-lg font-mono text-xs font-medium border border-zinc-700/60 transition-all duration-150 flex items-center justify-start gap-3 shadow-sm active:scale-[0.99]"
        >
          <span class="text-base text-yellow-400 font-bold">+</span>
          <span>New chat</span>
        </button>
        <button 
          @click="isSidebarVisible = false"
          class="p-2 bg-zinc-800 hover:bg-zinc-700/80 text-zinc-400 hover:text-zinc-200 border border-zinc-700/60 rounded-lg text-xs font-mono transition-all"
          title="Collapse Sidebar"
        >
          ◀
        </button>
      </div>

      <div class="flex-1 overflow-y-auto px-2 space-y-0.5 custom-scrollbar py-2">
        <div class="px-3 py-1.5 text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest">
          Recents
        </div>

        <div v-if="chatHistoryList.length === 0" class="px-3 py-4 text-xs text-zinc-600 italic font-mono">
          No chat sessions found.
        </div>
        
        <div 
          v-for="session in chatHistoryList" 
          :key="session.id"
          @click="switchActiveSession(session.id)"
          :class="[
            'group relative px-3 py-2.5 rounded-lg text-xs font-mono cursor-pointer transition-all duration-150 flex items-center justify-between',
            activeSessionId === session.id 
              ? 'bg-zinc-800 text-yellow-400 font-semibold' 
              : 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200'
          ]"
        >
          <div class="flex items-center gap-2.5 truncate pr-5">
            <span class="text-zinc-500 group-hover:text-yellow-400/80 transition-colors">💬</span>
            <span class="truncate">{{ session.title }}</span>
          </div>

          <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-100">
  <button 
    @click.stop="renameSession(session.id)"
    class="text-zinc-500 hover:text-yellow-400 p-1 text-[11px] transition-colors"
    title="Rename chat"
  >
    ✏️
  </button>
  <button 
    @click.stop="purgeSession(session.id)"
    class="text-zinc-600 hover:text-red-400 p-1 text-[11px] transition-colors"
    title="Delete chat"
  >
    ✕
  </button>
</div>
        </div>
      </div>

      <div class="p-3 border-t border-zinc-800/80 bg-zinc-900/40 flex items-center justify-between shrink-0">
        <div class="flex items-center gap-2.5 truncate">
          <div class="w-7 h-7 rounded-full bg-yellow-500 text-zinc-950 font-mono font-bold text-xs flex items-center justify-center shadow-inner shrink-0">
            🍌
          </div>
          <span class="text-xs font-mono font-semibold text-zinc-300 truncate">Andrew / BANANA</span>
        </div>
        <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow shadow-emerald-500/50"></span>
      </div>
    </aside>

    <main class="flex-1 flex flex-col h-full w-full bg-zinc-950 relative overflow-hidden min-w-0">
      
      <header class="h-14 border-b border-zinc-800/60 px-4 md:px-6 flex items-center justify-between bg-zinc-950/80 backdrop-blur-md z-20 shrink-0">        <div class="flex items-center gap-3 font-mono text-[11px] truncate">
          <button 
            v-if="!isSidebarVisible"
            @click="isSidebarVisible = true"
            class="mr-1 px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-yellow-400 rounded transition-all font-bold text-xs"
            title="Expand Sidebar"
          >
            ▶
          </button>
          <span class="text-zinc-600 hidden sm:inline">PIPELINE:</span>
          <span class="px-2 py-0.5 bg-zinc-900 border border-zinc-800 text-yellow-400 font-semibold rounded truncate max-w-[150px] sm:max-w-none">
            {{ activeRoutingSource || 'Idle Waiting State' }}
          </span>
        </div>

        <div class="flex items-center gap-2 font-mono text-[11px] shrink-0">
          <span class="text-zinc-500 hidden sm:inline">ENGINE:</span>
          <div class="relative flex items-center">
          <select 
            v-model="selectedModelId"
            class="appearance-none bg-zinc-900 border border-zinc-800 text-zinc-300 rounded pl-2.5 pr-7 py-1 focus:outline-none focus:border-yellow-500/40 cursor-pointer text-[11px] shadow-sm"
          >
            <option v-for="model in AVAILABLE_MODELS" :key="model.id" :value="model.id" class="bg-zinc-900 text-zinc-200">
              {{ model.name }}
            </option>
          </select>
          <span class="pointer-events-none absolute right-2 text-[9px] text-zinc-500">▼</span>
        </div>
        </div>
      </header>

      <div 
        ref="feedScrollContainer"
        @scroll="handleUserScrollDetection"
        @wheel="handleUserScrollDetection"
        @touchmove="handleUserScrollDetection"
        class="flex-1 overflow-y-auto px-4 md:px-6 py-6 space-y-6 custom-scrollbar bg-zinc-950 min-h-0"
      >
        <div v-if="messages.length === 0" class="h-full flex flex-col items-center justify-center max-w-xl mx-auto text-center space-y-3 pb-12">
          <div class="text-4xl animate-bounce duration-1000">🍌</div>
          <h1 class="text-xl font-mono font-bold tracking-tight text-yellow-400">BANANA Core Orchestrator</h1>
          <p class="text-xs text-zinc-500 font-mono leading-relaxed px-4">
            Ready to receive system operational parameters. Prepend requests with <span class="text-yellow-500/80">/search</span> to directly trigger automated real-time web telemetry routines.
          </p>
        </div>

        <div 
          v-for="(msg, index) in messages" 
          :key="index"
          :class="[
            'max-w-3xl mx-auto flex gap-3.5 p-1 transition-all duration-150',
            msg.role === 'user' ? 'justify-end' : 'justify-start'
          ]"
        >
          <div v-if="msg.role === 'assistant'" class="w-6 h-6 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-xs flex items-center justify-center shrink-0 mt-0.5">
            🍌
          </div>

          <div class="flex flex-col gap-1 max-w-[88%] sm:max-w-[82%] min-w-0">
            <div class="font-mono text-[10px] uppercase tracking-wider text-zinc-600 flex items-center gap-2">
              <span>{{ msg.role === 'user' ? 'Client Directive' : 'BANANA Intelligence response' }}</span>
              <span v-if="msg.source" class="text-[9px] px-1 bg-zinc-900 border border-zinc-800 rounded text-zinc-500 lowercase">
                ({{ msg.source }})
              </span>
            </div>
            
            <div 
              :class="[
                'text-sm leading-relaxed max-w-none w-full overflow-hidden break-words',
                msg.role === 'user' 
                  ? 'bg-zinc-900 text-zinc-200 border border-zinc-800 px-4 py-2.5 rounded-2xl rounded-tr-none whitespace-pre-wrap [word-break:break-word]' 
                  : 'text-zinc-300 pt-0.5 prose prose-invert prose-zinc prose-sm max-w-none [word-break:break-word] \
                     prose-headings:text-yellow-400 prose-headings:font-mono prose-headings:my-2 \
                     prose-table:border prose-table:border-zinc-800 prose-th:bg-zinc-900 prose-th:p-2 prose-td:p-2 prose-td:border-b prose-td:border-zinc-800 \
                     prose-code:text-yellow-500 prose-code:bg-zinc-900 prose-code:px-1 prose-code:py-0.5 prose-code:rounded \
                     prose-blockquote:border-l-2 prose-blockquote:border-yellow-500 prose-blockquote:pl-4 prose-blockquote:italic'
              ]"
            >
              <div v-if="msg.role === 'user'">{{ msg.content }}</div>
              <div v-else v-html="renderMarkdownMarkup(msg.content)"></div>
            </div>
          </div>
        </div>

        <div v-if="isProcessingPipeline" class="max-w-3xl mx-auto flex gap-3.5 p-1">
          <div class="w-6 h-6 rounded-full bg-yellow-500/10 border border-dashed border-yellow-500/40 flex items-center justify-center shrink-0 animate-spin text-[10px]">
            ⚙️
          </div>
          <div class="text-xs text-zinc-500 font-mono italic flex items-center gap-2 animate-pulse pt-0.5">
            Streaming network pipeline computation matrices...
          </div>
        </div>
      </div>

      <footer class="p-3 md:p-4 border-t border-zinc-900/80 bg-zinc-950 shrink-0 z-20 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <form @submit.prevent="executeTransmissionDirective" class="max-w-3xl mx-auto relative flex items-end bg-zinc-900 border border-zinc-800 focus-within:border-yellow-500/40 rounded-2xl p-1.5 transition-all shadow-lg">
          <textarea 
            ref="inputTextarea"
            v-model="inputFieldPrompt"
            @keydown="handleKeydown"
            @input="adjustTextareaHeight"
            rows="1"
            placeholder="Ask BANANA AI anything... (Shift + Enter for new line)"
            :disabled="isProcessingPipeline"
            class="w-full bg-transparent text-zinc-100 text-sm placeholder-zinc-600 focus:outline-none resize-none px-3 py-2 custom-scrollbar max-h-48 overflow-y-auto disabled:opacity-40 font-sans leading-relaxed whitespace-pre-wrap [word-break:break-word]"
          ></textarea>
          <button 
            type="submit"
            :disabled="isProcessingPipeline || !inputFieldPrompt.trim()"
            class="ml-2 px-4 py-2 bg-yellow-500 text-zinc-950 font-mono font-bold rounded-xl text-xs tracking-wider hover:bg-yellow-400 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all shrink-0 mb-0.5"
          >
            EXECUTE
          </button>
        </form>
      </footer>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { AVAILABLE_MODELS } from '~~/src/models'
import MarkdownIt from 'markdown-it'
import markdownItKatex from 'markdown-it-katex'

// Custom renderer to format code blocks with language labels and copy buttons
const mdProcessor = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true
}).use(markdownItKatex)

// Override fence renderer for code block containers
// Override fence renderer for code block containers
mdProcessor.renderer.rules.fence = (tokens, idx) => {
  const token = tokens[idx]
  const rawCode = token.content
  const lang = token.info.trim() || 'PlainText'
  
  // Format display label
  const formattedLang = lang.toUpperCase()

  // Safe base64 encoding to prevent quotes, backticks, or newlines from breaking the inline onclick handler
  const base64Code = btoa(unescape(encodeURIComponent(rawCode)))
  
  // Escape HTML entities to safely render inside <code> tags
  const escapedCode = rawCode
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  return `
    <div class="my-4 rounded-xl border border-zinc-800 bg-zinc-900/90 overflow-hidden text-xs font-mono shadow-md">
      <div class="flex items-center justify-between bg-zinc-900 px-4 py-2 border-b border-zinc-800/80 text-zinc-400 select-none">
        <span class="font-bold text-yellow-400/90 text-[11px] tracking-wider">${formattedLang}</span>
        <button 
          onclick="window.copyCodeToClipboard(event, '${base64Code}')"
          class="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[10px] font-sans font-medium transition-all active:scale-95 cursor-pointer border border-zinc-700/50"
        >
          COPY
        </button>
      </div>
      <pre class="p-4 overflow-x-auto text-zinc-200 leading-relaxed custom-scrollbar"><code class="language-${lang}">${escapedCode}</code></pre>
    </div>
  `
}

function renderMarkdownMarkup(rawText) {
  if (!rawText) return ''
  let preparedString = String(rawText).replace(/%@FRAC\|/g, '\\frac')
  return mdProcessor.render(preparedString)
}

// ─── STATE ARRAYS AND UI VALUES ───────────────────────────────────────
const isSidebarVisible = ref(true)
const chatHistoryList = ref([])
const activeSessionId = ref('')
const messages = ref([])
const inputFieldPrompt = ref('')
const selectedModelId = ref(AVAILABLE_MODELS[0]?.id || '')
const isProcessingPipeline = ref(false)
const activeRoutingSource = ref('')
const feedScrollContainer = ref(null)
const inputTextarea = ref(null) // Added for textarea auto-height

// Dynamic textarea autosize (expands up to max-h-36 / 144px, then scrolls)
function adjustTextareaHeight() {
  nextTick(() => {
    const el = inputTextarea.value
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 144)}px`
  })
}

// Enter sends message, Shift + Enter inserts new line
function handleKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    executeTransmissionDirective()
  }
}

// 🔍 SMART SCROLL SYSTEM VALS
const userHasScrolledUpManually = ref(false)

// ─── USER INTERACTION ACCIDENTAL SCROLL PROTECTOR ─────────────────────
function handleUserScrollDetection() {
  const container = feedScrollContainer.value
  if (!container) return

  const bottomThresholdPadding = 45
  const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight
  
  // If the user's focus is higher up, turn off the script's snap auto-scrolling
  userHasScrolledUpManually.value = distanceFromBottom > bottomThresholdPadding
}

async function triggerSystemEnforcedAutoScroll(force = false) {
  await nextTick()
  const container = feedScrollContainer.value
  if (!container) return

  // Only scroll down if the user isn't reading old logs, OR if a fresh prompt was just sent
  if (!userHasScrolledUpManually.value || force) {
    container.scrollTo({
      top: container.scrollHeight,
      behavior: 'smooth'
    })
  }
}

// ─── CACHE LOCAL STORAGE PIPELINES ────────────────────────────────────
function syncSessionsToLocalStorage() {
  localStorage.setItem('banana_core_sessions', JSON.stringify(chatHistoryList.value))
}

function loadSessionsFromLocalStorage() {
  const data = localStorage.getItem('banana_core_sessions')
  if (data) {
    try {
      chatHistoryList.value = JSON.parse(data)
      if (chatHistoryList.value.length > 0) {
        switchActiveSession(chatHistoryList.value[0].id)
      } else {
        startNewChatSession()
      }
    } catch (e) {
      startNewChatSession()
    }
  } else {
    startNewChatSession()
  }
}

// ─── NODE LIFECYCLE MANAGERS ──────────────────────────────────────────
function startNewChatSession() {
  const targetId = `node_${Date.now()}`
  const initialNewSession = {
    id: targetId,
    title: 'New chat',
    messages: []
  }
  
  chatHistoryList.value.unshift(initialNewSession)
  activeSessionId.value = targetId
  messages.value = []
  activeRoutingSource.value = 'Initialized Clean Vector'
  userHasScrolledUpManually.value = false
  syncSessionsToLocalStorage()
}

function switchActiveSession(id) {
  const matchedNode = chatHistoryList.value.find(s => s.id === id)
  if (matchedNode) {
    activeSessionId.value = id
    messages.value = [...matchedNode.messages]
    activeRoutingSource.value = messages.value.length > 0 ? 'Restored Frame Data' : 'Clean Vector State'
    userHasScrolledUpManually.value = false
    triggerSystemEnforcedAutoScroll(true) // Force scroll to bottom on switch
  }
}

function purgeSession(id) {
  chatHistoryList.value = chatHistoryList.value.filter(s => s.id !== id)
  syncSessionsToLocalStorage()
  
  if (activeSessionId.value === id) {
    if (chatHistoryList.value.length > 0) {
      switchActiveSession(chatHistoryList.value[0].id)
    } else {
      startNewChatSession()
    }
  }
}

async function triggerBackgroundChatNamingSummary(userPromptText, responseText) {
  const currentSession = chatHistoryList.value.find(s => s.id === activeSessionId.value)
  if (!currentSession || currentSession.title !== 'New chat') return

  try {
    const summaryPayload = [
      { role: 'user', content: `Context content to condense:\nUser: ${userPromptText}\nAI: ${responseText}\n\nGENERATE_SHORT_TITLE_SUMMARY_DIRECTIVE` }
    ]

    const summaryResponse = await $fetch('/api/chat', {
      method: 'POST',
      body: {
        messages: summaryPayload,
        selectedModelId: selectedModelId.value,
        summaryContext: 'Title generation sub-routing pass.'
      }
    })

    const generatedTitle = summaryResponse?.message?.content?.replace(/["'‘“.]/g, '').trim()
    if (generatedTitle && generatedTitle.length > 2 && !generatedTitle.includes('⚠️')) {
      currentSession.title = generatedTitle.length > 26 ? generatedTitle.slice(0, 26) + '...' : generatedTitle
      syncSessionsToLocalStorage()
    }
  } catch (err) {
    console.warn('Background core title generation fallback sequence handled.', err)
    const fallbackTitle = userPromptText.replace(/\/search\s*/i, '').trim()
    currentSession.title = fallbackTitle.length > 24 ? fallbackTitle.slice(0, 24) + '...' : fallbackTitle
    syncSessionsToLocalStorage()
  }
}

// ─── DIRECTIVE EXECUTION LAYER ────────────────────────────────────────
async function executeTransmissionDirective() {
  const currentPayload = inputFieldPrompt.value.trim()
  if (!currentPayload || isProcessingPipeline.value) return

  const isFirstMessage = messages.value.length === 0
  let finalAiResponseContent = ''

  // 1. Push user prompt to messages array
  messages.value.push({ role: 'user', content: currentPayload })
  
  // 2. Clear input and immediately reset textarea height back to 1 row
  inputFieldPrompt.value = ''
  adjustTextareaHeight()
  
  isProcessingPipeline.value = true
  
  // 3. Reset scroll anchor so screen auto-scrolls down for the new response
  userHasScrolledUpManually.value = false
  await triggerSystemEnforcedAutoScroll(true)

  try {
    const calculatedContext = messages.value[0]?.content 
      ? `Topic focuses around: ${messages.value[0].content.slice(0, 40)}` 
      : ''

    const apiResponse = await $fetch('/api/chat', {
      method: 'POST',
      body: {
        messages: messages.value,
        selectedModelId: selectedModelId.value,
        summaryContext: calculatedContext
      }
    })

    if (apiResponse && apiResponse.message) {
      finalAiResponseContent = apiResponse.message.content || 'Blank packet allocated.'
      messages.value.push({
        role: 'assistant',
        content: finalAiResponseContent,
        source: apiResponse.source || 'Cloud Inference Network'
      })
      activeRoutingSource.value = apiResponse.source || 'Completed Routing Frame'
    } else {
      throw new Error('API down-channel schema error encountered.')
    }

  } catch (err) {
    messages.value.push({
      role: 'assistant',
      content: `⚠️ **Pipeline Terminal Failure**: Cloud matrix route interrupted.\n\n* **Diagnostics**: ${err.message || 'Serverless deployment frame drop'}`,
      source: 'Internal Error Diagnostic Layer'
    })
    activeRoutingSource.value = 'Fault Safe Mode Redirect'
  } finally {
    isProcessingPipeline.value = false
    
    const targetSession = chatHistoryList.value.find(s => s.id === activeSessionId.value)
    if (targetSession) {
      targetSession.messages = [...messages.value]
    }
    
    syncSessionsToLocalStorage()
    await triggerSystemEnforcedAutoScroll()

    // Triggers the asynchronous AI title generation call if it's the first message exchange
    if (isFirstMessage && finalAiResponseContent) {
      triggerBackgroundChatNamingSummary(currentPayload, finalAiResponseContent)
    }
  }
}

// Core initializer layout lifecycle binding hook
onMounted(() => {
  loadSessionsFromLocalStorage()
})

function copyCodeToClipboard(event, base64Text) {
  const btn = event.currentTarget
  if (!btn || !base64Text) return

  try {
    // Decode base64 text safely back into original code block string
    const decodedText = decodeURIComponent(escape(atob(base64Text)))

    navigator.clipboard.writeText(decodedText).then(() => {
      const originalText = btn.innerText
      btn.innerText = 'COPIED!'
      btn.classList.add('text-yellow-400', 'border-yellow-500/50')
      
      setTimeout(() => {
        btn.innerText = originalText
        btn.classList.remove('text-yellow-400', 'border-yellow-500/50')
      }, 2000)
    }).catch(err => {
      console.error('Failed to copy text using Clipboard API:', err)
    })
  } catch (err) {
    console.error('Failed to decode base64 code block text:', err)
  }
}

// Attach to global window object so rendered markdown inline onclick handlers can trigger it
// Attach it globally so the markdown-it rendered HTML can access it

if (import.meta.client) {
  window.copyCodeToClipboard = copyCodeToClipboard
}

function renameSession(id) {
  const session = chatHistoryList.value.find(s => s.id === id)
  if (!session) return

  const newTitle = prompt('Enter new chat title:', session.title)
  if (newTitle && newTitle.trim()) {
    session.title = newTitle.trim()
    syncSessionsToLocalStorage()
  }
}


</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #27272a;
  border-radius: 8px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #3f3f46;
}
</style>