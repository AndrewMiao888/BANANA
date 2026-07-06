<template>
  <div class="chat-input-container">
    <div class="menu-wrapper">
      <button 
        @click="isMenuOpen = !isMenuOpen" 
        class="action-toggle-btn"
        :class="{ 'active': isMenuOpen }"
        type="button"
      >
        ＋
      </button>

      <transition name="dropdown">
        <ul v-if="isMenuOpen" class="actions-dropdown">
          <li @click="handleAction('image')">🖼️ Upload Image</li>
          <li @click="handleAction('file')">📁 Upload File</li>
          <li @click="handleAction('code')">💻 Snippet</li>
        </ul>
      </transition>
    </div>

    <textarea 
      v-model="inputMessage" 
      placeholder="Type a message..." 
      class="large-chat-textarea"
      @keydown.enter.prevent="sendMessage"
    ></textarea>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const isMenuOpen = ref(false)
const inputMessage = ref('')
const emit = defineEmits(['send', 'action'])

const handleAction = (type) => {
  isMenuOpen.value = false
  emit('action', type)
}

const sendMessage = () => {
  if (!inputMessage.value.trim()) return
  emit('send', inputMessage.value)
  inputMessage.value = ''
}
</script>

<style scoped>
.chat-input-container {
  display: flex;
  gap: 1rem;
  align-items: flex-end;
  max-width: 1000px;
  margin: 0 auto;
  padding: 1rem;
}

.menu-wrapper {
  position: relative;
}

.action-toggle-btn {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 2px solid #ccc;
  background: #f9f9f9;
  font-size: 1.5rem;
  cursor: pointer;
  transition: transform 0.2s, background-color 0.2s;
}

.action-toggle-btn.active {
  transform: rotate(45deg);
  background: #e0e0e0;
}

.actions-dropdown {
  position: absolute;
  bottom: 60px;
  left: 0;
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  list-style: none;
  padding: 0.5rem 0;
  margin: 0;
  width: 180px;
  z-index: 50;
}

.actions-dropdown li {
  padding: 0.75rem 1rem;
  cursor: pointer;
  font-size: 1rem;
}

.actions-dropdown li:hover {
  background: #f5f5f5;
}

.large-chat-textarea {
  flex: 1;
  font-size: 1.15rem; /* Scales text size larger */
  padding: 0.75rem 1rem;
  border-radius: 12px;
  border: 1px solid #ccc;
  resize: none;
  min-height: 48px;
}
</style>