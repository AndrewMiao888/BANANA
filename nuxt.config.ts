import { defineNuxtConfig } from 'nuxt/config'
import tailwindcss from '@tailwindcss/vite'
import fs from 'node:fs'
import path from 'node:path'

// Helper function to safely read the prompt file
const getSystemPrompt = () => {
  try {
    const filePath = path.resolve(process.cwd(), 'system_prompt.txt')
    return fs.readFileSync(filePath, 'utf-8')
  } catch (e) {
    console.warn('⚠️ Could not load system_prompt.txt, using fallback.')
    return 'You are BANANA AI.'
  }
}

export default defineNuxtConfig({
  // Enables Nuxt 4 directory structures
  future: {
    compatibilityVersion: 4
  },

  // Global head configuration for KaTeX
  app: {
    head: {
      link: [
        { 
          rel: 'stylesheet', 
          href: 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css' 
        }
      ]
    }
  },

  // Global CSS configuration for Tailwind v4
  css: ['~/assets/css/main.css'],

  // Direct Vercel environment mapping & dynamic file fallback
  runtimeConfig: {
    groqApiKey: process.env.GROQ_API_KEY || '',
    tavilyApiKey: process.env.TAVILY_API_KEY || '',
    homeOllamaUrl: process.env.HOME_OLLMA_URL || 'http://localhost:11434',
    bananaSystemPrompt: process.env.BANANA_SYSTEM_PROMPT || getSystemPrompt()
  },

  compatibilityDate: '2026-07-17',

  vite: {
    plugins: [
      tailwindcss()
    ]
  },

  // Clean Nitro configuration without spread hacks
  nitro: {
    vercel: {
      functions: {
        maxDuration: 60
      }
    }
  }
})