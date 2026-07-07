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
            <li @click="$emit('attach-click'); isMenuOpen = false"><strong>[FILE]</strong> Upload File</li>
            <li @click="$emit('attach-click'); isMenuOpen = false"><strong>[IMG]</strong> Process Vision</li>
            <li @click="isMenuOpen = false"><strong>[EDIT]</strong> Smart Write</li>
            <li @click="isMenuOpen = false"><strong>[SRC]</strong> Search Web</li>
          </ul>
        </transition>
      </div>

      <input 
        v-model="internalInput" 
        type="text"
        :placeholder="isListening ? 'Listening (Auto-Detecting Language)...' : 'Ask anything...'" 
        class="large-chat-input"
        @keydown.enter.prevent="triggerSend"
        :disabled="isLoading"
      />

      <div class="input-actions-tray">
        <button 
          type="button"
          @click="toggleVoiceRecognition" 
          class="tray-icon-btn mic-btn"
          :class="{ 'listening-active': isListening }"
          title="Voice Input (Auto-Detect)"
        >
          <span class="mic-icon">🎤</span>
        </button>

        <button 
          v-if="isLoading"
          type="button"
          @click="triggerStop" 
          class="tray-icon-btn stop-btn"
        >
          <div class="stop-square"></div>
        </button>

        <button 
          v-else
          type="button"
          @click="triggerSend" 
          class="tray-icon-btn send-btn"
          :disabled="!internalInput.trim()"
        >
          <span>▲</span>
        </button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  isLoading: Boolean
})
const emit = defineEmits(['send-message', 'stop-generation', 'attach-click'])

const internalInput = ref('')
const isMenuOpen = ref(ref(false))
const isListening = ref(false)

const triggerSend = () => {
  if (!internalInput.value.trim() || props.isLoading) return
  emit('send-message', internalInput.value)
  internalInput.value = ''
}

const triggerStop = () => {
  emit('stop-generation')
}

const toggleVoiceRecognition = () => {
  isListening.value = !isListening.value
  // Auto-detection logic hooks here smoothly
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