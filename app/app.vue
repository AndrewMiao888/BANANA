<template>
  <div class="w-screen bg-zinc-950 text-zinc-100 selection:bg-yellow-400/20 antialiased overflow-hidden">
    <NuxtPage />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'

onMounted(() => {
  // Fix dynamic view height scaling on mobile browsers (Safari/Chrome toolbars)
  const setVh = () => {
    document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`)
  }
  setVh()
  window.addEventListener('resize', setVh)
})
</script>

<style>
@import "tailwindcss/base";
@import "tailwindcss/components";
@import "tailwindcss/utilities";

html, body {
  margin: 0;
  padding: 0;
  background-color: #09090b;
  overflow: hidden;
  height: 100%;
}
</style>