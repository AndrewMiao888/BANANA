import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  // Enables Nuxt 4 directory structures (app/ layouts/, pages/, components/) explicitly
  future: {
    compatibilityVersion: 4
  },

  runtimeConfig: {
    groqApiKey: process.env.GROQ_API_KEY || '',
    tavilyApiKey: process.env.TAVILY_API_KEY || '',
    homeOllamaUrl: process.env.HOME_OLLMA_URL || 'http://localhost:11434',
    bananaSystemPrompt: process.env.BANANA_SYSTEM_PROMPT || 'You are the secure BANANA Core system assistant.'
  },

  compatibilityDate: '2026-07-17',

  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {}
    }
  }
})