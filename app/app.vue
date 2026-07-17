<template>
  <div class="bg-zinc-950 text-zinc-100 min-h-screen selection:bg-yellow-500/20 selection:text-yellow-300 antialiased">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'

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