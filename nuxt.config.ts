import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  // 🎨 Core UI Modules
  modules: [
    '@nuxtjs/tailwindcss'
  ],

  // 🚀 Nuxt 4 Architecture Settings
  future: {
    compatibilityVersion: 4, // Enables modern folder structure (app/) and strict builds
  },

  // Set compliance tracking baseline date
  compatibilityDate: '2024-04-03',

  // 🔒 SECURE PRIVATE RUNTIME CONFIGURATION (Server-Side Only)
  // These properties are hidden from the browser bundle and never leak to the client.
  runtimeConfig: {
    groqApiKey: process.env.GROQ_API_KEY,         // Pulls from local .env or Vercel config
    homeOllamaUrl: process.env.HOME_OLLAMA_URL,   // Exposes your secure home tunnel endpoint
    bananaSystemPrompt: process.env.BANANA_SYSTEM_PROMPT // Modifiable core system instruction block
  }
})