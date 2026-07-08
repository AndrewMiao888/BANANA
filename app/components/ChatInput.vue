<template>
  <div class="w-full max-w-3xl mx-auto px-4 pb-6 relative">
    
    <div 
      v-if="showSlashMenu" 
      class="absolute bottom-full left-4 right-4 mb-2 bg-zinc-900 border border-zinc-700/80 rounded-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto z-50 transition-all duration-150"
    >
      <div class="px-3 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider bg-zinc-950/40 border-b border-zinc-800 select-none">
        BANANA Cluster Quick Actions
      </div>
      <ul class="divide-y divide-zinc-800">
        <li 
          v-for="(cmd, index) in filteredCommands" 
          :key="cmd.trigger"
          :class="[activeCommandIndex === index ? 'bg-yellow-400/10 text-yellow-400' : 'text-zinc-300 hover:bg-zinc-800/60']"
          @click="selectSlashCommand(cmd)"
          class="flex items-center px-4 py-2.5 text-sm cursor-pointer transition-colors space-x-3"
        >
          <span class="text-lg font-mono text-zinc-500" :class="{'text-yellow-400': activeCommandIndex === index}">{{ cmd.icon }}</span>
          <div class="flex-1">
            <span class="font-semibold font-mono">/{{ cmd.trigger }}</span>
            <span class="text-zinc-500 text-xs ml-2">— {{ cmd.desc }}</span>
          </div>
          <kbd class="hidden md:inline-block px-1.5 py-0.5 text-[10px] font-sans font-medium text-zinc-500 bg-zinc-800 rounded border border-zinc-700 shadow-sm">
            Enter
          </kbd>
        </li>
      </ul>
    </div>

    <div class="relative flex flex-col bg-zinc-850/90 border border-zinc-700/50 focus-within:border-yellow-400/50 rounded-2xl shadow-xl transition-all duration-200">
      
      <div class="relative flex items-end p-2.5">
        
        <textarea
          ref="inputArea"
          v-model="userInput"
          rows="1"
          placeholder="Message BANANA Core or type '/' for cluster commands..."
          class="flex-1 max-h-52 bg-transparent text-zinc-100 text-sm pl-3 pr-14 py-2 resize-none focus:outline-none placeholder-zinc-500 leading-relaxed overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700"
          @input="handleInput"
          @keydown.enter.exact.prevent="handleEnterKey"
          @keydown.up.exact.prevent="handleUpArrow"
          @keydown.down.exact.prevent="handleDownArrow"
          @keydown.esc.prevent="showSlashMenu = false"
          @paste="handlePasteDetection"
        />

        <div class="absolute right-3 bottom-3 flex items-center space-x-2">
          <button 
            @click="isLoading ? $emit('cancel') : emitMessageSubmission()"
            :disabled="!isLoading && !userInput.trim()"
            class="p-2 rounded-xl transition-all duration-200 shadow-sm disabled:opacity-30 disabled:cursor-not-allowed"
            :class="[
              isLoading 
                ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
                : 'bg-yellow-400 hover:bg-yellow-500 text-zinc-950 disabled:bg-zinc-800 disabled:text-zinc-600'
            ]"
            :title="isLoading ? 'Stop Response Generation' : 'Send Prompt to Core'"
          >
            <svg v-if="isLoading" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <rect x="5" y="5" width="14" height="14" rx="2" />
            </svg>
            
            <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </button>
        </div>

      </div>

      <div class="flex items-center justify-between px-4 py-1.5 bg-zinc-900/40 rounded-b-2xl border-t border-zinc-800/50 text-[11px] text-zinc-500">
        
        <div class="flex items-center space-x-3 select-none">
          <span><span class="text-zinc-400 font-medium">Shift + Enter</span> for new line</span>
          <span class="text-zinc-700">|</span>
          <span><span class="text-zinc-400 font-medium">↑</span> last prompt history</span>
        </div>

        <div class="flex items-center space-x-3 font-mono select-none">
          <span :class="{'text-yellow-500/80': wordCount > 800}">
            {{ wordCount }} words
          </span>
          <span class="text-zinc-700">/</span>
          <span :class="{'text-red-400 font-semibold': characterCount > 8000}">
            {{ characterCount }}<span class="text-zinc-600">/10,000</span> chars
          </span>
        </div>

      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'

// Define incoming component parameters and output state triggers
const props = defineProps({
  isLoading: { type: Boolean, default: false }
})
const emit = defineEmits(['send', 'cancel'])

// --- STATE MANAGEMENT TRACKERS ---
const userInput = ref('')
const inputArea = ref<HTMLTextAreaElement | null>(null)
const lastSentPrompt = ref('')

// Slash Engine State Tracking flags
const showSlashMenu = ref(false)
const activeCommandIndex = ref(0)

const commands = [
  { trigger: 'clear', icon: '🧹', desc: 'Wipe current active screen context history.' },
  { trigger: 'code', icon: '💻', desc: 'Pre-format prompt wrapper for software code blocks.' },
  { trigger: 'summarize', icon: '📝', desc: 'Request a dense diagnostic rundown summary.' },
  { trigger: 'help', icon: '❓', desc: 'Display global system infrastructure guide map.' }
]

// --- 4️⃣ WORD & CHARACTER COUNT CALCULATIONS ---
const characterCount = computed(() => userInput.value.length)
const wordCount = computed(() => {
  const words = userInput.value.trim().split(/\s+/)
  return words[0] === '' ? 0 : words.length
})

// --- 7️⃣ SLASH COMMAND PARSING ENGINE ---
const filteredCommands = computed(() => {
  if (!userInput.value.startsWith('/')) return []
  const query = userInput.value.slice(1).toLowerCase()
  return commands.filter(cmd => cmd.trigger.startsWith(query))
})

// Watch character adjustments to catch active '/' menu changes dynamically
watch(userInput, (newVal) => {
  if (newVal.startsWith('/')) {
    showSlashMenu.value = filteredCommands.value.length > 0
    // Keep selection bounds normalized
    if (activeCommandIndex.value >= filteredCommands.value.length) {
      activeCommandIndex.value = 0
    }
  } else {
    showSlashMenu.value = false
  }
})

// --- 1️⃣ AUTO-EXPANDING HEIGHT CALCULATION ENGINE ---
const adjustTextareaHeight = () => {
  const el = inputArea.value
  if (!el) return
  el.style.height = 'auto' // Force drop reference calculate boundary accurately
  el.style.height = `${el.scrollHeight}px`
}

const handleInput = () => {
  adjustTextareaHeight()
}

// --- 3️⃣ PASTE DETECTION AND INDENTATION PRESERVATION ---
const handlePasteDetection = (event: ClipboardEvent) => {
  const pastedText = event.clipboardData?.getData('text') || ''
  
  // Custom Hook: If it looks like raw code, preserve structured indent paths
  if (pastedText.includes('{') || pastedText.includes('function') || pastedText.includes('const')) {
    console.log('[BANANA UX] Syntactical data block paste captured.')
  }
  
  // Allow system to finish pasting text before resizing container
  setTimeout(() => {
    adjustTextareaHeight()
  }, 10)
}

// --- 2️⃣ MANUAL LINE BREAK VS SUBMISSION HANDLING ---
const handleEnterKey = () => {
  // If slash action dropdown is visible, hit Enter to execute the selection command instead of typing
  if (showSlashMenu.value && filteredCommands.value[activeCommandIndex.value]) {
    selectSlashCommand(filteredCommands.value[activeCommandIndex.value]!)
    return
  }

  // Otherwise, exact Enter triggers normal text message pipeline dispatch
  emitMessageSubmission()
}

const emitMessageSubmission = () => {
  if (userInput.value.trim() && !props.isLoading) {
    lastSentPrompt.value = userInput.value // Archive text content string to up-arrow history
    emit('send', userInput.value)
    userInput.value = '' // Flush buffer
    
    nextTick(() => {
      if (inputArea.value) inputArea.value.style.height = 'auto' // Reset box layer shape
    })
  }
}

// --- 6️⃣ PROMPT HISTORY (UP / DOWN NAVIGATION) ---
const handleUpArrow = () => {
  if (showSlashMenu.value) {
    // Navigate upwards through slash options menu
    if (activeCommandIndex.value > 0) activeCommandIndex.value--
  } else if (userInput.value === '' && lastSentPrompt.value !== '') {
    // Standard history lookup feature if box is empty
    userInput.value = lastSentPrompt.value
    nextTick(() => adjustTextareaHeight())
  }
}

const handleDownArrow = () => {
  if (showSlashMenu.value) {
    // Navigate downwards through slash options menu
    if (activeCommandIndex.value < filteredCommands.value.length - 1) activeCommandIndex.value++
  }
}

// Execute slash utility mutations directly into active viewport string state
const selectSlashCommand = (cmd: typeof commands[0]) => {
  if (cmd.trigger === 'code') {
    userInput.value = '```\n\n```'
    showSlashMenu.value = false
    nextTick(() => {
      if (inputArea.value) {
        inputArea.value.focus()
        inputArea.value.setSelectionRange(4, 4) // Pin cursor elegantly inside middle of new code ticks
      }
      adjustTextareaHeight()
    })
  } else {
    userInput.value = `/${cmd.trigger} `
    showSlashMenu.value = false
    nextTick(() => inputArea.value?.focus())
  }
}
</script>

<style scoped>
.chat-input-wrapper {
  width: 100%;
}

.chat-input-container {
  display: flex;
  align-items: center;
  background-color: #2f2f2f;
  border-radius: 28px;
  padding: 0.5rem 1rem;
  position: relative;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border: 1px solid #444;
}

/* --- DROPDOWN CONTROL ACTION MECHANISM --- */
.menu-wrapper {
  display: flex;
  align-items: center;
  position: relative;
}

.action-toggle-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background-color: #444;
  color: #ececec;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease, background-color 0.2s ease;
  padding: 0;
}

.action-toggle-btn:hover {
  background-color: #555;
}

.action-toggle-btn.active {
  transform: rotate(45deg);
}

.plus-icon {
  font-size: 1.25rem;
  line-height: 1;
}

.actions-dropdown {
  position: absolute;
  bottom: 55px;
  left: 0;
  background-color: #232323;
  border: 1px solid #383838;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  list-style: none;
  padding: 0.5rem;
  margin: 0;
  width: 240px;
  z-index: 999;
}

.actions-dropdown li {
  padding: 0.6rem 1rem;
  cursor: pointer;
  font-size: 0.95rem;
  color: #cdcdcd;
  border-radius: 6px;
  transition: background-color 0.2s, color 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.actions-dropdown li:hover {
  background-color: #2f2f2f;
  color: #ececec;
}

.dropdown-divider {
  height: 1px;
  background-color: #383838;
  margin: 0.4rem 0;
  padding: 0 !important;
  cursor: default !important;
}

.dropdown-header {
  font-size: 0.8rem !important;
  color: #777 !important;
  text-transform: uppercase;
  font-weight: bold;
  padding: 0.25rem 1rem !important;
  cursor: default !important;
}

.dropdown-header:hover {
  background: transparent !important;
}

.active-lang {
  color: #10a37f !important;
  font-weight: 600;
  background-color: rgba(16, 163, 127, 0.1);
}

/* --- CENTER TEXTAREA / INPUT --- */
.large-chat-input {
  flex: 1;
  font-size: 1.15rem;
  padding: 0.5rem 1rem;
  background: transparent;
  border: none;
  color: #ececec;
  outline: none;
}

.large-chat-input::placeholder {
  color: #888;
}

/* --- TRAY BUTTONS PANEL SYSTEM --- */
.input-actions-tray {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.tray-icon-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background-color: transparent;
  color: #b4b4b4;
  font-size: 1.1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s, color 0.2s;
}

.tray-icon-btn:hover:not(:disabled) {
  background-color: #3e3e3e;
  color: #ececec;
}

.tray-icon-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.listening-active {
  background-color: #ea4335 !important;
  color: #fff !important;
}

.pulse-recording {
  animation: pulseGlow 1.5s infinite;
  font-size: 0.8rem;
}

@keyframes pulseGlow {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(0.85); opacity: 0.5; }
  100% { transform: scale(1); opacity: 1; }
}

/* --- SEND & STOP STATE LAYOUTS --- */
.send-btn {
  background-color: #ececec !important;
  color: #171717 !important;
}

.send-btn:hover {
  background-color: #ffffff !important;
}

.stop-btn {
  background-color: #ececec !important;
}

.stop-square {
  width: 12px;
  height: 12px;
  background-color: #171717;
  border-radius: 2px;
}

/* Animations */
.dropdown-enter-active, .dropdown-leave-active {
  transition: opacity 0.15s, transform 0.15s;
}
.dropdown-enter-from, .dropdown-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>