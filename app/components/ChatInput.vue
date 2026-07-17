<template>
  <div class="w-full relative pb-4">
    
    <div 
      v-if="showSlashMenu" 
      class="absolute bottom-full left-0 right-0 mb-2 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden max-h-52 overflow-y-auto z-50"
    >
      <div class="px-3 py-1.5 text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest bg-zinc-950/60 border-b border-zinc-800">
        Cluster Quick Actions
      </div>
      <ul class="divide-y divide-zinc-800">
        <li 
          v-for="cmd in filteredCommands" 
          :key="cmd.trigger"
          @click="selectSlashCommand(cmd)"
          class="flex items-center px-4 py-2 text-xs text-zinc-300 hover:bg-zinc-800 cursor-pointer transition space-x-2"
        >
          <span>{{ cmd.icon }}</span>
          <span class="font-bold font-mono text-yellow-400">/{{ cmd.trigger }}</span>
          <span class="text-zinc-500">— {{ cmd.desc }}</span>
        </li>
      </ul>
    </div>

    <div class="bg-zinc-900 border border-zinc-800 focus-within:border-zinc-700 rounded-2xl flex flex-col shadow-lg overflow-hidden transition">
      
      <div class="flex items-center justify-between px-3 py-1.5 bg-zinc-950/40 border-b border-zinc-850 select-none">
        <select 
          v-model="activeModel"
          @change="emitModelChange"
          :disabled="isLoading"
          class="bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-xs font-mono text-zinc-300 focus:outline-none cursor-pointer"
        >
          <option value="Instant-Nana">Instant-Nana (Cloud)</option>
          <option value="Pro-Nana">Pro-Nana (Local)</option>
          <option value="Logic-Nana">Logic-Nana (DeepSeek)</option>
          <option value="Code-Nana">Code-Nana (Qwen-Coder)</option>
        </select>
        <span class="text-[10px] text-zinc-600 font-mono tracking-widest uppercase">READY</span>
      </div>

      <div class="flex items-end p-2.5 relative space-x-2">
        <textarea
          ref="inputArea"
          v-model="userInput"
          rows="1"
          placeholder="Message BANANA Core or type '/' for commands..."
          :disabled="isLoading"
          @input="adjustTextareaHeight"
          @keydown.enter.exact.prevent="handleEnterKey"
          class="flex-1 bg-transparent text-zinc-100 text-sm px-2 py-1.5 resize-none focus:outline-none max-h-40 overflow-y-auto disabled:opacity-50"
        ></textarea>

        <div class="shrink-0 flex items-center">
          <button 
            v-if="isLoading"
            type="button"
            @click="$emit('cancel')"
            class="p-2 bg-red-500 hover:bg-red-600 text-white rounded-xl shadow transition"
          >
            <span class="text-xs">■</span>
          </button>
          <button 
            v-else
            type="button"
            @click="dispatchPrompt"
            :disabled="!userInput.trim()"
            class="p-2 bg-yellow-400 hover:bg-yellow-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-950 rounded-xl shadow transition"
          >
            <span class="text-xs font-bold">➔</span>
          </button>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue'

const props = defineProps({ isLoading: Boolean })
const emit = defineEmits(['send', 'cancel', 'update-model'])

const userInput = ref('')
const activeModel = ref('Instant-Nana')
const inputArea = ref<HTMLTextAreaElement | null>(null)
const showSlashMenu = ref(false)

// 1. Declare a explicit interface for complete type agreement
interface SlashCommand {
  trigger: string;
  icon: string;
  desc: string;
}

const commands: SlashCommand[] = [
  { trigger: 'clear', icon: '🧹', desc: 'Clear active prompt view context.' },
  { trigger: 'code', icon: '💻', desc: 'Preformat programming code fences block.' },
  { trigger: 'help', icon: '❓', desc: 'Show Core infrastructure help diagnostics.' }
]

// 2. Strongly type the computed search results
const filteredCommands = computed<SlashCommand[]>(() => {
  if (!userInput.value.startsWith('/')) return []
  const query = userInput.value.slice(1).toLowerCase()
  return commands.filter(c => c.trigger.startsWith(query))
})

watch(userInput, (val) => {
  showSlashMenu.value = val.startsWith('/') && filteredCommands.value.length > 0
})

const emitModelChange = () => emit('update-model', activeModel.value)

const adjustTextareaHeight = () => {
  const el = inputArea.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${el.scrollHeight}px`
}

const handleEnterKey = () => {
  // 3. Extract item and perform strict truthiness check to clear the 'undefined' warning
  const firstCommand = filteredCommands.value[0]
  if (showSlashMenu.value && firstCommand) {
    selectSlashCommand(firstCommand)
    return
  }
  dispatchPrompt()
}

const dispatchPrompt = () => {
  const clean = userInput.value.trim()
  if (clean && !props.isLoading) {
    emit('send', clean)
    userInput.value = ''
    nextTick(() => { if (inputArea.value) inputArea.value.style.height = 'auto' })
  }
}

// 4. Type the parameter explicitly using our SlashCommand Interface
const selectSlashCommand = (cmd: SlashCommand) => {
  if (cmd.trigger === 'code') {
    userInput.value = "```\n\n```"
    showSlashMenu.value = false
    nextTick(() => {
      inputArea.value?.focus()
      inputArea.value?.setSelectionRange(4, 4)
      adjustTextareaHeight()
    })
  } else {
    userInput.value = `/${cmd.trigger} `
    showSlashMenu.value = false
    nextTick(() => inputArea.value?.focus())
  }
}

onMounted(() => emitModelChange())
</script>