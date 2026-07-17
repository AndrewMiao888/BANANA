import { defineNuxtConfig } from 'nuxt/config'
import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  // Enables Nuxt 4 directory structures (app/ layouts/, pages/, components/)
  future: {
    compatibilityVersion: 4
  },

  // Declare global styles containing Tailwind v4 directives
  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    groqApiKey: process.env.GROQ_API_KEY || '',
    tavilyApiKey: process.env.TAVILY_API_KEY || '',
    homeOllamaUrl: process.env.HOME_OLLMA_URL || 'http://localhost:11434',
    bananaSystemPrompt: process.env.BANANA_SYSTEM_PROMPT || 'You are the secure BANANA Core system assistant.'
  },

  compatibilityDate: '2026-07-17',

  // Use the Vite integration for Tailwind v4 (removes legacy PostCSS compilation issues)
  vite: {
    plugins: [
      tailwindcss()
    ]
  }
})