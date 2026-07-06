<template>
  <div class="platform-layout chat-window-max-bound">
    <header class="header-section">
      <h1 class="platform-title">BANANA</h1>
    </header>

    <main class="chat-workspace">
      <div class="chat-log-window" ref="chatWindow">
        <div v-if="chatHistory.length <= 1" class="empty-state-hero">
          <h2>What's on the agenda today?</h2>
        </div>

        <div 
          v-else
          v-for="(msg, index) in chatHistory.slice(1)" 
          :key="index" 
          :class="['message-card', msg.role]"
        >
          <div class="sender-label">
            {{ msg.role === 'user' ? 'Client Request' : 'Neural Matrix Response' }}
          </div>
          <div class="response-text-block">
            <p v-for="(paragraph, pIdx) in msg.content.split('\n')" :key="pIdx">
              {{ paragraph }}
            </p>
          </div>
        </div>
        
        <div v-if="isLoading" class="message-card assistant loading">
          <div class="sender-label">Neural Matrix Response</div>
          <div class="response-text-block status">Processing parameters...</div>
        </div>
      </div>

      <footer class="footer-input-tray">
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
                <li @click="handleAction('image')">🖼️ Create an image</li>
                <li @click="handleAction('edit')">✍️ Write or edit</li>
                <li @click="handleAction('search')">🔍 Look something up</li>
                <li @click="handleAction('file')">📁 Upload file</li>
              </ul>
            </transition>
          </div>

          <input 
            v-model="userInput" 
            type="text"
            placeholder="Ask anything" 
            class="large-chat-input"
            @keydown.enter.prevent="submitMessage"
            :disabled="isLoading"
          />
        </div>
      </footer>
    </main>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import { runAgent1Core } from '~~/src/agents'

// --- STATE MANAGEMENT ---
const userInput = ref('')
const isMenuOpen = ref(false)
const isLoading = ref(false)
const chatWindow = ref(null)

const chatHistory = ref([
  {
    role: 'system',
    content: 'You are BANANA system core agent.'
  }
])

// --- ACTIONS HANDLERS ---
const handleAction = (actionType) => {
  isMenuOpen.value = false
  alert(`Action chosen: ${actionType}`)
}

const scrollWindowToBottom = async () => {
  await nextTick()
  if (chatWindow.value) {
    chatWindow.value.scrollTop = chatWindow.value.scrollHeight
  }
}

const submitMessage = async () => {
  const cleanInput = userInput.value.trim()
  if (!cleanInput || isLoading.value) return

  chatHistory.value.push({ role: 'user', content: cleanInput })
  userInput.value = ''
  isLoading.value = true
  await scrollWindowToBottom()

  try {
    const finalAiReply = await runAgent1Core(chatHistory.value)
    chatHistory.value.push({ role: 'assistant', content: finalAiReply })
  } catch (error) {
    console.error("Transmission breakdown:", error)
    chatHistory.value.push({ 
      role: 'assistant', 
      content: 'Critical Node Error: Lost context telemetry. Please check configuration.' 
    })
  } finally {
    isLoading.value = false
    await scrollWindowToBottom()
  }
}
</script>

<style scoped>
/* --- STRUCTURAL BLUEPRINTS --- */
.platform-layout {
  font-family: Söhne, system-ui, -apple-system, sans-serif;
  color: #ececec;
  background-color: #171717;
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding: 1rem 1.5rem;
  box-sizing: border-box;
}

.chat-window-max-bound {
  max-width: 1000px;
  margin: 0 auto;
  width: 100%;
}

.header-section {
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
}

.platform-title {
  font-size: 1.25rem !important;
  font-weight: 600;
  color: #b4b4b4;
  margin: 0;
}

.chat-workspace {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat-log-window {
  flex: 1;
  overflow-y: auto;
  padding: 1rem 0;
  display: flex;
  flex-direction: column;
}

/* Empty State Hero Prompt */
.empty-state-hero {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4rem;
}

.empty-state-hero h2 {
  font-size: 2.25rem !important;
  font-weight: 500;
  color: #ececec;
  letter-spacing: -0.01em;
}

.message-card {
  margin-bottom: 2rem;
  padding: 0.5rem 1rem;
  width: 100%;
}

.sender-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #b4b4b4;
  margin-bottom: 0.5rem;
}

/* --- THE BIGGER READABLE CORES --- */
.response-text-block {
  font-size: 1.25rem !important;
  line-height: 1.75;
  color: #ececec;
}

.response-text-block p {
  margin: 0 0 1rem 0;
}

.status {
  color: #b4b4b4;
  font-style: italic;
}

/* --- INPUT CONTAINER SYSTEM --- */
.footer-input-tray {
  padding-bottom: 1.5rem;
  background-color: #171717;
}

.chat-input-container {
  display: flex;
  align-items: center;
  background-color: #2f2f2f;
  border-radius: 28px;
  padding: 0.5rem 1rem;
  position: relative;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

.menu-wrapper {
  display: flex;
  align-items: center;
  position: relative;
}

.action-toggle-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid #424242;
  background-color: transparent;
  color: #b4b4b4;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease, background-color 0.2s ease;
  padding: 0;
}

.action-toggle-btn:hover {
  background-color: #3e3e3e;
  color: #ececec;
}

.action-toggle-btn.active {
  transform: rotate(45deg);
}

.plus-icon {
  font-size: 1.25rem;
  line-height: 1;
}

/* Pop-up Frame Styling */
.actions-dropdown {
  position: absolute;
  bottom: 55px;
  left: 0;
  background-color: #232323;
  border: 1px solid #383838;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.3);
  list-style: none;
  padding: 0.5rem;
  margin: 0;
  width: 200px;
  z-index: 999;
}

.actions-dropdown li {
  padding: 0.75rem 1rem;
  cursor: pointer;
  font-size: 1.05rem;
  color: #cdcdcd;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.actions-dropdown li:hover {
  background-color: #2f2f2f;
  color: #ececec;
}

.large-chat-input {
  flex: 1;
  font-size: 1.25rem;
  padding: 0.5rem 0.75rem;
  background: transparent;
  border: none;
  color: #ececec;
  outline: none;
}

.large-chat-input::placeholder {
  color: #b4b4b4;
}

/* Vue Dropdown Transitions Animation */
.dropdown-enter-active, .dropdown-leave-active {
  transition: opacity 0.15s, transform 0.15s;
}
.dropdown-enter-from, .dropdown-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>