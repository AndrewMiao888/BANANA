<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col md:flex-row h-screen w-screen overflow-hidden">
    
    <aside class="w-full md:w-80 bg-slate-900 border-b md:border-b-0 md:border-r border-slate-800 p-4 flex flex-col justify-between shrink-0">
      <div class="flex flex-col h-full overflow-hidden">
        <div class="flex items-center justify-between mb-6 px-2">
          <div class="flex items-center space-x-3">
            <h1 class="text-xl font-bold tracking-tight bg-gradient-to-r from-yellow-400 to-amber-400 bg-clip-text text-transparent">BANANA</h1>
          </div>
        </div>
        <button @click="createNewChat" class="w-full mb-4 py-2.5 px-4 rounded-xl font-medium text-sm bg-yellow-500 hover:bg-yellow-400 text-slate-950 border border-transparent shadow-lg shadow-yellow-950/20 transition-all flex items-center justify-center space-x-2 shrink-0">
          <span>+ New Chat</span>
        </button>
        <div class="flex-1 overflow-y-auto space-y-1.5 pr-1">
          <div v-for="chat in chatSessions" :key="chat.id" class="group w-full p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer" :class="currentChatId === chat.id ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-900/40 border-transparent text-slate-400 hover:bg-slate-800/40'" @click="switchChat(chat.id)">
            <span class="text-xs font-mono truncate block font-medium">{{ chat.title }}</span>
            <button @click.stop="deleteChat(chat.id)" class="p-1 text-slate-500 hover:text-rose-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity">🗑️</button>
          </div>
        </div>
      </div>
    </aside>

    <main class="flex-1 flex flex-col bg-slate-950 overflow-hidden relative">
      
      <header class="h-16 border-b border-slate-900 px-6 flex items-center justify-between bg-slate-900/40 backdrop-blur-sm shrink-0">
        <div class="flex items-center space-x-4 text-sm font-mono text-slate-400">
          <div>BANANA <span class="text-yellow-400">{{ activeMetadata?.engine || 'BANANA-Core' }}</span></div>
          <div class="hidden sm:block text-slate-700">|</div>
          <div class="hidden sm:block">Source: <span class="text-amber-400">{{ activeMetadata?.source || 'Local File' }}</span></div>
        </div>
        <div v-if="activeMetadata?.confidence" class="text-xs font-mono px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-emerald-400 font-bold">
          {{ activeMetadata?.confidence || '0%' }}
        </div>
      </header>

      <div class="flex-1 overflow-y-auto p-6 space-y-4 relative" ref="chatContainer">
        <div v-if="getCurrentMessages().length === 0" class="h-full flex flex-col items-center justify-center text-center p-8 opacity-40">
          <div class="text-sm">No messages yet. Type a prompt below to start the conversation.</div>
        </div>
        
        <div v-for="(msg, idx) in getCurrentMessages()" :key="idx" class="flex flex-col max-w-3xl mx-auto p-4 rounded-xl border font-mono text-sm leading-relaxed whitespace-pre-wrap" :class="msg.role === 'user' ? 'bg-slate-900/60 border-slate-800/80 ml-12 text-slate-200' : 'bg-yellow-950/10 border-yellow-900/20 mr-12 text-yellow-100'">
          <div class="text-[10px] uppercase tracking-widest font-bold mb-1 opacity-40">{{ msg.role === 'user' ? 'Client Request' : 'Neural Matrix Response' }}</div>
          <div>{{ msg.text }}</div>
        </div>
      </div>

      <button 
        v-if="showScrollButton" 
        class="pixel-scroll-btn" 
        @click="scrollToBottom"
        aria-label="Scroll to bottom"
      >
        <span class="pixel-arrow"></span>
      </button>

      <footer class="p-4 md:p-6 bg-gradient-to-t from-slate-950 to-transparent shrink-0">
        <form @submit.prevent="runQuery" class="max-w-3xl mx-auto relative rounded-xl border border-slate-800 bg-slate-900/80 p-1.5 flex items-center">
          <input v-model="userPrompt" type="text" placeholder="Type word parameters..." :disabled="isGenerating" class="w-full bg-transparent px-4 py-2.5 text-sm text-slate-100 focus:outline-none" />
          <button type="submit" :disabled="!userPrompt.trim() || isGenerating" class="h-9 px-4 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold text-xs transition-all disabled:opacity-30">
            <span>{{ isGenerating ? 'Analyzing...' : 'Run' }}</span>
          </button>
        </form>
      </footer>

    </main>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted, onUnmounted } from 'vue'

// 🔑 Complete Object Initialization Structure protecting template rendering properties
const activeMetadata = ref({
  engine: 'BANANA-v1-Core',
  source: 'Local Cache',
  confidence: '100%'
})

const userPrompt = ref("")
const isGenerating = ref(false)
const currentChatId = ref('default-session')
const chatContainer = ref(null) // Directly hooks up with ref="chatContainer" template element
const showScrollButton = ref(false)

// Memory Logs to track previous ideas and correct sloppy spelling tokens
const sessionMainIdeas = ref({
  'default-session': 'System configuration initialization.'
})

// Starter Session Data Structures
const chatSessions = ref([
  { id: 'default-session', title: 'Matrix Core Base Initialization' }
])

const chatMessagesMap = ref({
  'default-session': [
    { role: 'system', text: "System ready. Welcome to BANANA Engine core array." }
  ]
})

function getCurrentMessages() {
  return chatMessagesMap.value[currentChatId.value] || []
}

// Session Creation, Switching, and Deletion Execution Nodes
function createNewChat() {
  const newId = 'session-' + Date.now()
  chatSessions.value.push({ 
    id: newId, 
    title: 'Session Query ' + (chatSessions.value.length + 1) 
  })
  chatMessagesMap.value[newId] = []
  sessionMainIdeas.value[newId] = "Fresh canvas started."
  currentChatId.value = newId
  scrollToBottom()
}

// Session Swapper
function switchChat(id) {
  currentChatId.value = id
  scrollToBottom()
}

// Session Removal Node
function deleteChat(id) {
  chatSessions.value = chatSessions.value.filter(c => c.id !== id)
  if (currentChatId.value === id) {
    currentChatId.value = chatSessions.value[0]?.id || ''
  }
}

// 🧠 Hugging Face Pre-Processor Simulation Layer (Handles typos and extracts main concept insights)
function preProcessPrompt(promptText, historicalContext) {
  let cleanedText = promptText.trim()
  
  // A. Quick Typo Dictionary Fixer for messy inputs
  const typoMap = {
    "whts": "what's", "wat": "what", "u": "you", "r": "are", "hiii": "hello",
    "bana": "banana", "enjin": "engine", "who r u": "who are you", "ur": "your",
    "hellow": "hello", "naem": "name", "whois": "who is"
  }
  
  let words = cleanedText.toLowerCase().split(/\s+/)
  words = words.map(word => typoMap[word] || word)
  
  // B. Main Idea Extraction Synthesis 
  let mainIdea = "Inquiring details"
  if (words.includes("hello") || words.includes("hi") || words.includes("hey")) {
    mainIdea = "User greeting check"
  } else if (words.includes("name") || words.includes("who")) {
    mainIdea = "Identity verification request"
  } else if (historicalContext) {
    mainIdea = `Iterating relative parameters on top of: "${historicalContext.substring(0, 25)}..."`
  }
  
  return {
    processedText: cleanedText,
    detectedMainIdea: mainIdea
  }
}

// Unified Query Action Execution (Matches form @submit.prevent="runQuery")
function runQuery() {
  if (!userPrompt.value.trim() || isGenerating.value) return
  
  const currentMessages = chatMessagesMap.value[currentChatId.value]
  if (!currentMessages) return

  const rawInput = userPrompt.value
  
  // 1. Process prompt using our tracking layer 
  const previousIdea = sessionMainIdeas.value[currentChatId.value] || ""
  const analysis = preProcessPrompt(rawInput, previousIdea)
  
  // Save the fresh main idea to session memory storage
  sessionMainIdeas.value[currentChatId.value] = analysis.detectedMainIdea

  // 2. Push user prompt entry
  currentMessages.push({ role: 'user', text: rawInput })
  userPrompt.value = ""
  isGenerating.value = true
  scrollToBottom() // Instantly auto-scroll down on message send
  
  // 3. Simulate AI engine responses sequence with intelligence filters
  setTimeout(() => {
    const lowercaseClean = rawInput.toLowerCase().trim()
    let responseText = ""

    // AI Identity & Persona Logic Routers
    if (
      lowercaseClean.includes("who are you") || 
      lowercaseClean.includes("what is your name") || 
      lowercaseClean.includes("whats your name") ||
      lowercaseClean.includes("who r u")
    ) {
      responseText = "I am Banana, a dev model built by SynQuara Digital. Think of me as your AI collaborator and digital assistant. I'm here to help you brainstorm ideas, write stories, learn new things, or just chat about whatever is on your mind. How can I help you today?"
    } else if (
      lowercaseClean.includes("hello") || 
      lowercaseClean.includes("hi") || 
      lowercaseClean.includes("hey")
    ) {
      responseText = "Hello! I am Banana. How can I assist your matrix development goals today?"
    } else {
      // General fallbacks displaying context awareness metrics
      responseText = `Query processed. Hugging Face memory sub-layer recorded core intention: "${analysis.detectedMainIdea}". Everything looks solid on our end.`
    }

    currentMessages.push({ 
      role: 'assistant', 
      text: responseText 
    })
    
    // Dynamically adjust metadata info for total look-and-feel authenticity
    activeMetadata.value = {
      engine: 'BANANA-v1-Core',
      source: analysis.detectedMainIdea,
      confidence: '98.4%'
    }

    isGenerating.value = false
    scrollToBottom() // Instantly auto-scroll down when AI response lands
  }, 750)
}

// Viewport Scroll Mechanics and Intersection Calculations
function scrollToBottom() {
  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight
    }
  })
}

function handleScroll() {
  if (!chatContainer.value) return
  const { scrollTop, scrollHeight, clientHeight } = chatContainer.value
  
  // Calculate if user has scrolled back up past 180px threshold boundary
  const distanceFromBottom = scrollHeight - scrollTop - clientHeight
  showScrollButton.value = distanceFromBottom > 180
}

onMounted(() => {
  if (chatContainer.value) {
    chatContainer.value.addEventListener('scroll', handleScroll)
  }
  scrollToBottom()
})

onUnmounted(() => {
  if (chatContainer.value) {
    chatContainer.value.removeEventListener('scroll', handleScroll)
  }
})
</script>

<style scoped>
/* ==========================================================================
   RETRO PIXELATED DOWN ARROW OVERLAY
   ========================================================================== */
.pixel-scroll-btn {
  position: absolute;
  bottom: 100px; /* Anchors right above the transparent input layout bar */
  right: 32px;
  width: 44px;
  height: 44px;
  background-color: #0f172a;
  border: 3px solid #ffffff;
  border-radius: 0px; /* Absolute retro hard-square edge */
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 4px 4px 0px #000000;
  z-index: 50;
}

.pixel-scroll-btn:active {
  transform: translate(2px, 2px);
  box-shadow: 2px 2px 0px #000000;
}

/* Custom pure blocky CSS pixel chevron build design */
.pixel-arrow {
  display: block;
  position: relative;
  width: 6px;
  height: 6px;
  background: #ffffff;
}

.pixel-arrow::before,
.pixel-arrow::after {
  content: '';
  position: absolute;
  background: #ffffff;
}

.pixel-arrow::before {
  width: 18px;
  height: 6px;
  top: -6px;
  left: -6px;
  box-shadow: -6px -6px 0 #ffffff;
}

.pixel-arrow::after {
  width: 6px;
  height: 6px;
  top: -12px;
  left: 0px;
}
</style>