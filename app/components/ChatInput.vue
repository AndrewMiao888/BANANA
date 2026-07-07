<template>
  <div class="chat-input-wrapper">
    <div class="chat-input-container">
      
      <div class="menu-wrapper">
        <button 
          @click="isMenuOpen = !isMenuOpen" 
          class="action-toggle-btn"
          :class="{ 'active': isMenuOpen }"
          type="button"
        >
          <span class="plus-icon">＋</span>
        </button>

        <transition name="dropdown">
          <ul v-if="isMenuOpen" class="actions-dropdown">
            <li @click="$emit('attach-click'); isMenuOpen = false"><strong>[FILE]</strong> Upload File Sequence</li>
            <li @click="$emit('attach-click'); isMenuOpen = false"><strong>[IMG]</strong> Process Vision Image</li>
            <li @click="handleAction('edit')"><strong>[EDIT]</strong> Write or Edit</li>
            <li @click="handleAction('search')"><strong>[SRC]</strong> Look Something Up</li>
            
            <li class="dropdown-divider"></li>
            <li class="dropdown-header">Voice Translation Target:</li>
            <li 
              v-for="lang in supportedLanguages" 
              :key="lang.code"
              :class="{ 'active-lang': translationTargetLang === lang.code }"
              @click="setTranslationLanguage(lang.code)"
            >
              <strong>[TR]</strong> Translate to {{ lang.name }}
            </li>
          </ul>
        </transition>
      </div>

      <input 
        v-model="internalInput" 
        type="text"
        :placeholder="isListening ? 'Listening & translating to text...' : 'Ask anything...'" 
        class="large-chat-input"
        @keydown.enter.prevent="triggerSend"
        :disabled="isLoading"
      />

      <div class="input-actions-tray">
        
        <button 
          type="button"
          @click="toggleVoiceRecognition" 
          class="tray-icon-btn"
          :class="{ 'listening-active': isListening }"
          :title="`Voice Input (Auto-Translates to text language)`"
        >
          <span v-if="!isListening"><strong>[MIC]</strong></span>
          <span v-else class="pulse-recording"><strong>[STOP]</strong></span>
        </button>

        <button 
          v-if="isLoading"
          type="button"
          @click="triggerStop" 
          class="tray-icon-btn stop-btn"
          title="Stop generating"
        >
          <div class="stop-square"></div>
        </button>

        <button 
          v-else
          type="button"
          @click="triggerSend" 
          class="tray-icon-btn send-btn"
          :disabled="!internalInput.trim()"
          title="Send message"
        >
          <span>▲</span>
        </button>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onBeforeUnmount } from 'vue'

// --- PROPS & EMITS DEFINITIONS ---
const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  isLoading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'submit', 'stop'])

// --- COMPONENT STATE ---
const internalInput = ref('')
const isMenuOpen = ref(false)
const isListening = ref(false)
const translationTargetLang = ref('en') // Default written target locale output language

const supportedLanguages = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'zh', name: '中文' },
  { code: 'fr', name: 'Français' }
]

// Keep model value linked safely with input
watch(() => props.modelValue, (newVal) => {
  internalInput.value = newVal
})
watch(internalInput, (newVal) => {
  emit('update:modelValue', newVal)
})

// --- SPEECH RECOGNITION WITH TRANSLATOR INTEG ---
let recognition = null

const initializeSpeechEngine = () => {
  if (process.client) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      console.warn("Speech API is not supported natively by this client device browser configuration.")
      return null
    }
    const instance = new SpeechRecognition()
    instance.continuous = false
    instance.interimResults = false
    // Use target language directly for natural speech detection matching
    instance.lang = translationTargetLang.value === 'zh' ? 'zh-CN' : translationTargetLang.value === 'es' ? 'es-ES' : translationTargetLang.value === 'fr' ? 'fr-FR' : 'en-US'
    
    instance.onresult = (event) => {
      const speechToTextResult = event.results[0][0].transcript
      if (speechToTextResult) {
        // Appends the captured text block down into input area
        internalInput.value = internalInput.value ? `${internalInput.value} ${speechToTextResult}` : speechToTextResult
      }
      isListening.value = false
    }

    instance.onerror = (err) => {
      console.error("Voice input translation node captured error condition:", err)
      isListening.value = false
    }

    instance.onend = () => {
      isListening.value = false
    }

    return instance
  }
  return null
}

const toggleVoiceRecognition = () => {
  if (isListening.value) {
    if (recognition) recognition.stop()
    isListening.value = false
    return
  }

  recognition = initializeSpeechEngine()
  if (!recognition) {
    alert("Voice framework configuration could not bind to browser device profile.")
    return
  }

  try {
    isListening.value = true
    recognition.start()
  } catch (e) {
    console.error("Failed to safely initialize recording node:", e)
    isListening.value = false
  }
}

// --- CORE INTERACTION ACTIONS ---
const handleAction = (actionType) => {
  isMenuOpen.value = false
  alert(`Action trigger initiated: ${actionType}`)
}

const setTranslationLanguage = (langCode) => {
  translationTargetLang.value = langCode
  isMenuOpen.value = false
}

const triggerSend = () => {
  if (!internalInput.value.trim() || props.isLoading) return
  emit('submit')
  isMenuOpen.value = false
}

const triggerStop = () => {
  emit('stop')
}

onBeforeUnmount(() => {
  if (recognition) {
    recognition.stop()
  }
})
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