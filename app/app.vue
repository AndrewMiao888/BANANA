<template>
  <div class="flex-1 flex flex-col overflow-hidden max-w-4xl mx-auto w-full p-4">
    
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
                ? 'bg-red-500/10 border-red-500/20 text-red-400 rounded-tl-sm font-mono animate-pulse'
                : 'bg-zinc-900 border-zinc-800 text-zinc-300 rounded-tl-sm'
          ]"
        >
          <span>{{ msg.content }}</span>
        </div>
      </div>
    </div>

    <div class="mt-auto pt-2 bg-gradient-to-t from-zinc-950 via-zinc-950 to-transparent">
      <ChatInput 
        :is-loading="isLoading"
        @send="submitMessage"
        @cancel="handleAbortTransmission"
      />
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed, nextTick } from 'vue'
import { runAgent1Core } from '~~/src/agents'

// --- COMPLETE LOCALSTORAGE STATE SYNC PIPELINE ---
const isLoading = ref(false)
const chatWindow = ref(null)
const currentSummary = ref('')
let currentAbortController = null

const defaultSystemMessage = {
  role: 'system',
  content: 'You are BANANA system core agent. You are helpful, precise, and highly capable.'
}

// Initialized chat logs always start with an automatic Core initialization message
const chatHistory = ref([
  { role: 'assistant', content: 'System initialized. Welcome to BANANA Core control panel.' }
])
const savedSessions = ref([])
const currentSessionIndex = ref(null)

const visibleMessages = computed(() => {
  return chatHistory.value.filter(msg => msg.role !== 'system')
})

// --- PERSISTENCE SYNCHRONIZER LAYER ---
onMounted(() => {
  const storedSessions = localStorage.getItem('banana_saved_sessions')
  if (storedSessions) savedSessions.value = JSON.parse(storedSessions)

  const activeChat = localStorage.getItem('banana_chat_history')
  if (activeChat) chatHistory.value = JSON.parse(activeChat)
  
  const storedIdx = localStorage.getItem('banana_current_session_index')
  if (storedIdx !== null) currentSessionIndex.value = JSON.parse(storedIdx)

  const storedSummary = localStorage.getItem('banana_current_summary')
  if (storedSummary) currentSummary.value = storedSummary

  scrollWindowToBottom()
})

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

// --- SUBMISSION HANDLERS ---
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
      existingSummary: currentSummary.value
    })
    
    if (isLoading.value) {
      chatHistory.value.push({ role: 'assistant', content: finalAiReply.content })

      if (finalAiReply.updatedSummary) {
        currentSummary.value = finalAiReply.updatedSummary
      }
      updateSidebarTracking()
    }
  } catch (error) {
    if (isLoading.value) {
      chatHistory.value.push({ 
        role: 'assistant', 
        content: 'Connection Error: BANANA Core systems are unreachable.' 
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























