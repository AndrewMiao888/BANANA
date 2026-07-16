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
      
      <div class="flex items-center justify-between px-3 pt-2.5 pb-1 select-none">
        <div class="relative">
          <button 
            @click="isPickerOpen = !isPickerOpen"
            class="flex items-center space-x-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-750 px-2.5 py-1.5 rounded-xl text-[11px] font-mono text-zinc-300 transition"
          >
            <span class="text-yellow-400">⚡</span>
            <span class="font-bold">{{ activeModelId }}</span>
            <span class="text-[8px] text-zinc-500">▼</span>
          </button>

          <div 
            v-if="isPickerOpen"
            class="absolute bottom-full left-0 mb-2 w-72 bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl z-50 p-2 flex flex-col space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-150"
          >
            <div class="relative">
              <input 
                v-model="modelSearchQuery"
                type="text"
                placeholder="Filter 40+ models... (e.g. 'coder', 'llama')"
                class="w-full bg-zinc-900 border border-zinc-800 rounded-lg text-[11px] p-2 pl-7 outline-none text-zinc-200 placeholder-zinc-500 focus:border-zinc-700"
              />
              <span class="absolute left-2.5 top-2 text-[10px] text-zinc-500">🔍</span>
            </div>

            <div class="max-h-48 overflow-y-auto divide-y divide-zinc-900 pr-1 custom-scrollbar">
              <button
                v-for="model in filteredModels"
                :key="model.id"
                @click="selectModel(model)"
                class="w-full text-left p-2 rounded-lg transition flex flex-col space-y-1 hover:bg-zinc-900 group"
                :class="activeModelId === model.id ? 'bg-yellow-400/5 border border-yellow-400/20' : 'border border-transparent'"
              >
                <div class="flex items-center justify-between">
                  <span class="text-[11px] font-bold" :class="activeModelId === model.id ? 'text-yellow-400' : 'text-zinc-200'">
                    {{ model.name }}
                  </span>
                  <span 
                    class="text-[7px] font-mono px-1.5 py-0.5 rounded uppercase"
                    :class="model.requiresLocal ? 'bg-blue-950 text-blue-400 border border-blue-900/40' : 'bg-emerald-950 text-emerald-400 border border-emerald-900/40'"
                  >
                    {{ model.requiresLocal ? 'Local Core' : 'Cloud' }}
                  </span>
                </div>
                <p class="text-[9px] text-zinc-400 leading-normal">{{ model.desc }}</p>
              </button>
            </div>
          </div>
        </div>

        <button 
          @click="isSearchEnabled = !isSearchEnabled"
          class="flex items-center space-x-1.5 px-2.5 py-1 rounded-xl border text-[10px] font-mono transition"
          :class="isSearchEnabled ? 'bg-yellow-400/10 border-yellow-400/30 text-yellow-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-400'"
        >
          <span>🌐</span>
          <span>Web Search: {{ isSearchEnabled ? 'ENABLED' : 'OFF' }}</span>
        </button>
      </div>

      <div class="relative flex items-end p-2.5">
        
        <textarea
          ref="inputArea"
          v-model="userInput"
          rows="1"
          placeholder="Message BANANA Core or type '/' for cluster commands..."
          class="flex-1 max-h-52 bg-transparent text-zinc-100 text-sm pl-3 pr-14 py-2 resize-none focus:outline-none placeholder-zinc-500 leading-relaxed overflow-y-auto custom-scrollbar"
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
          <span><span class="text-zinc-400 font-medium">↑</span> history</span>
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
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  isLoading: { type: Boolean, default: false }
})
const emit = defineEmits(['send', 'cancel', 'update-model'])

// --- STATE MANAGEMENT TRACKERS ---
const userInput = ref('')
const inputArea = ref<HTMLTextAreaElement | null>(null)
const lastSentPrompt = ref('')

// Model Picker Telemetry
const isPickerOpen = ref(false)
const modelSearchQuery = ref('')
const activeModelId = ref('Instant-Nana')
const isSearchEnabled = ref(false)

// Slash Engine State Tracking flags
const showSlashMenu = ref(false)
const activeCommandIndex = ref(0)

// Core model listing dictionary (representing Section 3/4 tags)
const modelsList = [
  { id: 'Instant-Nana', name: '🍌 Instant-Nana', desc: 'Fast general prompt cloud router fallback.', requiresLocal: false },
  { id: 'Pro-Nana', name: '⚡ Pro-Nana (Llama 8B)', desc: 'Flagship local orchestrator balanced for reasoning.', requiresLocal: true },
  { id: 'Logic-Nana', name: '🧠 Logic-Nana (DeepSeek R1)', desc: 'Reasoning model displaying thinking trace logs.', requiresLocal: true },
  { id: 'Code-Nana', name: '💻 Code-Nana (Qwen Coder)', desc: 'Specialized logic parser for clean code blocks.', requiresLocal: true }
]

const commands = [
  { trigger: 'clear', icon: '🧹', desc: 'Wipe current active screen context history.' },
  { trigger: 'code', icon: '💻', desc: 'Pre-format prompt wrapper for software code blocks.' },
  { trigger: 'summarize', icon: '📝', desc: 'Request a dense diagnostic rundown summary.' },
  { trigger: 'help', icon: '❓', desc: 'Display global system infrastructure guide map.' }
]

// --- MODEL SELECTION UTILS ---
const filteredModels = computed(() => {
  if (!modelSearchQuery.value.trim()) return modelsList
  const query = modelSearchQuery.value.toLowerCase()
  return modelsList.filter(m => 
    m.name.toLowerCase().includes(query) || m.desc.toLowerCase().includes(query)
  )
})

const selectModel = (model: typeof modelsList[0]) => {
  activeModelId.value = model.id
  emit('update-model', model.id)
  isPickerOpen.value = false
}

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
  el.style.height = 'auto' 
  el.style.height = `${el.scrollHeight}px`
}

const handleInput = () => {
  adjustTextareaHeight()
}

// --- 3️⃣ PASTE DETECTION AND INDENTATION PRESERVATION ---
const handlePasteDetection = (event: ClipboardEvent) => {
  const pastedText = event.clipboardData?.getData('text') || ''
  if (pastedText.includes('{') || pastedText.includes('function') || pastedText.includes('const')) {
    console.log('[BANANA UX] Syntactical data block paste captured.')
  }
  setTimeout(() => {
    adjustTextareaHeight()
  }, 10)
}

// --- 2️⃣ MANUAL LINE BREAK VS SUBMISSION HANDLING ---
const handleEnterKey = () => {
  if (showSlashMenu.value && filteredCommands.value[activeCommandIndex.value]) {
    selectSlashCommand(filteredCommands.value[activeCommandIndex.value]!)
    return
  }
  emitMessageSubmission()
}

const emitMessageSubmission = () => {
  let finalPrompt = userInput.value.trim()
  if (finalPrompt && !props.isLoading) {
    // If web search is forced on, pass flag info inline or as part of the pipeline trigger
    if (isSearchEnabled.value && !finalPrompt.startsWith('/')) {
      finalPrompt = `[Web Search Active] ${finalPrompt}`
    }
    
    lastSentPrompt.value = userInput.value 
    emit('send', finalPrompt)
    userInput.value = '' 
    
    nextTick(() => {
      if (inputArea.value) inputArea.value.style.height = 'auto' 
    })
  }
}

// --- 6️⃣ PROMPT HISTORY (UP / DOWN NAVIGATION) ---
const handleUpArrow = () => {
  if (showSlashMenu.value) {
    if (activeCommandIndex.value > 0) activeCommandIndex.value--
  } else if (userInput.value === '' && lastSentPrompt.value !== '') {
    userInput.value = lastSentPrompt.value
    nextTick(() => adjustTextareaHeight())
  }
}

const handleDownArrow = () => {
  if (showSlashMenu.value) {
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
        inputArea.value.setSelectionRange(4, 4) 
      }
      adjustTextareaHeight()
    })
  } else {
    userInput.value = `/${cmd.trigger} `
    showSlashMenu.value = false
    nextTick(() => inputArea.value?.focus())
  }
}

// Close picker when clicking outside
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (!target.closest('.relative')) {
    isPickerOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
/* 💎 FEATURE 163: Custom Scrollbar Aesthetic Slimmer */
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