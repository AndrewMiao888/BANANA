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
      
      <div class="flex items-center justify-between px-3 py-1.5 bg-zinc-900/40 rounded-t-2xl border-b border-zinc-800/50">
        <select 
          v-model="activeModel"
          @change="emitModelChange"
          :disabled="isLoading"
          class="bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-xs font-mono focus:outline-none focus:border-zinc-700 text-zinc-300 disabled:opacity-50 cursor-pointer"
        >
          <option value="Instant-Nana">Instant-Nana (Cloud)</option>
          <option value="Pro-Nana">Pro-Nana (Local)</option>
          <option value="Logic-Nana">Logic-Nana (DeepSeek)</option>
          <option value="Code-Nana">Code-Nana (Qwen-Coder)</option>
        </select>
        
        <span class="text-[10px] text-zinc-500 font-mono font-medium tracking-wider uppercase">Cluster Matrix Link</span>
      </div>

      <div class="relative flex items-end p-2.5">
        <textarea
          ref="inputArea"
          v-model="userInput"
          rows="1"
          placeholder="Message BANANA Core or type '/' for cluster commands..."
          :disabled="isLoading"
          class="flex-1 max-h-52 bg-transparent text-zinc-100 text-sm pl-3 pr-14 py-2 resize-none focus:outline-none placeholder-zinc-500 leading-relaxed overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 disabled:opacity-60"
          @input="handleInput"
          @keydown.enter.exact.prevent="handleEnterKey"
          @keydown.up.exact.prevent="handleUpArrow"
          @keydown.down.exact.prevent="handleDownArrow"
          @keydown.esc.prevent="showSlashMenu = false"
          @paste="handlePasteDetection"
        />

        <div class="absolute right-3 bottom-3 flex items-center space-x-2">
          <button 
            v-if="isLoading"
            type="button"
            @click="$emit('cancel')"
            class="p-2 rounded-xl bg-red-500 hover:bg-red-600 text-white transition-all duration-200 shadow-sm animate-pulse flex items-center justify-center"
            title="Stop Response Generation"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <rect x="5" y="5" width="14" height="14" rx="2" />
            </svg>
          </button>
          
          <button 
            v-else
            type="button"
            @click="emitMessageSubmission"
            :disabled="!userInput.trim()"
            class="p-2 rounded-xl bg-yellow-400 hover:bg-yellow-500 text-zinc-950 transition-all duration-200 shadow-sm disabled:bg-zinc-800 disabled:text-zinc-600 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
            title="Send Prompt to Core"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
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
import { ref, computed, watch, nextTick, onMounted } from 'vue'

const props = defineProps({
  isLoading: { type: Boolean, default: false }
})
const emit = defineEmits(['send', 'cancel', 'update-model'])

// --- CORE SYSTEM reactive STATE TRACKERS ---
const userInput = ref('')
const activeModel = ref('Instant-Nana')
const inputArea = ref<HTMLTextAreaElement | null>(null)
const lastSentPrompt = ref('')

const showSlashMenu = ref(false)
const activeCommandIndex = ref(0)

const commands = [
  { trigger: 'clear', icon: '🧹', desc: 'Wipe current active screen context history.' },
  { trigger: 'code', icon: '💻', desc: 'Pre-format prompt wrapper for software code blocks.' },
  { trigger: 'summarize', icon: '📝', desc: 'Request a dense diagnostic rundown summary.' },
  { trigger: 'help', icon: '❓', desc: 'Display global system infrastructure guide map.' }
]

// --- COUNTER COMPUTATIONS MATRIX ---
const characterCount = computed(() => userInput.value.length)
const wordCount = computed(() => {
  const words = userInput.value.trim().split(/\s+/)
  return words[0] === '' ? 0 : words.length
})

const filteredCommands = computed(() => {
  if (!userInput.value.startsWith('/')) return []
  const query = userInput.value.slice(1).toLowerCase()
  return commands.filter(cmd => cmd.trigger.startsWith(query))
})

// Synchronize changes across active buffers
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

const emitModelChange = () => {
  emit('update-model', activeModel.value)
}

const adjustTextareaHeight = () => {
  const el = inputArea.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${el.scrollHeight}px`
}

const handleInput = () => {
  adjustTextareaHeight()
}

const handlePasteDetection = (event: ClipboardEvent) => {
  setTimeout(() => {
    adjustTextareaHeight()
  }, 10)
}

// --- CORE EVENTS TRIGGER DISPATCHER LOGIC ---
const handleEnterKey = () => {
  if (showSlashMenu.value && filteredCommands.value[activeCommandIndex.value]) {
    selectSlashCommand(filteredCommands.value[activeCommandIndex.value]!)
    return
  }
  emitMessageSubmission()
}

const emitMessageSubmission = () => {
  const cleanMessage = userInput.value.trim()
  if (cleanMessage && !props.isLoading) {
    lastSentPrompt.value = cleanMessage
    emit('send', cleanMessage)
    userInput.value = '' 
    
    nextTick(() => {
      if (inputArea.value) inputArea.value.style.height = 'auto'
    })
  }
}

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

// Ensure initially assigned properties mount seamlessly
onMounted(() => {
  emitModelChange()
})
</script>