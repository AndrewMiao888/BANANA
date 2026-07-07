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

      <div class="sidebar-header">
  <button @click="isSidebarOpen = !isSidebarOpen" class="tooltip-btn toggle-sidebar-btn">
    <span v-if="isSidebarOpen">📁</span>
    <span v-else>📂</span>
    <span class="tooltip">Toggle Sidebar</span>
  </button>
  
  <button v-if="isSidebarOpen" @click="startNewChat" class="tooltip-btn new-chat-btn">
    <span class="new-chat-icon">📝</span>
    <span>New chat</span>
    <span class="tooltip">Create New Chat</span>
  </button>
</div>

<div v-if="isSidebarOpen" class="sidebar-body">
  
  <div class="search-box">
    <span class="search-icon">🔍</span>
    <input 
      v-model="searchQuery" 
      type="text" 
      placeholder="Search chats" 
      class="search-input" 
    />
  </div>

  <div class="recents-section">
    <div class="recents-title">Recents</div>
    <div class="recents-scrollbar-container">
      <ul class="chat-list">
  <li 
    v-for="chat in filteredChats" 
    :key="savedSessions.indexOf(chat)"
    class="chat-item"
    :class="{ 'active-session': currentSessionIndex === savedSessions.indexOf(chat) }"
    @click="loadPastChat(savedSessions.indexOf(chat))"
  >
    <span class="chat-bubble-icon">💬</span>
    <span class="chat-title-text">{{ chat.title }}</span>
  </li>
  
  <li v-if="filteredChats.length === 0" class="no-chats-found">
    No chats found
  </li>
</ul>
    </div>
  </div>

  <div class="sidebar-footer">
    <button class="tooltip-btn action-pill-btn">
      <span>🌟 BANANA Features</span>
      <span class="tooltip">Explore Premium Core Matrix Capabilities</span>
    </button>
  </div>
</div>

<button 
  v-if="!isSidebarOpen" 
  @click="isSidebarOpen = true" 
  class="tooltip-btn floating-open-btn"
>
  📂
  <span class="tooltip">Open Sidebar</span>
</button>

      <footer class="footer-input-tray">
        <div class="chat-input-container">
          <footer class="footer-input-tray">
        <ChatInput 
          v-model="userInput"
          :is-loading="isLoading"
          @submit="submitMessage"
          @stop="handleAbortTransmission"
        />
      </footer>

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

// --- UNIFIED STATE MANAGEMENT ---
const userInput = ref('')
const isLoading = ref(false)
const isMenuOpen = ref(false)
const chatWindow = ref(null)
let currentAbortController = null // Tracks active network requests to stop them mid-generation

// Default System Prompt
const defaultSystemMessage = {
  role: 'system',
  content: 'You are BANANA system core agent. You are helpful, precise, and highly capable.'
}

const chatHistory = ref([defaultSystemMessage])

// --- COMPUTED PROPERTIES ---
// We hide the 'system' prompt from the user interface layout
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

// --- MESSAGES SUBMISSION INTERACTION PIPELINE ---
// --- MESSAGES SUBMISSION INTERACTION PIPELINE (MEMORY SAFE) ---
const submitMessage = async () => {
  const cleanInput = userInput.value.trim()
  if (!cleanInput || isLoading.value) return

  // 1. Instantly append request block to the visual screen history
  chatHistory.value.push({ role: 'user', content: cleanInput })
  userInput.value = ''
  isLoading.value = true
  isMenuOpen.value = false // close menu if open
  await scrollWindowToBottom()

  // 2. Provision Abort Controller logic handler to track active HTTP streams
  currentAbortController = new AbortController()

  try {
    // 💡 THE MEMORY WINDOW FIX:
    // Extract the very first message (the system prompt) so it's NEVER lost
    const systemPrompt = chatHistory.value[0]
    
    // Grab only the 6 most recent messages so token sizes stay small
    const recentHistory = chatHistory.value.slice(-10)
    
    // Package them safely together before sending to the backend
    const optimizedPayload = [systemPrompt, ...recentHistory]

    // Pass the small, optimized message window to your agent file
    const finalAiReply = await runAgent1Core(optimizedPayload)
    
    // Safety verification check ensures state wasn't cleared out or aborted early
    if (isLoading.value) {
      chatHistory.value.push({ role: 'assistant', content: finalAiReply })
    }
  } catch (error) {
    console.error("Transmission breakdown handled:", error)
    // Only show visible error messages if the action wasn't intentionally canceled
    if (isLoading.value) {
      chatHistory.value.push({ 
        role: 'assistant', 
        content: 'Connection Error: BANANA core limits exceeded. Please wait a minute or clear history.' 
      })
    }
  } finally {
    isLoading.value = false
    currentAbortController = null
    await scrollWindowToBottom()
  }
}
/**
 * Handles the '@stop' event emitted from ChatInput when clicked mid-generation
 */
const handleAbortTransmission = () => {
  if (currentAbortController) {
    currentAbortController.abort() // Cancel network fetch loop
  }
  isLoading.value = false // Release ui execution locked loops state immediately
  chatHistory.value.push({ 
    role: 'assistant', 
    content: '_Generation stopped by Banana Admin._' 
  })
}

// --- ADDITIONAL SIDEBAR STATE FEATURES ---
const isSidebarOpen = ref(true)
const searchQuery = ref('')

// --- 1. SESSION TRACKING & ACTIVE LIST CONTROLLER ---
// Holds the list of past chat sessions. Automatically loads from the browser storage.
const savedSessions = ref([])

// Tracks which session index is currently open (null means a brand new unsaved chat)
const currentSessionIndex = ref(null)

// --- 2. AUTOMATIC LOADING WHEN THE PAGE OPENS ---
onMounted(() => {
  // Try to load any previously saved sidebar session arrays
  const storedSessions = localStorage.getItem('banana_saved_sessions')
  if (storedSessions) {
    savedSessions.value = JSON.parse(storedSessions)
  }

  // Load the current active open conversation
  const activeChat = localStorage.getItem('banana_chat_history')
  if (activeChat) {
    chatHistory.value = JSON.parse(activeChat)
  }
  
  // Also track which index was last being viewed
  const storedIdx = localStorage.getItem('banana_current_session_index')
  if (storedIdx !== null) {
    currentSessionIndex.value = JSON.parse(storedIdx)
  }

  scrollWindowToBottom()
})

// --- 3. AUTO-SAVE HOOKS (WATCHERS) ---
// Watch for changes to the chat list and update browser storage automatically
watch(savedSessions, (newSessions) => {
  localStorage.setItem('banana_saved_sessions', JSON.stringify(newSessions))
}, { deep: true })

watch(currentSessionIndex, (newIdx) => {
  localStorage.setItem('banana_current_session_index', JSON.stringify(newIdx))
})


// --- 4. OPTIMIZED INTERACTION FUNCTIONS TO PASTE/UPDATE ---

// Replaces your old startNewChat to clear layout state cleanly
const startNewChat = () => {
  chatHistory.value = [defaultSystemMessage]
  currentSessionIndex.value = null
  localStorage.removeItem('banana_chat_history')
  isMenuOpen.value = false
}

// Loads a past conversation tree when clicked from the sidebar list
const loadPastChat = (index) => {
  const selectedChat = savedSessions.value[index]
  if (selectedChat && selectedChat.history) {
    chatHistory.value = [...selectedChat.history]
    currentSessionIndex.value = index
  }
  scrollWindowToBottom()
}

// 💡 ADD THIS RIGHT AFTER A SUCCESSFUL AI RESPONSE INSIDE YOUR `submitMessage` FUNCTION:
// This function updates the sidebar item with the new text or creates a new row if it's a new chat!
const updateSidebarTracking = () => {
  // Find the first user message text to name the chat link title automatically
  const firstUserMsg = chatHistory.value.find(msg => msg.role === 'user')?.content || 'New Chat Session'
  const cleanTitle = firstUserMsg.length > 25 ? firstUserMsg.substring(0, 25) + '...' : firstUserMsg

  if (currentSessionIndex.value !== null && savedSessions.value[currentSessionIndex.value]) {
    // Update existing active historical node tree container
    savedSessions.value[currentSessionIndex.value].history = [...chatHistory.value]
  } else {
    // Create a new sidebar row listing item
    savedSessions.value.unshift({
      title: cleanTitle,
      history: [...chatHistory.value]
    })
    currentSessionIndex.value = 0 // Anchor active tracking down to the new row item
  }
}

// Auto-filters matching row items live as the user types
const filteredChats = computed(() => {
  if (!searchQuery.value.trim()) return savedSessions.value
  return savedSessions.value.filter(chat => 
    chat.title.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

// Action rule to click and retrieve standard workspace items

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

/* --- SIDEBAR TOGGLE TRANSITIONS & COLLAPSE --- */
.sidebar {
  transition: width 0.25s ease !important;
}
.sidebar-collapsed {
  width: 0px !important;
  border-right: none !important;
}

/* --- THE HOVER CSS TOOLTIP PATTERN --- */
.tooltip-btn {
  position: relative;
}
.tooltip {
  position: absolute;
  bottom: -35px;
  left: 50%;
  transform: translateX(-50%);
  background-color: #000000;
  color: #ffffff;
  font-size: 0.75rem;
  padding: 0.4rem 0.6rem;
  border-radius: 6px;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s ease, transform 0.15s ease;
  z-index: 9999;
  box-shadow: 0 4px 10px rgba(0,0,0,0.4);
}
.tooltip-btn:hover .tooltip {
  opacity: 1;
  transform: translateX(-50%) translateY(4px);
}

/* --- CHAT FILTER BOX & SEARCH INPUT --- */
.search-box {
  display: flex;
  align-items: center;
  background-color: #202020;
  border-radius: 8px;
  padding: 0.4rem 0.6rem;
  margin: 0.5rem 0;
  border: 1px solid #303030;
}
.search-input {
  background: transparent;
  border: none;
  outline: none;
  color: #fff;
  font-size: 0.85rem;
  margin-left: 0.5rem;
  width: 100%;
}

/* --- CUSTOM CHAT RECENT LIST SCROLLBAR TRACKS --- */
.recents-scrollbar-container {
  overflow-y: auto;
  max-height: 350px;
}
.recents-scrollbar-container::-webkit-scrollbar {
  width: 6px;
}
.recents-scrollbar-container::-webkit-scrollbar-track {
  background: transparent;
}
.recents-scrollbar-container::-webkit-scrollbar-thumb {
  background-color: #383838;
  border-radius: 10px;
}
.recents-scrollbar-container::-webkit-scrollbar-thumb:hover {
  background-color: #4b4b4b;
}

/* --- COMPONENT ITEMS --- */
.chat-list { list-style: none; padding: 0; margin: 0; }
.chat-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.85rem;
  color: #c5c5c5;
}
.chat-item:hover { background-color: #212121; color: #fff; }
.no-chats-found { font-size: 0.8rem; color: #555; padding: 0.5rem; text-align: center; }
.floating-open-btn { position: absolute; top: 12px; left: 12px; background-color: #171717; border: 1px solid #333; color: #fff; padding: 0.5rem; border-radius: 8px; z-index: 999; }
</style>