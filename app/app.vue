<template>
  <div class="bg-zinc-950 text-zinc-100 min-h-screen selection:bg-yellow-500/20 selection:text-yellow-300">
    <NuxtPage />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'

// Synchronize global layout height for mobile browser viewports (prevents jumping or cutoff on Safari/Chrome)
const setVhProperty = () => {
  document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`)
}

onMounted(() => {
  setVhProperty()
  window.addEventListener('resize', setVhProperty)
})

onUnmounted(() => {
  window.removeEventListener('resize', setVhProperty)
})
</script>

<style>
/* Global custom scrollbars and base transitions */
.custom-scrollbar::-webkit-scrollbar {
  width: 5px;
  height: 5px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #27272a;
  border-radius: 99px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #3f3f46;
}

/* Base animations */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
.animate-fade-in {
  animation: fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
</style>