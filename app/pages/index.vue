<template>
  <div class="app-container">
    <aside class="sidebar">
      <div class="sidebar-top">
        <button @click="startNewChat" class="new-chat-btn">
          <span class="btn-icon">＋</span> New chat
        </button>
      </div>
      
      <div class="sidebar-bottom">
        <div class="user-profile">
          <div class="avatar">BA</div>
          <span class="username">Banana Admin</span>
        </div>
      </div>
    </aside>

    <main class="main-workspace">
      <header class="top-header">
        <h1 class="platform-title">BANANA <span class="version-tag">v2.0</span></h1>
      </header>

      <div class="chat-log-window" ref="chatWindow">
        <div v-if="visibleMessages.length === 0" class="empty-state-hero">
          <h2>What's on the agenda today?</h2>
        </div>

        <div 
          v-else
          class="message-list"
        >
          <div 
            v-for="(msg, index) in visibleMessages" 
            :key="index" 
            :class="['message-card', msg.role]"
          >
            <div class="sender-label">
              <span v-if="msg.role === 'user'" class="avatar-small user-avatar">BA</span>
              <span v-else class="avatar-small ai-avatar">🍌</span>
              {{ msg.role === 'user' ? 'Banana Admin' : 'BANANA Core' }}
            </div>
            <div class="response-text-block">
              <p v-for="(paragraph, pIdx) in msg.content.split('\n')" :key="pIdx">
                {{ paragraph }}
              </p>
            </div>
          </div>
          
          <div v-if="isLoading" class="message-card assistant loading">
            <div class="sender-label">
              <span class="avatar-small ai-avatar">🍌</span> BANANA Core
            </div>
            <div class="response-text-block status">Analyzing request...</div>
          </div>
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
import { ref, onMounted, watch, computed, nextTick } from 'vue'
import { runAgent1Core } from '~~/src/agents'

// --- STATE MANAGEMENT ---
const userInput = ref('')
const isMenuOpen = ref(false)
const isLoading = ref(false)
const chatWindow = ref(null)

// Default System Prompt
const defaultSystemMessage = {
  role: 'system',
  content: 'You are BANANA system core agent. You are helpful, precise, and highly capable.'
}

const chatHistory = ref([defaultSystemMessage])

// --- COMPUTED PROPERTIES ---
// We hide the 'system' prompt from the user interface
const visibleMessages = computed(() => {
  return chatHistory.value.filter(msg => msg.role !== 'system')
})

// --- LIFECYCLE & LOCAL STORAGE ---
onMounted(() => {
  // Load saved chat history when the page loads
  const savedChat = localStorage.getItem('banana_chat_history')
  if (savedChat) {
    chatHistory.value = JSON.parse(savedChat)
  }
  scrollWindowToBottom()
})

// Watch for any changes to chatHistory and save them to local storage automatically
watch(chatHistory, (newHistory) => {
  localStorage.setItem('banana_chat_history', JSON.stringify(newHistory))
}, { deep: true })

// --- ACTIONS HANDLERS ---
const startNewChat = () => {
  chatHistory.value = [defaultSystemMessage]
  localStorage.removeItem('banana_chat_history')
  isMenuOpen.value = false
}

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

  // 1. Add user message
  chatHistory.value.push({ role: 'user', content: cleanInput })
  userInput.value = ''
  isLoading.value = true
  isMenuOpen.value = false // close menu if open
  await scrollWindowToBottom()

  try {
    // 2. Fetch AI response
    const finalAiReply = await runAgent1Core(chatHistory.value)
    
    // 3. Add AI message
    chatHistory.value.push({ role: 'assistant', content: finalAiReply })
  } catch (error) {
    console.error("Transmission breakdown:", error)
    chatHistory.value.push({ 
      role: 'assistant', 
      content: 'Connection Error: Failed to communicate with BANANA Core. Please try again.' 
    })
  } finally {
    isLoading.value = false
    await scrollWindowToBottom()
  }
}
</script>

<style scoped>
/* --- STRUCTURAL BLUEPRINTS --- */
.app-container {
  display: flex;
  height: 100vh;
  font-family: Söhne, system-ui, -apple-system, sans-serif;
  color: #ececec;
  background-color: #212121; /* ChatGPT-style main background */
  overflow: hidden;
}

/* --- SIDEBAR --- */
.sidebar {
  width: 260px;
  background-color: #171717; /* Darker sidebar */
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 1rem 0.75rem;
  box-sizing: border-box;
  border-right: 1px solid #333;
}

.new-chat-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.75rem 1rem;
  background-color: transparent;
  color: #ececec;
  border: 1px solid #444;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.new-chat-btn:hover {
  background-color: #2a2a2a;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 8px;
  cursor: pointer;
}

.user-profile:hover {
  background-color: #2a2a2a;
}

.avatar {
  width: 32px;
  height: 32px;
  background-color: #5b62f4;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  font-weight: bold;
}

.username {
  font-size: 0.95rem;
  font-weight: 500;
}

/* --- MAIN WORKSPACE --- */
.main-workspace {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  width: calc(100% - 260px);
}

.top-header {
  padding: 1rem 1.5rem;
  display: flex;
  align-items: center;
}

.platform-title {
  font-size: 1.25rem !important;
  font-weight: 600;
  color: #b4b4b4;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.version-tag {
  font-size: 0.75rem;
  background: #333;
  padding: 0.15rem 0.5rem;
  border-radius: 12px;
}

/* --- CHAT LOG --- */
.chat-log-window {
  flex: 1;
  overflow-y: auto;
  padding: 1rem 0;
  display: flex;
  flex-direction: column;
}

.message-list {
  max-width: 850px;
  margin: 0 auto;
  width: 100%;
  padding: 0 1.5rem;
}

.empty-state-hero {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-state-hero h2 {
  font-size: 2.25rem !important;
  font-weight: 600;
  color: #ececec;
  letter-spacing: -0.01em;
}

.message-card {
  margin-bottom: 2rem;
  width: 100%;
}

.sender-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  color: #ececec;
  margin-bottom: 0.5rem;
}

.avatar-small {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: bold;
}

.user-avatar { background-color: #5b62f4; }
.ai-avatar { background-color: #10a37f; font-size: 0.9rem; }

.response-text-block {
  font-size: 1.15rem !important;
  line-height: 1.6;
  color: #d1d5db;
  padding-left: 2rem; /* Indent under avatar */
}

.response-text-block p {
  margin: 0 0 1rem 0;
}

.status {
  color: #888;
  font-style: italic;
}

/* --- INPUT CONTAINER SYSTEM --- */
.footer-input-tray {
  padding: 1rem 1.5rem 2rem 1.5rem;
  max-width: 850px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
}

.chat-input-container {
  display: flex;
  align-items: center;
  background-color: #2f2f2f;
  border-radius: 28px;
  padding: 0.5rem 1rem;
  position: relative;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  border: 1px solid #444;
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

/* Dropdown Menu */
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
  font-size: 1rem;
  color: #cdcdcd;
  border-radius: 6px;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.actions-dropdown li:hover {
  background-color: #2f2f2f;
  color: #ececec;
}

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

/* Animations */
.dropdown-enter-active, .dropdown-leave-active {
  transition: opacity 0.15s, transform 0.15s;
}
.dropdown-enter-from, .dropdown-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>