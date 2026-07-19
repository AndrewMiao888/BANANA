<template>
  <div class="flex h-screen bg-zinc-950 text-zinc-200 font-sans overflow-hidden selection:bg-yellow-500/30 selection:text-yellow-200">
    
    <aside class="w-64 bg-zinc-900/90 border-r border-zinc-800/80 flex flex-col h-full shrink-0">
      
      <div class="p-3.5">
        <button 
          @click="startNewChatSession"
          class="w-full py-2 px-4 bg-zinc-800 hover:bg-zinc-700/80 text-zinc-300 hover:text-zinc-100 rounded-lg font-mono text-xs font-medium border border-zinc-700/60 transition-all duration-150 flex items-center justify-start gap-3 shadow-sm active:scale-[0.99]"
        >
          <span class="text-base text-yellow-400 font-bold">+</span>
          <span>New chat</span>
        </button>
      </div>

      <div class="flex-1 overflow-y-auto px-2 space-y-0.5 custom-scrollbar">
        <div class="px-3 py-2 text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest">
          Recent
        </div>

        <div v-if="chatHistoryList.length === 0" class="px-3 py-4 text-xs text-zinc-600 italic font-mono">
          No active nodes indexed.
        </div>
        
        <div 
          v-for="session in chatHistoryList" 
          :key="session.id"
          @click="switchActiveSession(session.id)"
          :class="[
            'group relative px-3 py-2 rounded-lg text-xs font-mono cursor-pointer transition-all duration-150 flex items-center justify-between',
            activeSessionId === session.id 
              ? 'bg-zinc-800 text-yellow-400 font-semibold' 
              : 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200'
          ]"
        >
          <div class="flex items-center gap-2.5 truncate pr-5">
            <span class="text-zinc-500 group-hover:text-yellow-400/80 transition-colors">💬</span>
            <span class="truncate">{{ session.title }}</span>
          </div>

          <button 
            @click.stop="purgeSession(session.id)"
            class="text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity duration-100 p-0.5 text-[10px]"
          >
            ✕
          </button>
        </div>
      </div>

      <div class="p-3 border-t border-zinc-800/80 bg-zinc-900/40 flex items-center justify-between">
        <div class="flex items-center gap-2.5 truncate">
          <div class="w-7 h-7 rounded-full bg-yellow-500 text-zinc-950 font-mono font-bold text-xs flex items-center justify-center shadow-inner shrink-0">
            🍌
          </div>
          <span class="text-xs font-mono font-semibold text-zinc-300 truncate">Andrew / BANANA</span>
        </div>
        <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow shadow-emerald-500/50"></span>
      </div>
    </aside>

    <main class="flex-1 flex flex-col h-full bg-zinc-950 relative">
      
      <header class="h-14 border-b border-zinc-800/60 px-6 flex items-center justify-between bg-zinc-950/40 backdrop-blur-md z-20">
        <div class="flex items-center gap-3 font-mono text-[11px]">
          <span class="text-zinc-600">PIPELINE MONITOR:</span>
          <span class="px-2 py-0.5 bg-zinc-900 border border-zinc-800 text-yellow-400 font-semibold rounded">
            {{ activeRoutingSource || 'Idle Waiting State' }}
          </span>
        </div>

        <div class="flex items-center gap-2 font-mono text-[11px]">
          <span class="text-zinc-500">ENGINE:</span>
          <select 
            v-model="selectedModelId"
            class="bg-zinc-900 border border-zinc-800 text-zinc-300 rounded px-2.5 py-1 focus:outline-none focus:border-yellow-500/40 cursor-pointer text-[11px]"
          >
            <option v-for="model in AVAILABLE_MODELS" :key="model.id" :value="model.id">
              {{ model.name }}
            </option>
          </select>
        </div>
      </header>

      <div 
        ref="feedScrollContainer"
        @scroll="handleUserScrollDetection"
        @wheel="handleUserScrollDetection"
        @touchmove="handleUserScrollDetection"
        class="flex-1 overflow-y-auto px-6 py-8 space-y-6 custom-scrollbar bg-zinc-950"
      >
        <div v-if="messages.length === 0" class="h-full flex flex-col items-center justify-center max-w-xl mx-auto text-center space-y-3 pb-12">
          <div class="text-4xl animate-bounce duration-1000">🍌</div>
          <h1 class="text-xl font-mono font-bold tracking-tight text-yellow-400">BANANA Core Orchestrator</h1>
          <p class="text-xs text-zinc-500 font-mono leading-relaxed">
            Ready to receive system operational parameters. Prepend requests with <span class="text-yellow-500/80">/search</span> to directly trigger automated real-time web telemetry routines.
          </p>
        </div>

        <div 
          v-for="(msg, index) in messages" 
          :key="index"
          :class="[
            'max-w-2xl mx-auto flex gap-4 p-1 transition-all duration-150',
            msg.role === 'user' ? 'justify-end' : 'justify-start'
          ]"
        >
          <div v-if="msg.role === 'assistant'" class="w-6 h-6 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-xs flex items-center justify-center shrink-0">
            🍌
          </div>

          <div class="flex flex-col gap-1 max-w-[88%]">
            <div class="font-mono text-[10px] uppercase tracking-wider text-zinc-600 flex items-center gap-2">
              <span>{{ msg.role === 'user' ? 'Client Directive' : 'BANANA Intelligence response' }}</span>
              <span v-if="msg.source" class="text-[9px] px-1 bg-zinc-900 border border-zinc-800 rounded text-zinc-500 lowercase">
                ({{ msg.source }})
              </span>
            </div>
            
            <div 
              :class="[
                'text-sm leading-relaxed whitespace-pre-wrap',
                msg.role === 'user' 
                  ? 'bg-zinc-900 text-zinc-200 border border-zinc-800 px-4 py-2.5 rounded-2xl rounded-tr-none' 
                  : 'text-zinc-300 pt-0.5'
              ]"
            >
              {{ msg.content }}
            </div>
          </div>
        </div>

        <div v-if="isProcessingPipeline" class="max-w-2xl mx-auto flex gap-4 p-1">
          <div class="w-6 h-6 rounded-full bg-yellow-500/10 border border-dashed border-yellow-500/40 flex items-center justify-center shrink-0 animate-spin text-[10px]">
            ⚙️
          </div>
          <div class="text-xs text-zinc-500 font-mono italic flex items-center gap-2 animate-pulse pt-0.5">
            Streaming network pipeline computation matrices...
          </div>
        </div>
      </div>

      <footer class="p-4 border-t border-zinc-900/60 bg-zinc-950">
        <form @submit.prevent="executeTransmissionDirective" class="max-w-2xl mx-auto relative flex items-center">
          <input 
            v-model="inputFieldPrompt"
            type="text"
            placeholder="Type your instruction or execution trace here..."
            :disabled="isProcessingPipeline"
            class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3.5 pr-24 text-zinc-100 text-sm placeholder-zinc-600 focus:outline-none focus:border-yellow-500/40 transition-all disabled:opacity-40 font-sans"
          />
          <button 
            type="submit"
            :disabled="isProcessingPipeline || !inputFieldPrompt.trim()"
            class="absolute right-2 px-3.5 py-1.5 bg-yellow-500 text-zinc-950 font-mono font-bold rounded-lg text-xs tracking-wider hover:bg-yellow-400 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
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

// ─── STATE ARRAYS AND UI VALUES ───────────────────────────────────────
const chatHistoryList = ref([])
const activeSessionId = ref('')
const messages = ref([])
const inputFieldPrompt = ref('')
const selectedModelId = ref(AVAILABLE_MODELS[0]?.id || '')
const isProcessingPipeline = ref(false)
const activeRoutingSource = ref('')
const feedScrollContainer = ref(null)

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

// ─── DIRECTIVE EXECUTION LAYER ────────────────────────────────────────
async function executeTransmissionDirective() {
  const currentPayload = inputFieldPrompt.value.trim()
  if (!currentPayload || isProcessingPipeline.value) return

  // Add the message to the view
  messages.value.push({ role: 'user', content: currentPayload })
  inputFieldPrompt.value = ''
  isProcessingPipeline.value = true
  
  // Force screen focus down to bottom right after user submits prompt
  userHasScrolledUpManually.value = false
  await triggerSystemEnforcedAutoScroll(true)

  try {
    const calculatedContext = messages.value[0]?.content 
      ? `Topic focuses around: ${messages.value[0].content.slice(0, 40)}` 
      : ''

    const apiResponse = await $fetch('/server/api/chat.post', {
      method: 'POST',
      body: {
        messages: messages.value,
        selectedModelId: selectedModelId.value,
        summaryContext: calculatedContext
      }
    })

    if (apiResponse && apiResponse.message) {
      messages.value.push({
        role: 'assistant',
        content: apiResponse.message.content || 'Blank packet allocated.',
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
    
    // Auto-update Sidebar Title string if it remains unassigned
    const targetSession = chatHistoryList.value.find(s => s.id === activeSessionId.value)
    if (targetSession) {
      targetSession.messages = [...messages.value]
      
      if (targetSession.title === 'New chat' && messages.value[0]?.content) {
        const titleSanitized = messages.value[0].content.replace(/\/search\s*/i, '').trim()
        targetSession.title = titleSanitized.length > 24 ? titleSanitized.slice(0, 24) + '...' : titleSanitized
      }
    }
    
    syncSessionsToLocalStorage()
    await triggerSystemEnforcedAutoScroll() // Smart check: handles scrolling unless reading logs
  }
}

// Core initializer layout lifecycle binding hook
onMounted(() => {
  loadSessionsFromLocalStorage()
})
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