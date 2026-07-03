<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col md:flex-row">
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
    <main class="flex-1 flex flex-col bg-slate-950 overflow-hidden">
      <header class="h-16 border-b border-slate-900 px-6 flex items-center justify-between bg-slate-900/40 backdrop-blur-sm shrink-0">
        <div class="flex items-center space-x-4 text-sm font-mono text-slate-400">
          <div>BANANA<span class="text-yellow-400">{{ activeMetadata?.engine || 'BANANA-Core' }}</span></div>
          <div class="hidden sm:block text-slate-700">|</div>
          <div class="hidden sm:block">Source: <span class="text-amber-400">{{ activeMetadata?.source || 'Local File' }}</span></div>
        </div>
        <div v-if="activeMetadata.confidence" class="text-xs font-mono px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-emerald-400 font-bold">{{ activeMetadata?.confidence || '0%' }}</div>
      </header>
      <div class="flex-1 overflow-y-auto p-6 space-y-4" ref="chatContainer">
        <div v-if="getCurrentMessages().length === 0" class="h-full flex flex-col items-center justify-center text-center p-8 opacity-40">
          <div class="text-sm">No messages yet. Type a prompt below to start the conversation.</div>
        </div>
        <div v-for="(msg, idx) in getCurrentMessages()" :key="idx" class="flex flex-col max-w-3xl mx-auto p-4 rounded-xl border font-mono text-sm leading-relaxed whitespace-pre-wrap" :class="msg.role === 'user' ? 'bg-slate-900/60 border-slate-800/80 ml-12 text-slate-200' : 'bg-yellow-950/10 border-yellow-900/20 mr-12 text-yellow-100'">
          <div class="text-[10px] uppercase tracking-widest font-bold mb-1 opacity-40">{{ msg.role === 'user' ? 'Client Request' : 'Neural Matrix Response' }}</div>
          <div>{{ msg.text }}</div>
        </div>
      </div>

<div class="chat-viewport-wrapper">
    
    <div class="metadata-stats-bar">
      <p>Engine: {{ activeMetadata?.engine }}</p>
      <p>Source: {{ activeMetadata?.source }}</p>
      <p>Confidence: {{ activeMetadata?.confidence }}</p>
    </div>

    </div>

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

<style scoped>
/* ==========================================================================
   STABLE CHAT INTERFACE WITH PIXELATED AUTO-SCROLL ANCHOR
   ========================================================================== */

/* Freeze root app window canvas */
html, body, #__nuxt {
  margin: 0 !important;
  padding: 0 !important;
  height: 100vh !important;
  width: 100vw !important;
  overflow: hidden !important;
  background-color: #0b0c10;
  font-family: monospace;
}

.app-container {
  display: flex !important;
  flex-direction: column !important;
  height: 100vh !important;
  width: 100vw !important;
  overflow: hidden !important;
}

.app-header {
  height: 50px;
  background-color: #1f232a;
  border-bottom: 2px solid #2f343f;
  display: flex;
  align-items: center;
  padding: 0 1rem;
  color: #00ff66;
  font-weight: bold;
}

/* Relative positioning wrapper to isolate the floating button */
.chat-viewport-wrapper {
  flex: 1 1 0% !important;
  position: relative !important;
  min-height: 0 !important; /* Fixes layout calculations inside flexboxes */
  display: flex;
  flex-direction: column;
}

/* The actual chat container - ONLY this section handles scrolling */
.chat-display-area {
  flex: 1 1 0% !important;
  overflow-y: auto !important;
  overflow-x: hidden !important;
  padding: 1.5rem !important;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background-color: #0f1115;
}

.message-bubble {
  background-color: #1a1d24;
  border: 1px solid #2c313d;
  color: #e2e8f0;
  padding: 0.75rem 1rem;
  border-radius: 4px;
  max-width: 80%;
  align-self: flex-start;
  word-break: break-word;
}

/* Input Tray fixed permanently to the bottom */
.input-dock-container {
  background-color: #1f232a;
  border-top: 2px solid #2f343f;
  padding: 1rem;
}

.input-row-wrapper {
  display: flex;
  gap: 0.5rem;
  max-width: 1000px;
  margin: 0 auto;
}

.matrix-input {
  flex: 1;
  background-color: #0f1115;
  border: 1px solid #2f343f;
  color: #fff;
  padding: 0.75rem;
  font-family: monospace;
}

.matrix-btn {
  background-color: #00ff66;
  color: #000;
  border: none;
  font-weight: bold;
  padding: 0 1.5rem;
  cursor: pointer;
}

/* ==========================================================================
   RETRO PIXELATED DOWN ARROW BUTTON
   ========================================================================== */
.pixel-scroll-btn {
  position: absolute;
  bottom: 20px;
  right: 30px;
  width: 44px;
  height: 44px;
  background-color: #1f232a;
  border: 3px solid #ffffff;
  border-radius: 0px; /* Kept completely square for blocky retro feel */
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 4px 4px 0px #000000;
  z-index: 99;
}

.pixel-scroll-btn:active {
  transform: translate(2px, 2px);
  box-shadow: 2px 2px 0px #000000;
}

/* Custom pure CSS pixel-art down arrow construct */
.pixel-arrow {
  display: block;
  position: relative;
  width: 6px;
  height: 6px;
  background: #ffffff;
}

/* Creates pixel-stepped chevron wings */
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

<script setup>


import { ref, nextTick, onMounted, onUnmounted } from 'vue'

// 🔑 Add this to define your activeMetadata object locally
const activeMetadata = ref({
  engine: 'BANANA-v1-Core' // You can change this default string to whatever you like
})

// Replace this with your actual messages data array
const messages = ref([
  { text: "System initialized. Welcome to BANANA Core." }
])
const newMessageText = ref("")

const chatContainerRef = ref(null)
const showScrollButton = ref(false)

// Function to handle automatic viewport snapping
function scrollToBottom() {
  nextTick(() => {
    if (chatContainerRef.value) {
      chatContainerRef.value.scrollTop = chatContainerRef.value.scrollHeight
    }
  })
}

// Track container scrolling to show/hide the arrow button
function handleScroll() {
  if (!chatContainerRef.value) return
  const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.value
  
  // If the user scrolls up more than 200px from the bottom, reveal the button
  const distanceFromBottom = scrollHeight - scrollTop - clientHeight
  showScrollButton.value = distanceFromBottom > 200
}

// Simulated send message function for verification
function handleSendMessage() {
  if (!newMessageText.value.trim()) return
  
  // Push user message
  messages.value.push({ text: newMessageText.value })
  newMessageText.value = ""
  scrollToBottom()
  
  // Simulate incoming server response matrix
  setTimeout(() => {
    messages.value.push({ text: "Processing node sequence response..." })
    scrollToBottom()
  }, 750)
}

onMounted(() => {
  if (chatContainerRef.value) {
    chatContainerRef.value.addEventListener('scroll', handleScroll)
  }
  scrollToBottom()
})

onUnmounted(() => {
  if (chatContainerRef.value) {
    chatContainerRef.value.removeEventListener('scroll', handleScroll)
  }
})



</script>
